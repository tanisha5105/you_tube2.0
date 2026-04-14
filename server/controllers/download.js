import download from "../Modals/download.js";
import users from "../Modals/Auth.js";
import video from "../Modals/video.js";
import nodemailer from "nodemailer";

const getStartOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const checkDownloadLimit = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await users.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.plan !== "free") {
      return res.status(200).json({ canDownload: true, plan: user.plan });
    }

    const todayCount = await download.countDocuments({
      userid: userId,
      downloadedAt: { $gte: getStartOfDay() },
    });

    return res.status(200).json({ canDownload: todayCount < 1, plan: "free", todayCount });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const recordDownload = async (req, res) => {
  const { userId, videoId } = req.body;
  try {
    const user = await users.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.plan === "free") {
      const todayCount = await download.countDocuments({
        userid: userId,
        downloadedAt: { $gte: getStartOfDay() },
      });
      if (todayCount >= 1) {
        return res.status(403).json({ message: "Free plan limit reached. Upgrade to download more." });
      }
    }

    await download.create({ userid: userId, videoid: videoId });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getUserDownloads = async (req, res) => {
  const { userId } = req.params;
  try {
    const downloads = await download.find({ userid: userId }).populate({ path: "videoid", model: "videofiles" });
    return res.status(200).json(downloads);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};
