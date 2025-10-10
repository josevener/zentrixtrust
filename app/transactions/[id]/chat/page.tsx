"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { io } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  created_at: string;
}

export default function TransactionChat() {
  const { id: transactionId } = useParams(); // from /transactions/[id]/chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Example: Logged-in user (replace later with your auth)
  const currentUser = { id: 1, name: "Buyer Demo" };

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load chat history
  useEffect(() => {
    async function fetchMessages() {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messages/${transactionId}`
      );
      setMessages(res.data.data);
    }
    fetchMessages();
  }, [transactionId]);

  // Socket.IO setup
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL!);
    socketRef.current = socket;

    socket.emit("join", `transaction_${transactionId}`);

    socket.on("new_message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.emit("leave", `transaction_${transactionId}`);
      socket.disconnect();
    };
  }, [transactionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!content.trim()) return;
    const msgData = {
      transaction_id: Number(transactionId),
      sender_id: currentUser.id,
      content,
    };

    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/messages`, msgData);
    setContent("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-emerald-50 to-green-100 p-4">
      <Card className="w-full max-w-2xl shadow-xl border border-emerald-200 flex flex-col h-[80vh]">
        <CardHeader className="border-b p-4">
          <CardTitle className="text-emerald-700 text-lg font-semibold">
            Transaction Room #{transactionId}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col flex-1 p-0">
          <ScrollArea className="flex-1 p-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.sender_id === currentUser.id
                    ? "justify-end"
                    : "justify-start"
                } mb-2`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl max-w-[70%] ${
                    m.sender_id === currentUser.id
                      ? "bg-emerald-600 text-white"
                      : "bg-white border border-emerald-100 text-gray-800"
                  }`}
                >
                  <p className="text-sm">{m.content}</p>
                  <p className="text-[10px] opacity-70 mt-1">
                    {m.sender_name} •{" "}
                    {new Date(m.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </ScrollArea>

          <div className="flex items-center gap-2 p-4 border-t">
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button onClick={sendMessage} className="bg-emerald-600 text-white">
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
