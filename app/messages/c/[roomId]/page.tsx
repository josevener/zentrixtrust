"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, User, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import AuthHeader from "@/components/AuthHeader";

const PUBLIC_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3300";
const socket = io(PUBLIC_API);

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const { user } = useUser();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recipient, setRecipient] = useState<any>(null);
  // const [transactionData, setTransactionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const transactionUUID = Array.isArray(roomId) ? roomId[0] : roomId;

  // Fetch messages + transaction details
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${PUBLIC_API}/api/messages/${transactionUUID}`);
        const { data } = res.data;

        if (data?.messages) setMessages(data.messages);
        if (data?.transaction) {
          const t = data.transaction;
          // setTransactionData(t);

          if (Number(t.buyer_id) === user?.id) {
            setRecipient({
              id: Number(t.seller_id),
              username: t.seller_username,
              name: t.seller_name,
              email: t.seller_email,
            });
          } 
          else if (Number(t.seller_id) === user?.id) {
            setRecipient({
              id: Number(t.buyer_id),
              username: t.buyer_username,
              name: t.buyer_name,
              email: t.buyer_email,
            });
          }
        } 
        else {
          setError("Transaction data not found");
        }
      } 
      catch (err: any) {
        console.error("Error fetching messages:", err);
        setError(err.response?.data?.error || "Failed to load messages");
        toast.error(err.response?.data?.error || "Failed to load messages");
      } 
      finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [transactionUUID, user, router]);

  // Socket.IO setup
  useEffect(() => {
    if (!user) return;

    socket.emit("join", `transaction_${transactionUUID}`);

    socket.on("new_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      toast.error("Failed to connect to chat server");
    });

    return () => {
      socket.emit("leave", `transaction_${transactionUUID}`);
      socket.off("new_message");
      socket.off("connect_error");
    };
  }, [transactionUUID, user]);

  // Auto scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    textareaRef.current?.focus();
  }, [messages]);

  // Upload helper
  const uploadImages = async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    try {
      const res = await axios.post(`${PUBLIC_API}/api/messages/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.imageUrls || [];
    } 
    catch (err) {
      console.error("Error uploading images:", err);
      toast.error("Failed to upload images");
      return [];
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!user || (!text.trim() && imageFiles.length === 0) || !recipient) return;
    setIsSending(true);

    try {
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        imageUrls = await uploadImages(imageFiles);
      }

      const messageData = {
        transaction_uuid: transactionUUID,
        sender_id: user.id,
        receiver_id: recipient.id,
        message_type: imageUrls.length > 0 ? "image" : "text",
        content: text || "",
        images: imageUrls.length > 0 ? imageUrls : [],
      };

      const { data } = await axios.post(`${PUBLIC_API}/api/messages/send`, messageData);
      const savedMessage = data.message;

      // Emit via Socket.IO (do not update messages locally here)
      socket.emit("new_message", savedMessage);

      // Clear input fields
      setText("");
      setImagePreviews([]);
      setImageFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } 
    catch (err: any) {
      console.error("Error sending message:", err);
      toast.error(err.response?.data?.error || "Failed to send message");
    } 
    finally {
      setIsSending(false);
    }
  };

  // Input handlers
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
    const newFiles: File[] = [];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        newFiles.push(file);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newPreviews.push(event.target.result as string);
            if (newPreviews.length === files.length) {
              setImagePreviews((prev) => [...prev, ...newPreviews]);
              setImageFiles((prev) => [...prev, ...newFiles]);
              setIsUploading(false);
            }
          }
        };
        reader.readAsDataURL(file);
      } 
      else {
        toast.error(`File ${file.name} is not an image`);
        setIsUploading(false);
      }
    });
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex flex-col items-center">
      <AuthHeader />

      <div className="w-full max-w-5xl mt-2">
        <div className="bg-white border border-gray-200 p-6 shadow-md mb-4">
          <div className="flex items-center justify-between">
            {isLoading ? (
              <p className="text-gray-600 text-sm">Loading chat...</p>
            ) : error ? (
              <p className="text-red-600 text-sm">{error}</p>
            ) : recipient ? (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Link href={`/profile/${recipient.username}`} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-900">{recipient.name}</p>
                      <p className="text-sm text-gray-500">@{recipient.username}</p>
                    </div>
                  </Link>
                </HoverCardTrigger>
                <Button 
                  className="bg-blue-700 hover:bg-blue-600 cursor-pointer"
                  onClick={() => {
                    router.push(`/messages/t/${transactionUUID}`)
                  }}
                >
                  Go to transaction details
                </Button>
                <HoverCardContent className="bg-white p-4 shadow-lg rounded-lg w-72">
                  <p className="text-sm font-medium">{recipient.name}</p>
                  <p className="text-xs text-gray-500">{recipient.email}</p>
                  <Link
                    href={`/profile/${recipient.username}`}
                    className="text-xs text-blue-600 hover:underline mt-2 block"
                  >
                    View full profile
                  </Link>
                </HoverCardContent>
              </HoverCard>
            ) : (
              <p className="text-gray-600 text-sm">No recipient found</p>
            )}
          </div>
        </div>

        <div className="h-[75vh] bg-white shadow-lg flex flex-col ring-1 ring-gray-200">
          <div className="flex-1 overflow-y-auto space-y-3 p-5">
            {isLoading ? (
              <p className="text-center text-gray-600">Loading messages...</p>
            ) : error ? (
              <p className="text-center text-red-600">{error}</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-gray-600">No messages yet</p>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={msg.id || index} // Use msg.id for unique key if available
                  className={`relative p-3 rounded-xl max-w-[70%] sm:max-w-[60%] md:max-w-[50%] break-words ${
                    Number(msg.sender_id) === user?.id
                      ? "bg-emerald-200 ml-auto rounded-br-none text-end"
                      : "bg-gray-100 mr-auto rounded-bl-none text-start"
                  }`}
                >
                  {msg.content && <span>{msg.content}</span>}
                  {msg.images?.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.images.map((image: string, i: number) => (
                        <Image
                          key={i}
                          src={`${PUBLIC_API}${image}`}
                          alt={`Image ${i + 1}`}
                          width={250}
                          height={180}
                          className="rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-4 bg-gray-50">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isSending || !!error}
              >
                {isUploading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-gray-600 border-t-transparent rounded-full" />
                ) : (
                  <Upload className="h-5 w-5 text-gray-600" />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={!!error}
              />
              <Textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 resize-none"
                disabled={isSending || !!error}
              />
              <Button
                onClick={sendMessage}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={isSending || (!text.trim() && imageFiles.length === 0) || !!error}
              >
                {isSending ? "..." : "Send"}
              </Button>
            </div>

            {imagePreviews.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative w-[120px]">
                    <Image
                      src={src}
                      alt="Preview"
                      width={120}
                      height={80}
                      className="rounded-md shadow"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-0 right-0 h-5 w-5"
                      onClick={() => removeImage(i)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}