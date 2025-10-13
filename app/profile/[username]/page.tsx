"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Heart, MessageCircle, Share2, ChevronDown, ChevronUp } from "lucide-react";
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
  category: string | null;
  created_at: string;
  likes: number;
  liked_by_user: boolean;
  username: string;
  user_id: number;
  comments: Comment[];
}

interface ProfileUser {
  id: number;
  firstname: string;
  middlename: string | null;
  lastname: string;
  username: string;
  email: string;
  avatar: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const params = useParams();
  const usernameParams = params.username as string;
  const { user: currentUser } = useUser();
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [newComment, setNewComment] = useState<{ [key: number]: string }>({});
  const [openComments, setOpenComments] = useState<{ [key: number]: boolean }>({});

  const categories = ["all", "electronics", "clothing", "furniture", "books", "other"];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [userRes, postsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/username/${usernameParams}`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/user/${usernameParams}`, {
            params: { userId: currentUser?.id },
          }),
        ]);
        setProfileUser(userRes.data);
        setPosts(postsRes.data);
        setFilteredPosts(postsRes.data);
      } 
      catch (err) {
        console.error("Failed to fetch profile data:", err);
      } 
      finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [usernameParams, currentUser]);

  console.log("username params: ", usernameParams)
  useEffect(() => {
    const filtered = posts.filter(
      (post) =>
        (post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (selectedCategory === "all" || post.category === selectedCategory)
    );
    setFilteredPosts(filtered);
  }, [searchQuery, selectedCategory, posts]);

  const handleLike = async (postId: number) => {
    if (!currentUser) return;
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/like`, {
        user_id: currentUser.id,
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
    if (!currentUser || !newComment[postId]?.trim()) return;
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/comments`, {
        user_id: currentUser.id,
        content: newComment[postId],
      });
      const newCommentData = {
        ...res.data,
        username: currentUser.username || currentUser.email.split("@")[0] || "Anonymous",
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

  if (loading) {
    return <div className="text-center text-gray-500 mt-10">Loading profile...</div>;
  }

  if (!profileUser) {
    return <div className="text-center text-gray-500 mt-10">User not found.</div>;
  }

  const fullName = [
    profileUser.firstname,
    profileUser.middlename,
    profileUser.lastname
  ].filter(Boolean).join(" ");

  return (
    <>
      <AuthHeader />
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          {/* User Profile Header */}
          <Card className="shadow-lg border-none bg-white rounded-lg mb-6">
            <CardHeader className="flex flex-col items-center p-6 border-b border-gray-200">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={profileUser.avatar || "/default-avatar.png"} alt={fullName} />
                {/* <AvatarFallback>{profileUser.firstname.charAt(0).toUpperCase()}</AvatarFallback> */}
              </Avatar>
              <h2 className="text-2xl font-bold text-gray-800">{fullName || profileUser.username}</h2>
              <p className="text-sm text-gray-500">@{profileUser.username}</p>
              <p className="text-sm text-gray-500">{profileUser.email}</p>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-center text-gray-600">
                Joined: {new Date(profileUser.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4 text-gray-800">Posts</h2>

          {/* Search and Filter */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
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

          {/* Posts List */}
          {filteredPosts.length === 0 ? (
            <div className="text-center text-gray-500">No posts yet.</div>
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
                    <Image
                      src={post.image_url ?? "/assets/images/default_item.jpg"}
                      alt={post.title}
                      width={600}
                      height={400}
                      className="w-full h-auto max-h-[500px] object-cover rounded-lg mb-4"
                    />
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
                              <AvatarImage src={currentUser?.avatar || "/default-avatar.png"} alt={currentUser?.username || currentUser?.email} />
                              <AvatarFallback>{(currentUser?.username || currentUser?.email || "A").charAt(0).toUpperCase()}</AvatarFallback>
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