import comment from "../Modals/comment.js";
import mongoose from "mongoose";

// Special characters regex - block comments with these
const SPECIAL_CHAR_REGEX = /[<>{}[\]\\|^~`]/;

export const postcomment = async (req, res) => {
  const { commentbody, userid, videoid, usercommented, usercity } = req.body;

  // Block special characters
  if (SPECIAL_CHAR_REGEX.test(commentbody)) {
    return res.status(400).json({ message: "Comment contains blocked special characters." });
  }

  const postcommentdata = new comment({ userid, videoid, commentbody, usercommented, usercity: usercity || "" });
  try {
    await postcommentdata.save();
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallcomment = async (req, res) => {
  const { videoid } = req.params;
  try {
    const commentvideo = await comment.find({ videoid });
    return res.status(200).json(commentvideo);
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deletecomment = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    await comment.findByIdAndDelete(_id);
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const editcomment = async (req, res) => {
  const { id: _id } = req.params;
  const { commentbody } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  if (SPECIAL_CHAR_REGEX.test(commentbody)) {
    return res.status(400).json({ message: "Comment contains blocked special characters." });
  }
  try {
    const updated = await comment.findByIdAndUpdate(_id, { $set: { commentbody } }, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const likecomment = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    const c = await comment.findById(id);
    if (!c) return res.status(404).json({ message: "Comment not found" });

    const alreadyLiked = c.likedBy.includes(userId);
    if (alreadyLiked) {
      c.likedBy.pull(userId);
      c.likes = Math.max(0, c.likes - 1);
    } else {
      c.likedBy.push(userId);
      c.likes += 1;
      // remove dislike if exists
      if (c.dislikedBy.includes(userId)) {
        c.dislikedBy.pull(userId);
        c.dislikes = Math.max(0, c.dislikes - 1);
      }
    }
    await c.save();
    return res.status(200).json({ likes: c.likes, dislikes: c.dislikes });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const dislikecomment = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    const c = await comment.findById(id);
    if (!c) return res.status(404).json({ message: "Comment not found" });

    const alreadyDisliked = c.dislikedBy.includes(userId);
    if (alreadyDisliked) {
      c.dislikedBy.pull(userId);
      c.dislikes = Math.max(0, c.dislikes - 1);
    } else {
      c.dislikedBy.push(userId);
      c.dislikes += 1;
      // remove like if exists
      if (c.likedBy.includes(userId)) {
        c.likedBy.pull(userId);
        c.likes = Math.max(0, c.likes - 1);
      }
    }

    // Auto-remove if 2+ dislikes from different users
    if (c.dislikes >= 2) {
      await comment.findByIdAndDelete(id);
      return res.status(200).json({ deleted: true });
    }

    await c.save();
    return res.status(200).json({ likes: c.likes, dislikes: c.dislikes, deleted: false });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};
