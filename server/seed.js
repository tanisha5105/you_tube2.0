import mongoose from "mongoose";
import dotenv from "dotenv";
import video from "./Modals/video.js";
import users from "./Modals/Auth.js";

dotenv.config();

const filepath = "uploads/2025-06-25T06-09-29.296Z-vdo.mp4";

const sampleVideos = [
  { videotitle: "Introduction to JavaScript", videochanel: "CodeWithMe", description: "Learn JavaScript from scratch in this beginner-friendly tutorial.", views: 12400 },
  { videotitle: "React Hooks Explained", videochanel: "DevTutorials", description: "Deep dive into useState, useEffect and custom hooks.", views: 8900 },
  { videotitle: "Building a REST API with Node.js", videochanel: "BackendPro", description: "Step by step guide to building REST APIs using Express and MongoDB.", views: 23100 },
  { videotitle: "CSS Flexbox Complete Guide", videochanel: "WebDesignHub", description: "Master CSS Flexbox layout with practical examples.", views: 5600 },
  { videotitle: "Python for Beginners", videochanel: "PythonWorld", description: "Start your Python journey with this comprehensive beginner guide.", views: 45000 },
  { videotitle: "Next.js 15 Full Course", videochanel: "CodeWithMe", description: "Build full-stack apps with Next.js 15 and the App Router.", views: 31200 },
  { videotitle: "MongoDB Complete Tutorial", videochanel: "DBMasters", description: "Learn MongoDB from basics to advanced aggregation pipelines.", views: 18700 },
  { videotitle: "Tailwind CSS Crash Course", videochanel: "WebDesignHub", description: "Get up and running with Tailwind CSS in under an hour.", views: 9300 },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("Connected to MongoDB");

    // Create a dummy uploader user if none exists
    let uploader = await users.findOne({ email: "demo@yourtube.com" });
    if (!uploader) {
      uploader = await users.create({
        email: "demo@yourtube.com",
        name: "Demo User",
        channelname: "YourTube Demo",
        description: "Official demo channel",
        image: "https://github.com/shadcn.png",
      });
      console.log("Created demo user");
    }

    // Clear existing videos
    await video.deleteMany({});
    console.log("Cleared existing videos");

    // Insert sample videos
    const videos = sampleVideos.map((v) => ({
      ...v,
      filename: "vdo.mp4",
      filetype: "video/mp4",
      filepath,
      filesize: "10485760",
      uploader: uploader._id.toString(),
      Like: Math.floor(Math.random() * 1000),
    }));

    await video.insertMany(videos);
    console.log(`✅ Seeded ${videos.length} videos successfully!`);
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exit(1);
  }
};

seed();
