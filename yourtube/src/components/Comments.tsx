import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { ThumbsUp, ThumbsDown, Languages, MapPin } from "lucide-react";

interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  usercity: string;
  commentedon: string;
  likes: number;
  dislikes: number;
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "kn", label: "Kannada" },
  { code: "ml", label: "Malayalam" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "de", label: "German" },
  { code: "ja", label: "Japanese" },
];

// Translate using MyMemory free API
const translateText = async (text: string, targetLang: string): Promise<string> => {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`
    );
    const data = await res.json();
    return data.responseData?.translatedText || text;
  } catch {
    return text;
  }
};

// Get user city from IP
const getUserCity = async (): Promise<string> => {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    return data.city || "";
  } catch {
    return "";
  }
};

const Comments = ({ videoId }: any) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState("hi");
  const [userCity, setUserCity] = useState("");
  const { user } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
    getUserCity().then(setUserCity);
  }, [videoId]);

  const loadComments = async () => {
    try {
      const res = await axiosInstance.get(`/comment/${videoId}`);
      setComments(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: user._id,
        commentbody: newComment,
        usercommented: user.name,
        usercity: userCity,
      });
      if (res.data.comment) {
        const newObj: Comment = {
          _id: Date.now().toString(),
          videoid: videoId,
          userid: user._id,
          commentbody: newComment,
          usercommented: user.name || "Anonymous",
          usercity: userCity,
          commentedon: new Date().toISOString(),
          likes: 0,
          dislikes: 0,
        };
        setComments([newObj, ...comments]);
        setNewComment("");
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Error posting comment";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTranslate = async (comment: Comment) => {
    if (translatedTexts[comment._id]) {
      // toggle off
      setTranslatedTexts((prev) => { const n = { ...prev }; delete n[comment._id]; return n; });
      return;
    }
    setTranslatingId(comment._id);
    const translated = await translateText(comment.commentbody, selectedLang);
    setTranslatedTexts((prev) => ({ ...prev, [comment._id]: translated }));
    setTranslatingId(null);
  };

  const handleLikeComment = async (id: string) => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/comment/like/${id}`, { userId: user._id });
      setComments((prev) =>
        prev.map((c) => c._id === id ? { ...c, likes: res.data.likes, dislikes: res.data.dislikes } : c)
      );
    } catch (error) { console.log(error); }
  };

  const handleDislikeComment = async (id: string) => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/comment/dislike/${id}`, { userId: user._id });
      if (res.data.deleted) {
        setComments((prev) => prev.filter((c) => c._id !== id));
      } else {
        setComments((prev) =>
          prev.map((c) => c._id === id ? { ...c, likes: res.data.likes, dislikes: res.data.dislikes } : c)
        );
      }
    } catch (error) { console.log(error); }
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditText(comment.commentbody);
  };

  const handleUpdateComment = async () => {
    if (!editText.trim()) return;
    try {
      const res = await axiosInstance.post(`/comment/editcomment/${editingCommentId}`, { commentbody: editText });
      if (res.data) {
        setComments((prev) =>
          prev.map((c) => c._id === editingCommentId ? { ...c, commentbody: editText } : c)
        );
        setEditingCommentId(null);
        setEditText("");
      }
    } catch (error: any) {
      alert(error?.response?.data?.message || "Error editing comment");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/comment/deletecomment/${id}`);
      if (res.data.comment) setComments((prev) => prev.filter((c) => c._id !== id));
    } catch (error) { console.log(error); }
  };

  if (loading) return <div>Loading comments...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{comments.length} Comments</h2>
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-gray-500" />
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      {user && (
        <div className="flex gap-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e: any) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none border-0 border-b-2 rounded-none focus-visible:ring-0"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setNewComment("")} disabled={!newComment.trim()}>
                Cancel
              </Button>
              <Button onClick={handleSubmitComment} disabled={!newComment.trim() || isSubmitting}>
                Comment
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex gap-4">
              <Avatar className="w-10 h-10">
                <AvatarFallback>{comment.usercommented?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-sm">{comment.usercommented}</span>
                  {comment.usercity && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      {comment.usercity}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(comment.commentedon))} ago
                  </span>
                </div>

                {editingCommentId === comment._id ? (
                  <div className="space-y-2">
                    <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} />
                    <div className="flex gap-2 justify-end">
                      <Button onClick={handleUpdateComment} disabled={!editText.trim()}>Save</Button>
                      <Button variant="ghost" onClick={() => { setEditingCommentId(null); setEditText(""); }}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm">{translatedTexts[comment._id] || comment.commentbody}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {/* Like */}
                      <button
                        onClick={() => handleLikeComment(comment._id)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {comment.likes || 0}
                      </button>
                      {/* Dislike */}
                      <button
                        onClick={() => handleDislikeComment(comment._id)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        {comment.dislikes || 0}
                      </button>
                      {/* Translate */}
                      <button
                        onClick={() => handleTranslate(comment)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600"
                        disabled={translatingId === comment._id}
                      >
                        <Languages className="w-3.5 h-3.5" />
                        {translatingId === comment._id
                          ? "Translating..."
                          : translatedTexts[comment._id]
                          ? "Original"
                          : "Translate"}
                      </button>
                      {comment.userid === user?._id && (
                        <>
                          <button onClick={() => handleEdit(comment)} className="text-xs text-gray-500 hover:text-black">Edit</button>
                          <button onClick={() => handleDelete(comment._id)} className="text-xs text-gray-500 hover:text-red-600">Delete</button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
