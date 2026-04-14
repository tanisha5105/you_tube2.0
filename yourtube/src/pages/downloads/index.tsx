import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { formatDistanceToNow } from "date-fns";
import { Download } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DownloadsPage() {
  const { user } = useUser();
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    if (user) {
      axiosInstance.get(`/download/user/${user._id}`)
        .then((res) => setDownloads(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) return (
    <main className="flex-1 p-6 text-center">
      <Download className="w-16 h-16 mx-auto text-gray-400 mb-4" />
      <h2 className="text-xl font-semibold">Sign in to see your downloads</h2>
    </main>
  );

  if (loading) return <main className="flex-1 p-6">Loading downloads...</main>;

  return (
    <main className="flex-1 p-6">
      <h1 className="text-2xl font-bold mb-6">Downloads</h1>
      {downloads.length === 0 ? (
        <div className="text-center py-12">
          <Download className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No downloads yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {downloads.map((item) => (
            <div key={item._id} className="flex gap-4 group">
              <Link href={`/watch/${item.videoid._id}`} className="flex-shrink-0">
                <div className="relative w-40 aspect-video bg-gray-100 rounded overflow-hidden">
                  <video
                    src={`${backendUrl}/${item.videoid?.filepath}`}
                    className="w-full h-full object-cover"
                    preload="metadata"
                  />
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/watch/${item.videoid._id}`}>
                  <h3 className="font-medium text-sm line-clamp-2 hover:text-blue-600 mb-1">
                    {item.videoid.videotitle}
                  </h3>
                </Link>
                <p className="text-sm text-gray-600">{item.videoid.videochanel}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Downloaded {formatDistanceToNow(new Date(item.createdAt))} ago
                </p>
                <a
                  href={`${backendUrl}/${item.videoid.filepath}`}
                  download={item.videoid.filename}
                  className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline"
                >
                  <Download className="w-3 h-3" /> Download again
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
