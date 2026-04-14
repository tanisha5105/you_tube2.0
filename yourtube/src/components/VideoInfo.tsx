import React, { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Clock, Download, MoreHorizontal, Share, ThumbsDown, ThumbsUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/router";

// Watch time limits in seconds per plan
const WATCH_LIMITS: Record<string, number> = {
  free: 5 * 60,      // 5 minutes
  bronze: 7 * 60,    // 7 minutes
  silver: 10 * 60,   // 10 minutes
  gold: Infinity,    // unlimited
};

const VideoInfo = ({ video, videoRef }: any) => {
  const [likes, setLikes] = useState(video.Like || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const { user } = useUser();
  const viewTracked = useRef(false);
  const watchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    setLikes(video.Like || 0);
    setIsLiked(false);
  }, [video]);

  // Track view once
  useEffect(() => {
    if (viewTracked.current) return;
    viewTracked.current = true;
    const trackView = async () => {
      try {
        if (user) {
          await axiosInstance.post(`/history/${video._id}`, { userId: user._id });
        } else {
          await axiosInstance.post(`/history/views/${video._id}`);
        }
      } catch (error) { console.log(error); }
    };
    trackView();
  }, [video._id]);

  // Watch time limit enforcement
  useEffect(() => {
    const plan = user?.plan || "free";
    const limit = WATCH_LIMITS[plan];
    if (limit === Infinity) return;

    if (watchTimerRef.current) clearTimeout(watchTimerRef.current);
    watchTimerRef.current = setTimeout(() => {
      if (videoRef?.current) {
        videoRef.current.pause();
      }
      toast.error(
        `Your ${plan} plan allows ${limit / 60} minutes of watch time. Upgrade for more!`,
        {
          action: {
            label: "Upgrade",
            onClick: () => router.push("/upgrade"),
          },
          duration: 8000,
        }
      );
    }, limit * 1000);

    return () => { if (watchTimerRef.current) clearTimeout(watchTimerRef.current); };
  }, [user, video._id]);

  const handleLike = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/like/${video._id}`, { userId: user._id });
      if (res.data.liked) {
        setLikes((prev: number) => prev + 1);
        setIsLiked(true);
      } else {
        setLikes((prev: number) => prev - 1);
        setIsLiked(false);
      }
    } catch (error) { console.log(error); }
  };

  const handleWatchLater = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/watch/${video._id}`, { userId: user._id });
      setIsWatchLater(res.data.watchlater);
    } catch (error) { console.log(error); }
  };

  const handleDownload = async () => {
    if (!user) { toast.error("Please sign in to download"); return; }
    try {
      const checkRes = await axiosInstance.get(`/download/check/${user._id}`);
      if (!checkRes.data.canDownload) {
        toast.error("Free plan: 1 download/day limit reached.", {
          action: { label: "Upgrade", onClick: () => router.push("/upgrade") },
        });
        return;
      }
      // Record the download
      await axiosInstance.post("/download/record", { userId: user._id, videoId: video._id });
      // Trigger actual download
      const a = document.createElement("a");
      a.href = `${backendUrl}/${video.filepath}`;
      a.download = video.filename || "video.mp4";
      a.click();
      toast.success("Download started!");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Download failed");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{video.videotitle}</h1>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-10 h-10">
            <AvatarFallback>{video.videochanel?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{video.videochanel}</h3>
          </div>
          {user && user._id !== video.uploader && (
            <Button className="ml-4 bg-black text-white hover:bg-gray-800">Subscribe</Button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full">
            <Button variant="ghost" size="sm" className="rounded-l-full" onClick={handleLike}>
              <ThumbsUp className={`w-5 h-5 mr-2 ${isLiked ? "fill-black text-black" : ""}`} />
              {likes.toLocaleString()}
            </Button>
            <div className="w-px h-6 bg-gray-300" />
            <Button variant="ghost" size="sm" className="rounded-r-full">
              <ThumbsDown className="w-5 h-5" />
            </Button>
          </div>

          <Button
            variant="ghost" size="sm"
            className={`bg-gray-100 dark:bg-gray-800 rounded-full ${isWatchLater ? "text-blue-600" : ""}`}
            onClick={handleWatchLater}
          >
            <Clock className="w-5 h-5 mr-2" />
            {isWatchLater ? "Saved" : "Watch Later"}
          </Button>

          <Button variant="ghost" size="sm" className="bg-gray-100 dark:bg-gray-800 rounded-full">
            <Share className="w-5 h-5 mr-2" />Share
          </Button>

          <Button
            variant="ghost" size="sm"
            className="bg-gray-100 dark:bg-gray-800 rounded-full"
            onClick={handleDownload}
          >
            <Download className="w-5 h-5 mr-2" />Download
          </Button>

          <Button variant="ghost" size="icon" className="bg-gray-100 dark:bg-gray-800 rounded-full">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex gap-4 text-sm font-medium mb-2">
          <span>{video.views?.toLocaleString()} views</span>
          <span>{formatDistanceToNow(new Date(video.createdAt))} ago</span>
          {user && (
            <span className="capitalize text-blue-600 text-xs">
              Plan: {user.plan || "free"}
            </span>
          )}
        </div>
        {video.description && (
          <div className={`text-sm ${showFullDescription ? "" : "line-clamp-3"}`}>
            <p>{video.description}</p>
          </div>
        )}
        {video.description && (
          <Button
            variant="ghost" size="sm"
            className="mt-2 p-0 h-auto font-medium"
            onClick={() => setShowFullDescription(!showFullDescription)}
          >
            {showFullDescription ? "Show less" : "Show more"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default VideoInfo;
