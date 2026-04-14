import ChannelHeader from "@/components/ChannelHeader";
import Channeltabs from "@/components/Channeltabs";
import ChannelVideos from "@/components/ChannelVideos";
import VideoUploader from "@/components/VideoUploader";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const ChannelPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const [channelVideos, setChannelVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchVideos = async () => {
      try {
        const res = await axiosInstance.get("/video/getall");
        const filtered = res.data.filter((v: any) => v.uploader === id);
        setChannelVideos(filtered);
      } catch (error) {
        console.error("Error fetching channel videos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [id]);

  const isOwner = user?._id === id;
  const channel = isOwner ? user : null;

  if (!channel) {
    return (
      <div className="flex-1 p-8 text-center text-gray-500">
        {loading ? "Loading..." : "Channel not found."}
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-white">
      <div className="max-w-full mx-auto">
        <ChannelHeader channel={channel} user={user} />
        <Channeltabs />
        {isOwner && (
          <div className="px-4 pb-8 pt-4">
            <VideoUploader channelId={id} channelName={channel?.channelname} />
          </div>
        )}
        <div className="px-4 pb-8">
          {loading ? (
            <p className="text-gray-500">Loading videos...</p>
          ) : (
            <ChannelVideos videos={channelVideos} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelPage;
