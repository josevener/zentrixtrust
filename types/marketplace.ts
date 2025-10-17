export default interface Comment {
  id: number;
  user_id: number;
  username: string;
  content: string;
  timestamp: string;
}

export interface Post {
  id: number;
  title: string;
  price: number;
  description: string;
  image_url: string | null;
  user_id: number;
  username: string;
  category: string | null;
  created_at: string;
  likes: number;
  liked_by_user: boolean;
  comments: Comment[];
}