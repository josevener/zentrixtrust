export interface Message {
  id: number;
  transaction_uuid: string;
  sender_id: number;
  receiver_id: number;
  sender_name: string;
  receiver_name: string;
  content: string;
  images?: string[];
  timestamp: string;
}

export interface UserProfile {
  id: number;
  username: string;
  seller_name: string;
  fullname?: string;
  email: string;
  mobile_number: string;
  avatar?: string;
}

export interface Transaction {
  id: string;
  uuid: string;
  buyer_name: string;
  buyer_username: string;
  buyer_email: string;
  seller_name: string;
  seller_username: string;
  seller_email: string;
  title: string;
  description: string;
  post_image_url: string;
  category: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  status: string;
  payment_status: string;
  created_at: string;
}

export interface AccountInfo {
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
}