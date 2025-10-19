"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  User,
  DollarSign,
  Calendar,
  Package,
  Search,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import AuthHeader from "@/components/AuthHeader";

// Mock data for transactions
const mockTransactions = [
  {
    transaction_uuid: "123e4567-e89b-12d3-a456-426614174000",
    buyer_id: 1,
    seller_id: 2,
    buyer_name: "John Doe",
    seller_name: "Jane Smith",
    status: "ongoing",
    created_at: "2025-10-15T10:00:00Z",
    item_name: "Laptop",
    description: "High-performance gaming laptop with RTX 3080",
    amount: 1200.0,
  },
  {
    transaction_uuid: "223e4567-e89b-12d3-a456-426614174001",
    buyer_id: 3,
    seller_id: 1,
    buyer_name: "Alice Johnson",
    seller_name: "John Doe",
    status: "completed",
    created_at: "2025-10-16T14:30:00Z",
    completed_at: "2025-10-18T09:00:00Z",
    item_name: "Smartphone",
    description: "Latest model smartphone with 128GB storage",
    amount: 800.0,
  },
  {
    transaction_uuid: "323e4567-e89b-12d3-a456-426614174002",
    buyer_id: 1,
    seller_id: 4,
    buyer_name: "John Doe",
    seller_name: "Bob Wilson",
    status: "ongoing",
    created_at: "2025-10-17T09:15:00Z",
    item_name: "Headphones",
    description: "Wireless noise-canceling headphones",
    amount: 150.0,
  },
  {
    transaction_uuid: "423e4567-e89b-12d3-a456-426614174003",
    buyer_id: 4,
    seller_id: 1,
    buyer_name: "Bob Wilson",
    seller_name: "John Doe",
    status: "completed",
    created_at: "2025-10-10T12:00:00Z",
    completed_at: "2025-10-12T15:00:00Z",
    item_name: "Tablet",
    description: "10-inch tablet with stylus support",
    amount: 500.0,
  },
];

export default function OngoingTransactionsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        const userTransactions = mockTransactions.filter(
          (t) =>
            Number(t.buyer_id) === user?.id || Number(t.seller_id) === user?.id
        );
        setTransactions(userTransactions);
        setFilteredTransactions(userTransactions);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError("Failed to load transactions");
        toast.error("Failed to load transactions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [user, router]);

  // Filter transactions based on status and search query
  useEffect(() => {
    let result = transactions;

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.item_name.toLowerCase().includes(query) ||
          t.buyer_name.toLowerCase().includes(query) ||
          t.seller_name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      );
    }

    setFilteredTransactions(result);
  }, [statusFilter, searchQuery, transactions]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex flex-col items-center">
      
      <AuthHeader />

      <div className="w-full max-w-5xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900">My Transactions</h1>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-600">Loading transactions...</p>
        ) : error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : filteredTransactions.length === 0 ? (
          <p className="text-center text-gray-600">
            No transactions found for the selected criteria.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTransactions.map((transaction) => (
              <Card
                key={transaction.transaction_uuid}
                className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden border border-gray-100"
              >
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="h-5 w-5 text-emerald-600" />
                    {transaction.item_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-gray-500" />
                      <p className="text-sm text-gray-700">
                        {Number(transaction.buyer_id) === user?.id
                          ? `Seller: ${transaction.seller_name}`
                          : `Buyer: ${transaction.buyer_name}`}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {transaction.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-gray-500" />
                      <p className="text-sm text-gray-700">
                        Amount: ${transaction.amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <p className="text-sm text-gray-700">
                        Started:{" "}
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-medium ${
                          transaction.status === "ongoing"
                            ? "text-blue-600"
                            : "text-green-600"
                        }`}
                      >
                        Status:{" "}
                        {transaction.status.charAt(0).toUpperCase() +
                          transaction.status.slice(1)}
                      </p>
                    </div>
                    <Button
                      asChild
                      className="w-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                      disabled={transaction.status === "completed"}
                    >
                      <Link href={`/chat/${transaction.transaction_uuid}`}>
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Chat
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
