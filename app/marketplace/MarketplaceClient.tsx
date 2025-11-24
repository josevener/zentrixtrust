"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Heart, MessageCircle, Share2, Upload, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import AuthHeader from "@/components/AuthHeader";
import { useUser } from "@/context/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { Post } from "@/types/marketplace";
import { TransactionDisplay } from "@/types/transaction";

const PUBLIC_API = process.env.NEXT_PUBLIC_API_URL;

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
  const [openComments, setOpenComments] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isLiking, setIsLiking] = useState<{ [key: number]: boolean }>({});
  const [isCommenting, setIsCommenting] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [isSharing, setIsSharing] = useState<{ [key: number]: boolean }>({});
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmBuyOpen, setConfirmBuyOpen] = useState(false);
  const [postToBuy, setPostToBuy] = useState<Post | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categories = [
    "all",
    "electronics",
    "clothing",
    "furniture",
    "books",
    "other",
  ];

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get(
          `${PUBLIC_API}/api/posts`,
          {
            params: { userId: user?.id },
          }
        );
        setPosts(res.data);
        setFilteredPosts(res.data);
      } 
      catch (err) {
        console.error(`${new Date()} >> Failed to fetch posts:`, err);
      } 
      finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [user]);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        setIsLoading(true);

        const res = await fetch(`${PUBLIC_API}/api/transactions/get_all/${user.id}`, {
          credentials: "include", // include cookies for authentication
        });

        if (!res.ok) {
          throw new Error("Failed to fetch transactions");
        }

        const data: TransactionDisplay[] = await res.json();

        // Optional: sort by newest first
        const sorted = data.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setTransactions(sorted);
      } 
      catch (err: unknown) {
        console.error("Error fetching transactions:", err);

        const errorMessage = err instanceof Error ? err.message : "Failed to load transactions";

        toast.error(errorMessage);
      }
      finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [user?.id]);

  console.log("Transactions:", JSON.stringify(transactions, null, 2));
  
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
    if (
      !user ||
      !newPost.title ||
      !newPost.description ||
      !newPost.price ||
      !newPost.category
    )
      return;

    setIsPosting(true);
    const formData = new FormData();
    formData.append("title", newPost.title);
    formData.append("description", newPost.description);
    formData.append("price", newPost.price);
    if (newPost.image) formData.append("image", newPost.image);
    formData.append("user_id", user.id.toString());
    formData.append("category", newPost.category);

    try {
      const res = await axios.post(
        `${PUBLIC_API}/api/posts`,
        formData
      );
      const newPostData = {
        ...res.data,
        username: user.username || user.email.split("@")[0] || "Anonymous",
        created_at: new Date().toLocaleString(),
        likes: 0,
        liked_by_user: false,
        comments: [],
      };
      setPosts((prev) => [newPostData, ...prev]);
      setFilteredPosts((prev) => [newPostData, ...prev]);
      setNewPost({
        title: "",
        description: "",
        price: "",
        image: null,
        category: "",
      });
      setImagePreview(null);
      setIsModalOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } 
    catch (err) {
      console.error(`Error: >> Failed to create post:`, err);
    } 
    finally {
      setIsPosting(false);
    }
  };

  const handleTransaction = async (post: Post) => {
    if (!user) {
      toast.error("You must be logged in to buy.");
      return;
    }

    setIsBuying(true);
    try {
      const {
        id: postId,
        user_id: sellerId,
        price: amount,
      } = post;

      const body = {
        postId,
        buyerId: user.id,
        sellerId,
        amount,
      };

      const res = await axios.post(
        `${PUBLIC_API}/api/transactions/checkout_transaction`,
        body
      );

      const { transaction } = res.data;

      if (transaction) {
        router.push(`/messages/t/${transaction.uuid}`);
      } 
      else {
        toast.error("Transaction is invalid.");
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (error: any) {
      console.error("Transaction error:", error);
      toast.error(
        error.response?.data?.error || "Transaction failed."
      );
    }
    finally {
      setIsBuying(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setNewPost((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result)
          setImagePreview(event.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLike = async (postId: number) => {
    if (!user || isLiking[postId]) return;
    setIsLiking((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await axios.post(
        `${PUBLIC_API}/api/posts/${postId}/like`,
        {
          user_id: user.id,
        }
      );

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes:
                  res.data.action === "liked"
                    ? Number(post.likes) + 1
                    : Number(post.likes) - 1,
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
                likes:
                  res.data.action === "liked"
                    ? Number(post.likes) + 1
                    : Number(post.likes) - 1,
                liked_by_user: res.data.action === "liked",
              }
            : post
        )
      );

      if (selectedPost?.id === postId) {
        setSelectedPost((prev) =>
          prev
            ? {
                ...prev,
                likes:
                  res.data.action === "liked"
                    ? Number(prev.likes) + 1
                    : Number(prev.likes) - 1,
                liked_by_user: res.data.action === "liked",
              }
            : prev
        );
      }
    } 
    catch (err) {
      console.error("Failed to like post:", err);
    } 
    finally {
      setIsLiking((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleCommentSubmit = async (postId: number) => {
    if (!user || !newComment[postId]?.trim() || isCommenting[postId]) return;
    setIsCommenting((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await axios.post(
        `${PUBLIC_API}/api/posts/${postId}/comments`,
        {
          user_id: user.id,
          content: newComment[postId],
        }
      );
      const newCommentData = {
        ...res.data,
        username: user.username || user.email.split("@")[0] || "Anonymous",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
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
      if (selectedPost?.id === postId) {
        setSelectedPost((prev) =>
          prev
            ? { ...prev, comments: [...prev.comments, newCommentData] }
            : prev
        );
      }
      setNewComment((prev) => ({ ...prev, [postId]: "" }));
    } 
    catch (err) {
      console.error("Failed to add comment:", err);
    } 
    finally {
      setIsCommenting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleShare = (postId: number) => {
    if (isSharing[postId]) return;
    setIsSharing((prev) => ({ ...prev, [postId]: true }));
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url);
    toast.success("The post URL has been copied to your clipboard!");
    setIsSharing((prev) => ({ ...prev, [postId]: false }));
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
  };

  return (
    <>
      <AuthHeader />
      <div className="min-h-screen bg-gray-100 flex p-4 sm:p-6">
        {/* Left Sidebar: Filters */}
        <div className="w-64 fixed top-[5rem] left-0 h-[calc(100vh-5rem)] overflow-y-auto p-4 rounded-lg hidden xl:block">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Filters</h2>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 bg-gray-300 w-full rounded-lg" />
              <Skeleton className="h-10 bg-gray-300 w-full rounded-lg" />
            </div>
          ) : (
            <>
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-4 rounded-lg border-gray-300"
              />
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="rounded-lg">
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
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="w-full max-w-2xl mx-auto">
          {/* Mobile Filters */}
          <div className="mb-6 bg-white p-4 rounded-lg flex flex-col sm:flex-row gap-4 lg:hidden">
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-lg border-gray-300"
            />
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
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

          {/* Post Creation Input */}
          {user && (
            <Card className="mb-6 shadow-lg border-none bg-white rounded-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {loading ? (
                    <Skeleton className="h-10 w-10 bg-gray-200 rounded-full" />
                  ) : (
                    <Avatar className="h-10 w-10 border-2">
                      <AvatarImage
                        src={user.avatar || "/assets/images/default_user.png"}
                        alt={user.username}
                      />
                      <AvatarFallback>
                        {user.username?.charAt(0).toUpperCase() ||
                          user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <Input
                    placeholder="What's for sale?"
                    onFocus={() => setIsModalOpen(true)}
                    className="flex-1 rounded-full border-gray-300"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Post Creation Modal */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create a New Post</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePostSubmit} className="space-y-4">
                <div>
                  <Input
                    placeholder="What's for sale?"
                    value={newPost.title}
                    onChange={(e) =>
                      setNewPost((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="rounded-lg border-gray-300"
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Describe your item..."
                    value={newPost.description}
                    onChange={(e) =>
                      setNewPost((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="min-h-[100px] rounded-lg border-gray-300"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Price (₱)"
                    value={newPost.price}
                    onChange={(e) =>
                      setNewPost((prev) => ({ ...prev, price: e.target.value }))
                    }
                    className="rounded-lg border-gray-300"
                  />
                </div>
                <div>
                  <Select
                    value={newPost.category}
                    onValueChange={(value) =>
                      setNewPost((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger className="rounded-lg">
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
                    <div className="relative max-w-[100px] border-2 border-gray-300">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        height={45}
                        width={45}
                        className="w-full w-auto h-auto rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        className="absolute top-0 right-0 h-6 w-6 p-0 rounded-full"
                        onClick={() => {
                          setImagePreview(null);
                          setNewPost((prev) => ({ ...prev, image: null }));
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      setNewPost({
                        title: "",
                        description: "",
                        price: "",
                        image: null,
                        category: "",
                      });
                      setImagePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
                    disabled={
                      !newPost.title ||
                      !newPost.description ||
                      !newPost.price ||
                      !newPost.category ||
                      isPosting
                    }
                  >
                    {isPosting ? "Posting..." : "Post"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Post Detail Modal */}
          {selectedPost && (
            <Dialog
              open={!!selectedPost}
              onOpenChange={() => setSelectedPost(null)}
            >
              <DialogContent className="px-6">
                <DialogHeader>
                  <DialogTitle>{selectedPost.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {loading ? (
                      <Skeleton className="h-10 w-10 rounded-full" />
                    ) : (
                      <Avatar className="h-10 w-10 border-2">
                        <AvatarImage
                          src="/assets/images/default_user.png"
                          alt={selectedPost.username || "Anonymous"}
                        />
                        <AvatarFallback>
                          {(selectedPost.username || "Anonymous")
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <Link
                        href={`/profile/${selectedPost.username}`}
                        className="text-base font-semibold text-gray-800 hover:underline"
                      >
                        {selectedPost.username || "Anonymous"}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {selectedPost.category
                          ? selectedPost.category.charAt(0).toUpperCase() +
                            selectedPost.category.slice(1)
                          : "Uncategorized"}{" "}
                        • {selectedPost.created_at}
                      </p>
                    </div>
                  </div>
                  {selectedPost.image_url && (
                    <Image
                      src={`${PUBLIC_API}${selectedPost.image_url}`}
                      alt={selectedPost.title}
                      width={300}
                      height={200}
                      className="w-full h-auto max-h-[250px] cover-fit rounded-lg"
                    />
                  )}
                  <p className="text-gray-600 font-semibold">
                    ₱{selectedPost.price.toLocaleString()}
                  </p>
                  <p className="text-base text-gray-700">
                    {selectedPost.description}
                  </p>
                  <div className="flex gap-2 border-t border-b border-gray-200 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(selectedPost.id)}
                      className={`flex-1 ${
                        selectedPost.liked_by_user
                          ? "text-red-600"
                          : "text-gray-500"
                      } hover:bg-gray-100 cursor-pointer`}
                      disabled={isLiking[selectedPost.id]}
                    >
                      <Heart
                        className={`h-5 w-5 mr-2 ${
                          selectedPost.liked_by_user ? "fill-red-600" : ""
                        }`}
                      />
                      {`${selectedPost.likes} ${
                          selectedPost.likes === 1 ? "Like" : "Likes"
                      }`}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setOpenComments((prev) => ({
                          ...prev,
                          [selectedPost.id]: !prev[selectedPost.id],
                        }))
                      }
                      className="flex-1 hover:bg-gray-100 cursor-pointer"
                    >
                      <MessageCircle className="h-5 w-5 mr-2 text-gray-500" />
                      {selectedPost.comments.length}{" "}
                      {selectedPost.comments.length === 1
                        ? "Comment"
                        : "Comments"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare(selectedPost.id)}
                      className="flex-1 text-gray-500 hover:bg-gray-100 cursor-pointer"
                      disabled={isSharing[selectedPost.id]}
                    >
                      <Share2 className="h-5 w-5 mr-2" />
                      {isSharing[selectedPost.id] ? "Sharing..." : "Share"}
                    </Button>
                  </div>

                  {user?.username !== selectedPost.username && (
                    <div className="flex gap-2">
                      <Link href={`/post/${selectedPost.id}`}>
                        <Button
                          variant="outline"
                          className="w-full rounded-lg border-gray-300"
                        >
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/messages/${selectedPost.id}`}>
                        <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 rounded-lg">
                          Buy Now
                        </Button>
                      </Link>
                    </div>
                  )}
                  <Collapsible
                    open={openComments[selectedPost.id]}
                    onOpenChange={(open) =>
                      setOpenComments((prev) => ({
                        ...prev,
                        [selectedPost.id]: open,
                      }))
                    }
                  >
                    <CollapsibleContent className="mt-2 space-y-2 max-h-[300px] overflow-y-auto">
                      {selectedPost.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="flex items-start gap-2"
                        >
                          {loading ? (
                            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                          ) : (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage
                                src="/assets/images/default_user.png"
                                alt={comment.username || "Anonymous"}
                              />
                              <AvatarFallback>
                                {(comment.username || "Anonymous")
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="bg-gray-100 rounded-lg p-2 flex-1">
                            <p className="text-sm font-medium">
                              {comment.username || "Anonymous"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {comment.content}
                            </p>
                            <p className="text-xs text-gray-400">
                              {comment.timestamp}
                            </p>
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                  <div className="flex items-center gap-2 mt-2">
                    {loading ? (
                      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    ) : (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage
                          src={user?.avatar || "/assets/images/default_user.png"}
                          alt={user?.username || user?.email}
                        />
                        <AvatarFallback>
                          {(user?.username || user?.email || "A")
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <Input
                      placeholder="Write a comment..."
                      value={newComment[selectedPost.id] || ""}
                      onChange={(e) =>
                        setNewComment((prev) => ({
                          ...prev,
                          [selectedPost.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleCommentSubmit(selectedPost.id);
                        }
                      }}
                      className="flex-1 rounded-full border-gray-300"
                      disabled={isCommenting[selectedPost.id]}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Posts List */}
          {loading ? (
            <div className="space-y-6">
              {/* Render 3 skeleton cards to simulate loading posts */}
              {[1, 2, 3].map((_, index) => (
                <Card
                  key={index}
                  className="shadow-lg border-none bg-white rounded-lg"
                >
                  <CardHeader className="flex items-center gap-3 border-b border-gray-200 p-4">
                    <Skeleton className="bg-gray-200 h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="bg-gray-200 h-4 w-24" />
                      <Skeleton className="bg-gray-200 h-3 w-36" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <Skeleton className="bg-gray-200 h-5 w-3/4 mb-2" />
                    <Skeleton className="bg-gray-200 h-4 w-20 mb-2" />
                    <Skeleton className="bg-gray-200 h-4 w-full mb-2" />
                    <Skeleton className="bg-gray-200 h-4 w-5/6 mb-4" />
                    <Skeleton className="bg-gray-200 w-full h-64 rounded-lg mb-4" />
                    <div className="flex gap-2 mb-4 border-t border-b border-gray-200 py-2">
                      <Skeleton className="bg-gray-200 h-8 flex-1 rounded-lg" />
                      <Skeleton className="bg-gray-200 h-8 flex-1 rounded-lg" />
                      <Skeleton className="bg-gray-200 h-8 flex-1 rounded-lg" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Skeleton className="bg-gray-200 h-8 w-8 rounded-full flex-shrink-0" />
                      <Skeleton className="bg-gray-200 h-8 flex-1 rounded-full" />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Skeleton className="bg-gray-200 h-9 w-full rounded-lg" />
                      <Skeleton className="bg-gray-200 h-9 w-full rounded-lg" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              No posts available yet.
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map((post) => (
                <Card
                  key={post.id}
                  className="shadow-lg border-none bg-white rounded-lg"
                >
                  <CardHeader className="flex items-center gap-3 border-b border-gray-200 px-4">
                    {loading ? (
                      <Skeleton className="h-10 w-10 rounded-full" />
                    ) : (
                      <Avatar className="h-10 w-10 border-2">
                        <AvatarImage
                          src="/assets/images/default_user.png"
                          alt={post.username || "Anonymous"}
                        />
                        <AvatarFallback>
                          {(post.username || "Anonymous")
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <Link
                        href={`/profile/${post.username}`}
                        className="text-base font-semibold text-gray-800 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {post.username || "Anonymous"}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {post.category
                          ? post.category.charAt(0).toUpperCase() +
                            post.category.slice(1)
                          : "Uncategorized"}{" "}
                        • {post.created_at}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent
                    className="px-4 cursor-pointers"
                    onClick={() => handlePostClick(post)}
                  >
                    <div className="hover:bg-gray-100">
                      <h3 className="text-lg font-semibold">{post.title}</h3>
                      <p className="text-gray-600 mb-2 font-semibold">
                        ₱{post.price.toLocaleString()}
                      </p>
                      <p className="text-base text-gray-700 mb-2">
                        {post.description}
                      </p>
                    </div>

                    {post.image_url && (
                      <Image
                        src={`${PUBLIC_API}${post.image_url}`}
                        alt={post.title}
                        width={600}
                        height={400}
                        className="w-full h-auto max-h-[500px] border object-cover rounded-lg mb-4"
                      />
                    )}
                    <div className="flex gap-2 mb-4 border-t border-b border-gray-200 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(post.id);
                        }}
                        className={`flex-1 ${
                          post.liked_by_user ? "text-red-600" : "text-gray-500"
                        } hover:bg-gray-100 cursor-pointer`}
                        disabled={isLiking[post.id]}
                      >
                        <Heart
                          className={`h-5 w-5 mr-2 ${
                            post.liked_by_user ? "fill-red-600" : ""
                          }`}
                        />
                        {`${post.likes} ${post.likes === 1 ? "Like" : "Likes"}`}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenComments((prev) => ({
                            ...prev,
                            [post.id]: !prev[post.id],
                          }));
                        }}
                        className="flex-1 hover:bg-gray-100 cursor-pointer"
                      >
                        <MessageCircle className="h-5 w-5 mr-2 text-gray-500" />
                        {post.comments.length}{" "}
                        {post.comments.length === 1 ? "Comment" : "Comments"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(post.id);
                        }}
                        className="flex-1 text-gray-500 hover:bg-gray-100 cursor-pointer"
                        disabled={isSharing[post.id]}
                      >
                        <Share2 className="h-5 w-5 mr-2" />
                        {isSharing[post.id] ? "Sharing..." : "Share"}
                      </Button>
                    </div>
                    {openComments[post.id] && (
                      <div className="mt-2 space-y-2 max-h-[300px] overflow-y-auto">
                        {post.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="flex items-start gap-2 w-full"
                          >
                            {loading ? (
                              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                            ) : (
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage
                                  src="/assets/images/default_user.png"
                                  alt={comment.username || "Anonymous"}
                                />
                                <AvatarFallback>
                                  {(comment.username || "Anonymous")
                                    .charAt(0)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="bg-gray-100 rounded-lg p-2 flex-1 w-full">
                              <p className="text-sm font-medium">
                                {comment.username || "Anonymous"}
                              </p>
                              <p className="text-sm text-gray-600">
                                {comment.content}
                              </p>
                              <p className="text-xs text-gray-400">
                                {comment.timestamp}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {loading ? (
                        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                      ) : (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage
                            src={user?.avatar || "/assets/images/default_user.png"}
                            alt={user?.username || user?.email}
                          />
                          <AvatarFallback>
                            {(user?.username || user?.email || "A")
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <Input
                        placeholder="Write a comment..."
                        value={newComment[post.id] || ""}
                        onChange={(e) =>
                          setNewComment((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleCommentSubmit(post.id);
                          }
                        }}
                        className="flex-1 rounded-full border-gray-300"
                        disabled={isCommenting[post.id]}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    {user?.username !== post.username && (
                      <div className="flex gap-2 mt-4">
                        <Link
                          href={`/post/${post.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            className="w-full rounded-lg border-gray-300 cursor-pointer"
                          >
                            View Details
                          </Button>
                        </Link>
                        <Button
                          className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPostToBuy(post);
                            setConfirmBuyOpen(true);
                          }}
                        >
                          Buy Now
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              <div className="text-center text-gray-500 mt-10">
                No more posts available.
              </div>
            </div>
          )}
        </div>
        
      {/* ----------------- BUY CONFIRMATION MODAL ----------------- */}
        <Dialog open={confirmBuyOpen} onOpenChange={setConfirmBuyOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="italic">Are you sure you want to buy this?</DialogTitle>
            </DialogHeader>

            {postToBuy && (
              <div className="space-y-3">
                {postToBuy.image_url && (
                  <Image
                    src={`${PUBLIC_API}${postToBuy.image_url}`}
                    alt={postToBuy.title}
                    width={200}
                    height={120}
                    className="w-full max-h-[70%] rounded-md object-cover"
                  />
                )}
                <p>
                  <strong>{postToBuy.title}</strong>
                </p>
                <p className="text-lg font-semibold">
                  ₱{postToBuy.price.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  Seller: <span className="font-medium">{postToBuy.username}</span>
                </p>
              </div>
            )}

            <DialogFooter className="gap-2 sm:justify-end">
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => setConfirmBuyOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                onClick={async () => {
                  if (postToBuy) await handleTransaction(postToBuy);
                  setConfirmBuyOpen(false);
                }}
                disabled={isBuying}
              >
                {isBuying ? 'Buying...' : 'Yes, I want to buy it'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Right Sidebar: Recent Transactions */}
        <div className="w-64 fixed top-[5rem] right-0 h-[calc(100vh-5rem)] p-4 rounded-lg hidden xl:block">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Recent Transactions
          </h2>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full bg-gray-300 rounded-lg" />
              <Skeleton className="h-8 w-full bg-gray-300 rounded-lg" />
              <Skeleton className="h-8 w-full bg-gray-300 rounded-lg" />
            </div>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {transactions.slice(0, 5).map((tx, index) => (
                <div key={++index} className="p-3 bg-white border rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{tx.buyer_name}</span> bought{" "}
                    <span className="font-medium">{tx.item_name}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {tx.created_at}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
