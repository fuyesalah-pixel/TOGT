"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, Pause, Play, Volume2, VolumeX, X } from "lucide-react";

/**
 * Luxury video player used by the About section and gallery videos.
 *
 * YouTube links play through the official IFrame API with every piece of
 * YouTube chrome (title, share, "Watch on YouTube", native controls)
 * switched off; direct video files play through a native <video>. Both get
 * the same custom control bar: play/pause, seek timeline, time readout,
 * volume and a zoom in/out button. The player DOM node never re-mounts when
 * zooming (only its classes change) so playback continues seamlessly.
 */

type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  mute(): void;
  unMute(): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
};

type YTNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: { target: YTPlayer }) => void;
        onStateChange?: (event: { data: number; target: YTPlayer }) => void;
      };
    },
  ) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<YTNamespace> | null = null;

function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT!);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return ytApiPromise;
}

/** Extract the YouTube video id from any watch/share/shorts/embed URL. */
export function youTubeId(url: string): string | null {
  const raw = (url ?? "").trim();
  const match = raw.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (match) return match[1];
  if (/^youtube\.com\/embed\/[A-Za-z0-9_-]{6,}$/.test(new URL(raw, "https://x.y").pathname)) return new URL(raw).pathname.split("/").pop() ?? null;
  return null;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogv|ogg|mov|m4v)(\?|#|$)/i.test(url ?? "");
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function LuxuryVideoPlayer({ url, title, className = "" }: { url: string; title?: string; className?: string }) {
  const videoId = youTubeId(url);
  const directFile = !videoId && isDirectVideo(url);

  const hostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [zoomed, setZoomed] = useState(false);
  const [controlsShown, setControlsShown] = useState(true);
  const [posterStep, setPosterStep] = useState(0);

  const revealControls = useCallback(() => {
    setControlsShown(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsShown(false), 2600);
  }, []);

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

  // Poll the active player for current time / duration / state.
  useEffect(() => {
    if (!started) return;
    const tick = setInterval(() => {
      if (videoId && playerRef.current) {
        const player = playerRef.current;
        try {
          setCurrent(player.getCurrentTime() ?? 0);
          const d = player.getDuration();
          if (d > 0) setDuration(d);
          const state = player.getPlayerState();
          setPlaying(state === 1);
        } catch { /* player not ready yet */ }
      } else if (!videoId && videoRef.current) {
        setCurrent(videoRef.current.currentTime);
        if (videoRef.current.duration > 0) setDuration(videoRef.current.duration);
        setPlaying(!videoRef.current.paused && !videoRef.current.ended);
      }
    }, 250);
    return () => clearInterval(tick);
  }, [started, videoId]);

  // Escape exits zoom.
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setZoomed(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  const start = useCallback(async () => {
    if (started) return;
    setStarted(true);
    revealControls();
    if (videoId) {
      const YT = await loadYouTubeApi();
      if (!hostRef.current) return;
      playerRef.current = new YT.Player(hostRef.current, {
        videoId,
        playerVars: {
          controls: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          autoplay: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            event.target.setVolume(volume);
            event.target.playVideo();
          },
        },
      });
    } else if (videoRef.current) {
      videoRef.current.volume = volume / 100;
      await videoRef.current.play().catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, videoId, revealControls]);

  const togglePlay = useCallback(() => {
    if (videoId && playerRef.current) {
      const state = playerRef.current.getPlayerState();
      if (state === 1) playerRef.current.pauseVideo(); else playerRef.current.playVideo();
    } else if (videoRef.current) {
      if (videoRef.current.paused) videoRef.current.play().catch(() => undefined); else videoRef.current.pause();
    }
    revealControls();
  }, [videoId, revealControls]);

  const seek = useCallback((seconds: number) => {
    if (videoId && playerRef.current) playerRef.current.seekTo(seconds, true);
    else if (videoRef.current) videoRef.current.currentTime = seconds;
    setCurrent(seconds);
    revealControls();
  }, [videoId, revealControls]);

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    if (videoId && playerRef.current) { if (next) playerRef.current.mute(); else playerRef.current.unMute(); }
    else if (videoRef.current) videoRef.current.muted = next;
    revealControls();
  }, [muted, videoId, revealControls]);

  const changeVolume = useCallback((value: number) => {
    setVolume(value);
    setMuted(value === 0);
    if (videoId && playerRef.current) { playerRef.current.setVolume(value); if (value > 0) playerRef.current.unMute(); }
    else if (videoRef.current) { videoRef.current.volume = value / 100; if (value > 0) videoRef.current.muted = false; }
    revealControls();
  }, [videoId, revealControls]);

  // Cleanly destroy the YouTube player when unmounted or replaced.
  useEffect(() => () => {
    try { playerRef.current?.destroy(); } catch { /* already gone */ }
    playerRef.current = null;
  }, []);

  if (!url) return null;

  const poster = videoId
    ? posterStep === 0 ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    : null;
  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      className={`group/lv overflow-hidden bg-black ${zoomed ? "fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10" : `relative aspect-video ${className}`}`}
      onMouseMove={revealControls}
      onTouchStart={revealControls}
      role="region"
      aria-label={title ?? "Video player"}
    >
      <div className={`relative w-full ${zoomed ? "h-full max-w-6xl" : "h-full"}`}>
        {/* Video surface: YouTube iframe (created on first play) or native video. */}
        {videoId ? (
          <div className="absolute inset-0">
            {/* Poster stays visible under the player until it starts. */}
            {!started && poster && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={poster}
                alt={title ?? "Video"}
                className="absolute inset-0 h-full w-full object-cover"
                onError={() => setPosterStep((step) => step + 1)}
              />
            )}
            <div ref={hostRef} className={`absolute inset-0 ${started ? "" : "invisible"}`} />
          </div>
        ) : directFile ? (
          <video
            ref={videoRef}
            src={url}
            className="absolute inset-0 h-full w-full object-contain"
            preload="metadata"
            playsInline
            onEnded={() => setPlaying(false)}
          />
        ) : (
          <iframe src={url} title={title ?? "Video"} className="absolute inset-0 h-full w-full" allowFullScreen />
        )}

        {/* Click-catcher: tap anywhere on the video toggles play/pause. */}
        {started && (videoId || directFile) && (
          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            onClick={togglePlay}
            className="absolute inset-x-0 top-0 bottom-14 z-10 cursor-pointer"
          />
        )}

        {/* Big play button + poster (before the first play). */}
        {!started && (
          <button
            type="button"
            onClick={() => void start()}
            aria-label="Play video"
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 transition-colors hover:bg-black/45"
          >
            <span className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-[#FF9300] shadow-[0_10px_40px_rgba(255,147,0,0.5)] transition-transform duration-300 hover:scale-110">
              <Play className="ml-1 h-7 w-7 fill-white text-white md:h-9 md:w-9" />
            </span>
          </button>
        )}

        {/* Zoom close button (only while zoomed). */}
        {zoomed && (
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Exit zoom"
            className="absolute right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Custom control bar — the only chrome this player has. */}
        <div
          className={`absolute inset-x-0 bottom-0 z-20 transition-all duration-300 ${controlsShown || !playing ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
        >
          <div className="h-10 bg-gradient-to-t from-black/85 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 px-3 pb-2.5 md:gap-3 md:px-4">
            <button type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white">
              {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
            </button>

            {/* Seek timeline */}
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-[#FF9300] transition-[width] duration-200" style={{ width: `${progress}%` }} />
              </div>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={current}
                onChange={(event) => seek(Number(event.target.value))}
                aria-label="Seek"
                className="relative z-10 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FF9300] [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#FF9300]"
              />
            </div>

            <span className="hidden select-none text-xs font-medium tabular-nums text-white/80 sm:block">
              {formatTime(current)} / {formatTime(duration)}
            </span>

            {/* Volume */}
            <div className="group/vol flex items-center">
              <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white">
                {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={muted ? 0 : volume}
                onChange={(event) => changeVolume(Number(event.target.value))}
                aria-label="Volume"
                className="w-0 opacity-0 transition-all duration-300 group-hover/vol:mr-1.5 group-hover/vol:w-16 group-hover/vol:opacity-100 md:group-hover/vol:w-20 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white accent-[#FF9300]"
              />
            </div>

            {/* Zoom in / out */}
            <button
              type="button"
              onClick={() => setZoomed((zoom) => !zoom)}
              aria-label={zoomed ? "Zoom out" : "Zoom in"}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white"
            >
              {zoomed ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
