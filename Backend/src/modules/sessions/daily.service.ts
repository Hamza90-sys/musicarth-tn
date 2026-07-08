import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DAILY_API_BASE = 'https://api.daily.co/v1';

export interface DailyRoom {
  name: string;
  url: string;
}

@Injectable()
export class DailyService {
  private readonly logger = new Logger(DailyService.name);
  private readonly apiKey: string;
  private readonly domain: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('DAILY_API_KEY', '');
    this.domain = this.config.get<string>('DAILY_DOMAIN', '');
    if (!this.apiKey) {
      this.logger.warn('DAILY_API_KEY not set — live session rooms will not be created.');
    }
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Creates a private Daily room that auto-expires at `expiresAt` and ejects
   * participants when it does. Returns the room name + join URL.
   */
  async createRoom(params: {
    namePrefix: string;
    expiresAt: Date;
  }): Promise<DailyRoom> {
    const exp = Math.floor(params.expiresAt.getTime() / 1000);
    const body = {
      privacy: 'private',
      properties: {
        exp,
        eject_at_room_exp: true,
        enable_screenshare: true,
        enable_chat: true,
        start_video_off: false,
        start_audio_off: false,
      },
    };

    const room = await this.request<{ name: string; url: string }>('POST', '/rooms', body);
    return { name: room.name, url: room.url };
  }

  /**
   * Mints a short-lived meeting token scoped to a single room. The token
   * itself expires at `expiresAt`, so it cannot be reused after the session.
   */
  async createMeetingToken(params: {
    roomName: string;
    userName: string;
    isOwner: boolean;
    expiresAt: Date;
  }): Promise<string> {
    const exp = Math.floor(params.expiresAt.getTime() / 1000);
    const result = await this.request<{ token: string }>('POST', '/meeting-tokens', {
      properties: {
        room_name: params.roomName,
        user_name: params.userName,
        is_owner: params.isOwner,
        exp,
      },
    });
    return result.token;
  }

  async deleteRoom(roomName: string): Promise<void> {
    if (!this.isConfigured) return;
    try {
      await this.request('DELETE', `/rooms/${encodeURIComponent(roomName)}`);
    } catch (error) {
      // A missing/already-deleted room is not fatal for our flow.
      this.logger.warn(`Failed to delete Daily room ${roomName}: ${String(error)}`);
    }
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException('Live video service is not configured');
    }

    const response = await fetch(`${DAILY_API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text();
      this.logger.error(`Daily API ${method} ${path} failed (${response.status}): ${detail}`);
      throw new ServiceUnavailableException('Live video provider request failed');
    }

    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }
}
