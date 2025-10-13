"use client";

import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, User, X } from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";

const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3300");

interface Message {
  from: string;
  text: string;
  images?: string[];
  timestamp: string;
}

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const user = "buyer"; // Replace with real logged-in user later
  const recipient = "seller"; // Replace with real recipient data later
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    socket.emit("join", roomId);

    socket.on("message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.emit("leave", roomId);
      socket.off("message");
    };
  }, [roomId]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    }
  }, [text]);

  const sendMessage = async () => {
    if (!text.trim() && imagePreviews.length === 0) return;
    setIsSending(true);
    const msg: Message = {
      from: user,
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    if (imagePreviews.length > 0) {
      msg.images = imagePreviews;
    }
    socket.emit("message", { room: roomId, ...msg });
    setMessages((prev) => [...prev, msg]);
    setText("");
    setImagePreviews([]);
    setIsSending(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsUploading(true);
    const newPreviews: string[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newPreviews.push(event.target.result as string);
            if (newPreviews.length === files.length) {
              setImagePreviews((prev) => [...prev, ...newPreviews]);
              setIsUploading(false);
            }
          }
        };
        reader.readAsDataURL(file);
      } 
      else {
        console.log(`File ${file.name} is not an image.`);
        if (newPreviews.length === files.length) {
          setIsUploading(false);
        }
      }
    });
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-5xl">
        <TooltipProvider>
          <Tooltip>
            <Link href={`/profile/${recipient}`}>
              <TooltipTrigger asChild>
                <div className="bg-white rounded-t-xl shadow-lg ring-1 ring-gray-200 p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors duration-200">
                  <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center">
                    <User className="h-6 w-6 text-emerald-700" />
                  </div>
                  <h2 className="text-xl font-semibold text-emerald-800 hover:underline">
                    {recipient}
                  </h2>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-white rounded-lg shadow-xl p-4 z-10 w-64">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {recipient}
                    </p>
                    <p className="text-xs text-gray-500">Online</p>
                  </div>
                </div>
                <Link href={`/profile/${recipient}`} className="text-xs text-gray-600 hover:underline mt-2">View full profile</Link>
              </TooltipContent>
            </Link>
          </Tooltip>
        </TooltipProvider>

        <div className="h-[80vh] rounded-b-xl bg-white shadow-lg flex flex-col ring-1 ring-gray-200">
          <div className="flex-1 overflow-y-auto space-y-3 p-5">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`relative p-3 rounded-xl block max-w-[70%] sm:max-w-[60%] md:max-w-[50%] break-words transition-all duration-200 ${
                  msg.from === user
                    ? "bg-emerald-200 ml-auto shadow-md"
                    : "bg-gray-100 mr-auto shadow-md"
                } ${msg.from === user ? "rounded-br-none" : "rounded-bl-none"}`}
              >
                {msg.from !== user && (
                  <strong className="text-sm font-medium text-gray-700 block mb-1">
                    {msg.from}
                  </strong>
                )}
                {msg.text && (
                  <span className="text-base text-gray-900 block">
                    {msg.text}
                  </span>
                )}
                {msg.images && msg.images.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.images.map((image, i) => (
                      <Image
                        key={i}
                        src={image}
                        alt={`Sent image ${i + 1}`}
                        className="max-w-full rounded-lg shadow-sm"
                      />
                    ))}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  {msg.timestamp}
                </div>
                <div
                  className={`absolute bottom-0 ${
                    msg.from === user
                      ? "right-0 translate-x-1"
                      : "left-0 -translate-x-1"
                  } w-0 h-0 border-t-8 border-t-transparent ${
                    msg.from === user
                      ? "border-l-8 border-l-emerald-200"
                      : "border-r-8 border-r-gray-100"
                  }`}
                ></div>
              </div>
            ))}
          </div>

          <div className="border-t p-4 bg-gray-50 rounded-b-xl">
            <div className="flex flex-col gap-2">
              <div className="flex items-stretch gap-2">
                <Button
                  variant="outline"
                  className="p-2 h-full hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                  onClick={() =>
                    document.getElementById("image-upload")?.click()
                  }
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-gray-600 border-t-transparent rounded-full" />
                  ) : (
                    <Upload className="h-5 w-5 text-gray-600" />
                  )}
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                />
                <Textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 min-h-[40px] max-h-[100px] resize-none rounded-r-none border-r-0 focus:ring-0 text-base p-3"
                  disabled={isSending}
                />
                <Button
                  onClick={sendMessage}
                  className="bg-emerald-600 text-white rounded-l-none h-full hover:bg-emerald-700 transition-colors duration-200 cursor-pointer"
                  disabled={isSending}
                >
                  {isSending ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    "Send"
                  )}
                </Button>
              </div>
              {imagePreviews.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative max-w-[150px]">
                      <Image
                        src={preview}
                        height={30}
                        width={30}
                        alt={`Image preview ${index + 1}`}
                        className="w-full rounded-lg shadow-sm"
                      />
                      <Button
                        variant="destructive"
                        className="absolute top-0 right-0 h-6 w-6 p-0 flex items-center justify-center rounded-full"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
