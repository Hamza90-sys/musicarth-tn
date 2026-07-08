import { useEffect, useRef } from "react";
import type { ComponentRef } from "react";
import { useQuery } from "@tanstack/react-query";
import MuxPlayer from "@mux/mux-player-react";
import { PlayCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

export type PlayableLesson = {
  id: string;
  title: string;
  content?: string | null;
  videoUrl?: string | null;
  muxPlaybackId?: string | null;
  videoStatus?: "NONE" | "PENDING" | "PROCESSING" | "READY" | "ERRORED" | null;
};

type PlaybackToken = {
  lessonId: string;
  playbackId: string;
  token: string;
  url: string;
};

const PROGRESS_SAVE_INTERVAL_SECONDS = 30;

/**
 * Plays a lesson via Mux signed playback when the asset is ready, falling back
 * to a legacy direct videoUrl. Reports watch progress to the backend every 30s
 * (spec 10.2) and once more when the player unmounts (e.g. switching lessons).
 */
export function LessonPlayer({
  lesson,
  onSaveProgress,
}: {
  lesson: PlayableLesson;
  onSaveProgress: (lessonId: string, watchPositionSeconds: number, completed: boolean) => void;
}) {
  const muxRef = useRef<ComponentRef<typeof MuxPlayer> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSavedSecondRef = useRef<number>(-1);
  const latestTimeRef = useRef<number>(0);

  const isMux = lesson.videoStatus === "READY" && Boolean(lesson.muxPlaybackId);

  const playbackQuery = useQuery({
    queryKey: ["lesson-playback", lesson.id],
    queryFn: () => apiFetch<PlaybackToken>(`/lessons/${lesson.id}/playback`),
    enabled: isMux,
    staleTime: 10 * 60 * 1000, // token is valid 12h; refetch well before expiry
  });

  // Keep the latest callback in a ref so the cleanup effect below doesn't re-run
  // (and re-save) on every parent re-render — that caused a save→refetch→re-render
  // loop that crashed the page when a short video ended.
  const onSaveProgressRef = useRef(onSaveProgress);
  onSaveProgressRef.current = onSaveProgress;

  // Save a final progress point only when the lesson actually changes / unmounts.
  useEffect(() => {
    const lessonId = lesson.id;
    return () => {
      if (latestTimeRef.current > 0) {
        onSaveProgressRef.current(lessonId, Math.floor(latestTimeRef.current), false);
      }
    };
  }, [lesson.id]);

  const handleTimeUpdate = (seconds: number) => {
    latestTimeRef.current = seconds;
    const currentSecond = Math.floor(seconds);
    if (currentSecond - lastSavedSecondRef.current >= PROGRESS_SAVE_INTERVAL_SECONDS) {
      lastSavedSecondRef.current = currentSecond;
      onSaveProgress(lesson.id, currentSecond, false);
    }
  };

  if (isMux) {
    if (playbackQuery.isLoading) {
      return <div className="flex aspect-video items-center justify-center bg-black/90 text-sm text-white/70">Preparing secure stream…</div>;
    }
    if (playbackQuery.error || !playbackQuery.data) {
      return (
        <div className="flex aspect-video items-center justify-center bg-black/90 px-6 text-center text-sm text-white/70">
          This video could not be loaded. Make sure you are enrolled in the course.
        </div>
      );
    }

    return (
      <MuxPlayer
        ref={muxRef}
        playbackId={playbackQuery.data.playbackId}
        tokens={{ playback: playbackQuery.data.token }}
        streamType="on-demand"
        metadata={{ video_title: lesson.title }}
        accentColor="#7C3AED"
        className="aspect-video w-full bg-black"
        onTimeUpdate={() => handleTimeUpdate(muxRef.current?.currentTime ?? 0)}
        onPause={() => onSaveProgress(lesson.id, Math.floor(muxRef.current?.currentTime ?? 0), false)}
        onEnded={() => onSaveProgress(lesson.id, Math.floor(muxRef.current?.currentTime ?? 0), true)}
      />
    );
  }

  if (lesson.videoUrl) {
    return (
      <video
        key={lesson.id}
        ref={videoRef}
        src={lesson.videoUrl}
        controls
        className="aspect-video w-full bg-black object-cover"
        onTimeUpdate={(event) => handleTimeUpdate(event.currentTarget.currentTime)}
        onPause={(event) => onSaveProgress(lesson.id, Math.floor(event.currentTarget.currentTime), false)}
        onEnded={(event) => onSaveProgress(lesson.id, Math.floor(event.currentTarget.currentTime), true)}
      />
    );
  }

  return (
    <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background text-center">
      <div>
        <PlayCircle className="mx-auto h-12 w-12 text-primary" />
        <p className="mt-3 text-sm font-medium">
          {lesson.videoStatus === "PROCESSING" || lesson.videoStatus === "PENDING"
            ? "Video is still processing"
            : "No video for this lesson yet"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {lesson.videoStatus === "PROCESSING" || lesson.videoStatus === "PENDING"
            ? "Mux is transcoding this upload — check back shortly."
            : "The lesson video will appear here when available."}
        </p>
      </div>
    </div>
  );
}
