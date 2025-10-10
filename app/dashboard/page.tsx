"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type Post = {
  id: number;
  title: string;
  description: string;
  price: number;
  image_url?: string;
  user_id?: number;
};

export default function DashboardPage() {
  // For now assume current user ID = 1 (replace with real auth)
  const CURRENT_USER_ID = 1;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("0");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [editing, setEditing] = useState<Post | null>(null);

  useEffect(() => {
    fetchMyPosts();
    // socket.io could be attached here to receive 'post_created' events
  }, []);

  async function fetchMyPosts() {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/posts?userId=${CURRENT_USER_ID}`);
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreateOrUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("user_id", String(CURRENT_USER_ID));
      fd.append("title", title);
      fd.append("description", description);
      fd.append("price", price);
      if (imageFile) fd.append("image", imageFile);

      if (editing) {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${editing.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setEditing(null);
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/posts`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setTitle("");
      setDescription("");
      setPrice("0");
      setImageFile(null);
      await fetchMyPosts();
    } catch (err) {
      console.error(err);
      alert("Failed to save post");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(p: Post) {
    setEditing(p);
    setTitle(p.title);
    setDescription(p.description || "");
    setPrice(String(p.price || 0));
    setImageFile(null); // if user wants to change image, they can upload a new one
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this post?")) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${id}`);
      await fetchMyPosts();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Your Listings</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <section>
          <Card>
            <CardHeader>
              <CardTitle>{editing ? "Edit Post" : "Create Post"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateOrUpdate} className="space-y-3">
                <div>
                  <label className="block text-sm">Title</label>
                  <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full border rounded px-2 py-1" required />
                </div>

                <div>
                  <label className="block text-sm">Description</label>
                  <textarea value={description} onChange={(e)=>setDescription(e.target.value)} className="w-full border rounded px-2 py-1" rows={4} />
                </div>

                <div>
                  <label className="block text-sm">Price (PHP)</label>
                  <input type="number" value={price} onChange={(e)=>setPrice(e.target.value)} className="w-full border rounded px-2 py-1" />
                </div>

                <div>
                  <label className="block text-sm">Image</label>
                  <input type="file" accept="image/*" onChange={(e)=> setImageFile(e.target.files?.[0] || null)} />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="bg-emerald-600" disabled={loading}>{loading ? "Saving..." : (editing ? "Update Post" : "Create Post")}</Button>
                  {editing && <Button variant="outline" onClick={() => { setEditing(null); setTitle(""); setDescription(""); setPrice("0"); }}>Cancel</Button>}
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="space-y-4">
            {posts.map((p) => (
              <div key={p.id} className="border rounded p-3 bg-white shadow">
                <div className="flex gap-4">
                  <div className="w-28 h-20 bg-gray-100 overflow-hidden rounded">
                    {p.image_url ? (
                      <Image src={`${process.env.NEXT_PUBLIC_API_URL}${p.image_url}`} className="w-full h-full object-cover" alt={`No Image`} />
                    ) : (
                      <div className="flex items-center justify-center text-sm text-gray-400 h-full">No image</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{p.title}</h3>
                    <p className="text-sm text-gray-600">₱{p.price}</p>
                    <p className="text-sm text-gray-500 line-clamp-2">{p.description}</p>
                    <div className="mt-2 flex gap-2">
                      <Button variant="outline" onClick={() => startEdit(p)}>Edit</Button>
                      <Button className="bg-red-600" onClick={() => handleDelete(p.id)}>Delete</Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {posts.length === 0 && <p className="text-gray-500">You have no posts yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
