"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

interface Post {
  id: number;
  title: string;
  price: number;
  description: string;
  image_url: string;
  user_id: number;
  user_name?: string;
}

export default function PostDetailPage() {
  const params = useParams();
  const { id } = params;
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${id}`)
      .then((res) => setPost(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  if (!post) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center">
      <Card className="max-w-2xl w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-emerald-700">
            {post.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Image
            src={post.image_url}
            alt={post.title}
            className="w-full h-64 object-cover rounded-lg mb-4"
          />
          <p className="text-lg text-gray-700 mb-2">₱{post.price}</p>
          <p className="text-gray-600 mb-6">{post.description}</p>

          <div className="flex gap-3">
            <Link href={`/checkout?postId=${post.id}`}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Buy Now
              </Button>
            </Link>
            <Link href={`/messages/${post.id}`}>
              <Button variant="outline">Message Seller</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
