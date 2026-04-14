"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/router";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
  onOpenComments?: () => void;
}

export default function VideoPlayer({ video, onOpenComments }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  const [tapCount, setTapCount] = useState(0);
  const [tapSide, setTapSide] = useState<"left" | "right" | "center" | null>(null);
  const [tapTimer, setTapTimer] = useState<NodeJS.Timeout | null>(null);
  const [showIndicator, setShowIndicator] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setShowIndicator(msg);
    setTimeout(() => setShowIndicator(null), 1000);
  };

  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const width = rect.width;
      const side: "left" | "right" | "center" =
        x < width / 3 ? "left" : x > (2 * width) / 3 ? "right" : "center";

      const newCount = tapSide === side ? tapCount + 1 : 1;
      setTapCount(newCount);
      setTapSide(side);

      if (tapTimer) clearTimeout(tapTimer);

      const timer = setTimeout(() => {
        const vid = videoRef.current;
        if (!vid) return;

        if (newCount === 1 && side === "center") {
          // Single tap center: pause/resume
          if (vid.paused) { vid.play(); showFeedback("▶ Play"); }
          else { vid.pause(); showFeedback("⏸ Pause"); }
        } else if (newCount === 2 && side === "right") {
          // Double tap right: +10s
          vid.currentTime = Math.min(vid.duration, vid.currentTime + 10);
          showFeedback("⏩ +10s");
        } else if (newCount === 2 && side === "left") {
          // Double tap left: -10s
          vid.currentTime = Math.max(0, vid.currentTime - 10);
          showFeedback("⏪ -10s");
        } else if (newCount === 3 && side === "center") {
          // Triple tap center: skip to next (go back, next video)
          showFeedback("⏭ Next video");
          router.back();
        } else if (newCount === 3 && side === "right") {
          // Triple tap right: close website
          showFeedback("Closing...");
          setTimeout(() => window.close(), 500);
        } else if (newCount === 3 && side === "left") {
          // Triple tap left: open comments
          showFeedback("💬 Comments");
          onOpenComments?.();
          document.getElementById("comments-section")?.scrollIntoView({ behavior: "smooth" });
        }

        setTapCount(0);
        setTapSide(null);
      }, 300);

      setTapTimer(timer);
    },
    [tapCount, tapSide, tapTimer, router, onOpenComments]
  );

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden" ref={containerRef}>
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        autoPlay={false}
        onClick={(e) => e.preventDefault()}
      >
        <source src={`${backendUrl}/${video?.filepath}`} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Gesture overlay — sits on top but passes pointer events to video controls */}
      <div
        className="absolute inset-0 z-10"
        style={{ pointerEvents: "none" }}
        onClick={handleTap}
      />

      {/* Tap zones with pointer events */}
      <div className="absolute inset-0 z-10 flex" style={{ pointerEvents: "auto" }}>
        <div className="flex-1 h-full cursor-pointer" onClick={handleTap} />
        <div className="flex-1 h-full cursor-pointer" onClick={handleTap} />
        <div className="flex-1 h-full cursor-pointer" onClick={handleTap} />
      </div>

      {/* Feedback indicator */}
      {showIndicator && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="bg-black/70 text-white text-lg font-bold px-6 py-3 rounded-full">
            {showIndicator}
          </div>
        </div>
      )}

      {/* Gesture hint */}
      <div className="absolute bottom-14 left-0 right-0 flex justify-between px-4 z-20 pointer-events-none">
        <span className="text-white/40 text-xs">◀◀ 2x left</span>
        <span className="text-white/40 text-xs">1x center = pause</span>
        <span className="text-white/40 text-xs">2x right ▶▶</span>
      </div>
    </div>
  );
}
