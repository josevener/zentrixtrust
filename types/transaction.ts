export interface Message {
  id: number;
  transaction_id: string;
  sender_id: number;
  sender_name: string;
  content: string;
  images?: string[];
  timestamp: string;
}

export interface UserProfile {
  id: number;
  username: string;
  fullname?: string;
  email: string;
  mobile_number: string;
  avatar?: string;
}

export interface Transaction {
  id: string;
  transaction_uuid: string;
  seller_name: string;
  username: string;
  title: string;
  description: string;
  post_image_url: string;
  category: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface AccountInfo {
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
}