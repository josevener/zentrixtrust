"use client";

import { useEffect, useState } from "react";
import io from "socket.io-client";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3300");

interface Message {
  from: string;
  text: string;
}

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const user = "buyer"; // Replace with real logged-in user later

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

  const sendMessage = () => {
    if (!text.trim()) return;
    const msg = { room: roomId, from: user, text };
    socket.emit("message", msg);
    setMessages((prev) => [...prev, msg]);
    setText("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold text-emerald-700 mb-4">
        Chat Room #{roomId}
      </h1>

      <div className="border w-full max-w-md h-[70vh] rounded-lg bg-white shadow-md flex flex-col p-3">
        <div className="flex-1 overflow-y-auto space-y-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg ${
                msg.from === user
                  ? "bg-emerald-100 text-right"
                  : "bg-gray-100 text-left"
              }`}
            >
              <strong>{msg.from}: </strong>
              {msg.text}
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message..."
          />
          <Button onClick={sendMessage} className="bg-emerald-600 text-white">
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
