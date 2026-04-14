import Comments from "@/components/Comments";
import RelatedVideos from "@/components/RelatedVideos";
import VideoInfo from "@/components/VideoInfo";
import Videopplayer from "@/components/Videopplayer";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";

const WatchPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [currentVideo, setCurrentVideo] = useState<any>(null);
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/video/getall");
        const all = res.data || [];
        const found = all.find((vid: any) => vid._id === id);
        setCurrentVideo(found || null);
        setRelatedVideos(all.filter((vid: any) => vid._id !== id));
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [id]);

  if (loading) return <div className="flex-1 p-8 text-center">Loading...</div>;
  if (!currentVideo) return <div className="flex-1 p-8 text-center">Video not found.</div>;

  return (
    <div className="flex-1 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Videopplayer
              video={currentVideo}
              onOpenComments={() =>
                document.getElementById("comments-section")?.scrollIntoView({ behavior: "smooth" })
              }
            />
            <VideoInfo video={currentVideo} videoRef={videoRef} />
            <div id="comments-section">
              <Comments videoId={id} />
            </div>
          </div>
          <div className="space-y-4">
            <RelatedVideos videos={relatedVideos} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchPage;
