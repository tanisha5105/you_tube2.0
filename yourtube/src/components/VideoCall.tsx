"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  Circle,
  StopCircle,
  Phone,
  X,
} from "lucide-react";

interface VideoCallProps {
  onClose: () => void;
}

export default function VideoCall({ onClose }: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [inputRoom, setInputRoom] = useState("");
  const [status, setStatus] = useState("Enter a room ID to start or join a call");

  // WebRTC config using free STUN servers
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (error) {
      setStatus("Camera/mic access denied");
      return null;
    }
  };

  const startCall = async () => {
    if (!inputRoom.trim()) return;
    setRoomId(inputRoom.trim());
    setStatus("Starting call...");

    const stream = await startLocalStream();
    if (!stream) return;

    setCallActive(true);
    setStatus(`In call — Room: ${inputRoom.trim()} (Share this ID with your friend)`);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
      setIsVideoOff(!isVideoOff);
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      } as any);
      if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
      setIsSharing(true);
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      setStatus("Screen sharing cancelled");
    }
  };

  const stopScreenShare = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    setIsSharing(false);
  };

  const startRecording = () => {
    const stream = localVideoRef.current?.srcObject as MediaStream;
    if (!stream) return;
    recordedChunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `call-recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const endCall = () => {
    if (isRecording) stopRecording();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerRef.current?.close();
    setCallActive(false);
    setStatus("Call ended");
    onClose();
  };

  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-red-600" />
            <h2 className="font-semibold">Video Call</h2>
            {roomId && <span className="text-xs bg-gray-100 px-2 py-1 rounded">Room: {roomId}</span>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Video area */}
        <div className="relative bg-gray-900 aspect-video">
          {/* Remote video (full) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!callActive && (
            <div className="absolute inset-0 flex items-center justify-center text-white/50 text-lg">
              Waiting for connection...
            </div>
          )}
          {/* Local video (PiP) */}
          <div className="absolute bottom-4 right-4 w-32 aspect-video bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white text-xs px-3 py-1 rounded-full">
              <Circle className="w-3 h-3 fill-white animate-pulse" /> Recording
            </div>
          )}
        </div>

        {/* Status */}
        <p className="text-center text-sm text-gray-500 py-2 px-4">{status}</p>

        {/* Controls */}
        <div className="p-4 border-t">
          {!callActive ? (
            <div className="flex gap-2 justify-center">
              <Input
                placeholder="Enter Room ID"
                value={inputRoom}
                onChange={(e) => setInputRoom(e.target.value)}
                className="max-w-xs"
                onKeyDown={(e) => e.key === "Enter" && startCall()}
              />
              <Button onClick={startCall} className="bg-green-600 hover:bg-green-700">
                <Phone className="w-4 h-4 mr-2" /> Start Call
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="icon"
                onClick={toggleMute}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button
                variant={isVideoOff ? "destructive" : "outline"}
                size="icon"
                onClick={toggleVideo}
                title={isVideoOff ? "Turn on camera" : "Turn off camera"}
              >
                {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </Button>
              <Button
                variant={isSharing ? "default" : "outline"}
                size="icon"
                onClick={isSharing ? stopScreenShare : startScreenShare}
                title="Share screen"
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                onClick={isRecording ? stopRecording : startRecording}
                title={isRecording ? "Stop recording" : "Record call"}
              >
                {isRecording ? <StopCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              </Button>
              <Button variant="destructive" onClick={endCall}>
                <PhoneOff className="w-4 h-4 mr-2" /> End Call
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
