"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Heart, MessageCircle, Share2, Upload, X, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import AuthHeader from "@/components/AuthHeader";
import { useUser } from "@/context/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Comment {
  id: number;
  user_id: number;
  username: string;
  content: string;
  timestamp: string;
}

interface Post {
  id: number;
  title: string;
  price: number;
  description: string;
  image_url: string;
  user_id: number;
  username: string;
  category: string | null;
  created_at: string;
  likes: number;
  liked_by_user: boolean;
  comments: Comment[];
}

export default function MarketplaceClient() {
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [newPost, setNewPost] = useState({
    title: "",
    description: "",
    price: "",
    image: null as File | null,
    category: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<{ [key: number]: string }>({});
  const [openComments, setOpenComments] = useState<{ [key: number]: boolean }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ["all", "electronics", "clothing", "furniture", "books", "other"];

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/posts`, {
          params: { userId: user?.id },
        });
        setPosts(res.data);
        setFilteredPosts(res.data);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [user]);

  useEffect(() => {
    const filtered = posts.filter(
      (post) =>
        (post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (selectedCategory === "all" || post.category === selectedCategory)
    );
    setFilteredPosts(filtered);
  }, [searchQuery, selectedCategory, posts]);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPost.title || !newPost.description || !newPost.price || !newPost.image || !newPost.category)
      return;

    const formData = new FormData();
    formData.append("title", newPost.title);
    formData.append("description", newPost.description);
    formData.append("price", newPost.price);
    formData.append("image", newPost.image);
    formData.append("user_id", user.id.toString());
    formData.append("category", newPost.category);

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/posts`, formData);
      setPosts((prev) => [
        {
          ...res.data,
          username: user.email.split("@")[0] || "Anonymous",
          created_at: new Date().toLocaleString(),
          likes: 0,
          liked_by_user: false,
          comments: [],
        },
        ...prev,
      ]);
      setFilteredPosts((prev) => [
        {
          ...res.data,
          username: user.email.split("@")[0] || "Anonymous",
          created_at: new Date().toLocaleString(),
          likes: 0,
          liked_by_user: false,
          comments: [],
        },
        ...prev,
      ]);
      setNewPost({ title: "", description: "", price: "", image: null, category: "" });
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Failed to create post:", err);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setNewPost((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setImagePreview(event.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLike = async (postId: number) => {
    if (!user) return;
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/like`, {
        user_id: user.id,
      });
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: res.data.action === "liked" ? post.likes + 1 : post.likes - 1,
                liked_by_user: res.data.action === "liked",
              }
            : post
        )
      );
      setFilteredPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: res.data.action === "liked" ? post.likes + 1 : post.likes - 1,
                liked_by_user: res.data.action === "liked",
              }
            : post
        )
      );
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  };

  const handleCommentSubmit = async (postId: number) => {
    if (!user || !newComment[postId]?.trim()) return;
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/comments`, {
        user_id: user.id,
        content: newComment[postId],
      });
      const newCommentData = {
        ...res.data,
        username: user.email.split("@")[0] || "Anonymous",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, comments: [...post.comments, newCommentData] }
            : post
        )
      );
      setFilteredPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, comments: [...post.comments, newCommentData] }
            : post
        )
      );
      setNewComment((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const handleShare = (postId: number) => {
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url);
    alert("Post URL copied to clipboard!");
  };

  return (
    <>
      <AuthHeader />
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          {/* Search and Filter */}
          <div className="mb-6 bg-white p-6 rounded-lg flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search posts by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-lg border-gray-300"
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px] rounded-lg">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Post Creation Form */}
          {user && (
            <Card className="mb-6 shadow-lg border-none bg-white rounded-lg">
              <CardContent className="p-4">
                <form onSubmit={handlePostSubmit} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar || "/default-avatar.png"} alt={user.email} />
                      <AvatarFallback>{user.email.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <Input
                      placeholder="What's for sale?"
                      value={newPost.title}
                      onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))}
                      className="flex-1 rounded-lg border-gray-300"
                    />
                  </div>
                  <Textarea
                    placeholder="Describe your item..."
                    value={newPost.description}
                    onChange={(e) => setNewPost((prev) => ({ ...prev, description: e.target.value }))}
                    className="min-h-[80px] rounded-lg border-gray-300"
                  />
                  <div className="flex gap-4">
                    <Input
                      type="number"
                      placeholder="Price (₱)"
                      value={newPost.price}
                      onChange={(e) => setNewPost((prev) => ({ ...prev, price: e.target.value }))}
                      className="w-1/3 rounded-lg border-gray-300"
                    />
                    <Select
                      value={newPost.category}
                      onValueChange={(value) => setNewPost((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="w-1/3 rounded-lg">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.slice(1).map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg border-gray-300"
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      Upload Image
                    </Button>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      ref={fileInputRef}
                    />
                    {imagePreview && (
                      <div className="relative max-w-[100px]">
                        <img src={imagePreview} alt="Preview" className="w-full rounded-lg" />
                        <Button
                          variant="destructive"
                          className="absolute top-0 right-0 h-6 w-6 p-0 rounded-full"
                          onClick={() => {
                            setImagePreview(null);
                            setNewPost((prev) => ({ ...prev, image: null }));
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
                    disabled={!newPost.title || !newPost.description || !newPost.price || !newPost.image || !newPost.category}
                  >
                    Post
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Posts List */}
          {loading ? (
            <div className="text-center text-gray-500 mt-10">Loading posts...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">No posts available yet.</div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="shadow-lg border-none bg-white rounded-lg">
                  <CardHeader className="flex items-center gap-3 border-b border-gray-200 p-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/default-avatar.png" alt={post.username || "Anonymous"} />
                      <AvatarFallback>
                        {(post.username || "Anonymous").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link href={`/profile/${post.user_id}`} className="text-base font-semibold text-gray-800 hover:underline">
                        {post.username || "Anonymous"}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {post.category ? post.category.charAt(0).toUpperCase() + post.category.slice(1) : "Uncategorized"} • {post.created_at}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                    {
                      post.image_url && (
                        <Image
                          src={post.image_url ?? "/assets/images/default_item.jpg"}
                          alt={post.title}
                          width={600}
                          height={400}
                          className="w-full h-auto max-h-[500px] object-cover rounded-lg mb-4"
                        />
                      )
                    } 
                    <p className="text-gray-600 mb-2 font-semibold">₱{post.price.toLocaleString()}</p>
                    <p className="text-base text-gray-700 mb-4">{post.description}</p>
                    <div className="flex gap-2 mb-4 border-t border-b border-gray-200 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(post.id)}
                        className={`flex-1 ${post.liked_by_user ? "text-blue-600" : "text-gray-500"} hover:bg-gray-100`}
                      >
                        <Heart className={`h-5 w-5 mr-2 ${post.liked_by_user ? "fill-blue-600" : ""}`} />
                        {post.likes} {post.likes === 1 ? "Like" : "Likes"}
                      </Button>
                      <Collapsible
                        open={openComments[post.id]}
                        onOpenChange={(open) => setOpenComments((prev) => ({ ...prev, [post.id]: open }))}
                        className="flex-1"
                      >
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="flex-1 hover:bg-gray-100">
                            <MessageCircle className="h-5 w-5 mr-2 text-gray-500" />
                            {post.comments.length} {post.comments.length === 1 ? "Comment" : "Comments"}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-2">
                          {post.comments.map((comment) => (
                            <div key={comment.id} className="flex items-start gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src="/default-avatar.png" alt={comment.username || "Anonymous"} />
                                <AvatarFallback>
                                  {(comment.username || "Anonymous").charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="bg-gray-100 rounded-lg p-2 flex-1">
                                <p className="text-sm font-medium">{comment.username || "Anonymous"}</p>
                                <p className="text-sm text-gray-600">{comment.content}</p>
                                <p className="text-xs text-gray-400">{comment.timestamp}</p>
                              </div>
                            </div>
                          ))}
                          <div className="flex items-center gap-2 mt-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user?.avatar || "/default-avatar.png"} alt={user?.email} />
                              <AvatarFallback>{user?.email.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <Input
                              placeholder="Write a comment..."
                              value={newComment[post.id] || ""}
                              onChange={(e) =>
                                setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleCommentSubmit(post.id);
                                }
                              }}
                              className="flex-1 rounded-full border-gray-300"
                            />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(post.id)}
                        className="flex-1 text-gray-500 hover:bg-gray-100"
                      >
                        <Share2 className="h-5 w-5 mr-2" />
                        Share
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/post/${post.id}`}>
                        <Button variant="outline" className="w-full rounded-lg border-gray-300">
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/messages/${post.id}`}>
                        <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 rounded-lg">
                          Message Seller
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}