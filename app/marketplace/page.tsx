"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

interface Post {
  id: number;
  title: string;
  price: number;
  description: string;
  image_url: string;
  user_id: number;
}

export default function MarketplacePage() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/api/posts`)
      .then((res) => setPosts(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6 text-emerald-700">Marketplace</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Card key={post.id} className="shadow-md border">
            <CardHeader>
              <CardTitle>{post.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Image
                src={post.image_url}
                alt={post.title}
                className="w-full h-48 object-cover rounded-lg mb-3"
              />
              <p className="text-gray-600 mb-2">₱{post.price}</p>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                {post.description}
              </p>
              <div className="flex gap-2">
                <Link href={`/post/${post.id}`}>
                  <Button variant="outline" className="w-full">
                    View
                  </Button>
                </Link>
                <Link href={`/messages/${post.id}`}>
                  <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
                    Buy
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
