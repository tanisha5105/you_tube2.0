import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import axiosInstance from "@/lib/axiosinstance";

const SearchResult = ({ query }: any) => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    if (!query?.trim()) return;
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/video/getall");
        const results = res.data.filter(
          (vid: any) =>
            vid.videotitle.toLowerCase().includes(query.toLowerCase()) ||
            vid.videochanel.toLowerCase().includes(query.toLowerCase())
        );
        setVideos(results);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [query]);

  if (!query?.trim()) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Enter a search term to find videos.</p>
      </div>
    );
  }

  if (loading) return <div>Searching...</div>;

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">No results found</h2>
        <p className="text-gray-600">Try different keywords</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {videos.map((video: any) => (
          <div key={video._id} className="flex gap-4 group">
            <Link href={`/watch/${video._id}`} className="flex-shrink-0">
              <div className="relative w-80 aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <video
                  src={`${backendUrl}/${video.filepath}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  preload="metadata"
                />
              </div>
            </Link>

            <div className="flex-1 min-w-0 py-1">
              <Link href={`/watch/${video._id}`}>
                <h3 className="font-medium text-lg line-clamp-2 group-hover:text-blue-600 mb-2">
                  {video.videotitle}
                </h3>
              </Link>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <span>{video.views?.toLocaleString()} views</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(video.createdAt))} ago</span>
              </div>
              <Link
                href={`/channel/${video.uploader}`}
                className="flex items-center gap-2 mb-2 hover:text-blue-600"
              >
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs">
                    {video.videochanel?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600">{video.videochanel}</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center py-4">
        <p className="text-gray-600 text-sm">
          {videos.length} result{videos.length !== 1 ? "s" : ""} for "{query}"
        </p>
      </div>
    </div>
  );
};

export default SearchResult;
