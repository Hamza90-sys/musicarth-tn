import { useEffect, useRef, useState } from "react";
import DailyIframe, { type DailyCall } from "@daily-co/daily-js";

/**
 * Embeds a Daily.co WebRTC room. The room URL + (owner) meeting token come from
 * the backend's GET /sessions/:id/room (time-gated). The iframe is torn down on
 * unmount so only one Daily instance ever exists at a time.
 */
export function DailyRoom({
  roomUrl,
  roomToken,
  onLeft,
}: {
  roomUrl: string;
  roomToken: string | null;
  onLeft?: () => void;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const callRef = useRef<DailyCall | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wrapperRef.current || callRef.current) {
      return;
    }

    const call = DailyIframe.createFrame(wrapperRef.current, {
      showLeaveButton: true,
      // Music education: use Daily's high-fidelity "music" audio mode. This turns
      // OFF the speech DSP (noise suppression, echo cancellation, auto-gain) that
      // would otherwise treat an instrument as background noise and cut it out,
      // and raises the bitrate to stereo 256 kbps so the sound stays clean.
      dailyConfig: {
        micAudioMode: { stereo: true, bitrate: 256000 },
      },
      iframeStyle: {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        border: "0",
      },
    });
    callRef.current = call;

    if (onLeft) {
      call.on("left-meeting", onLeft);
    }

    call
      .join({ url: roomUrl, ...(roomToken ? { token: roomToken } : {}) })
      .catch((err: unknown) => setError(String(err)));

    return () => {
      call.destroy().catch(() => undefined);
      callRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <div ref={wrapperRef} className="absolute inset-0" />
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6 text-center text-sm text-white/80">
          The live room could not be joined: {error}
        </div>
      ) : null}
    </div>
  );
}
