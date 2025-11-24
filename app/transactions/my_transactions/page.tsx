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
  Blocks,
  PackageSearch,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import AuthHeader from "@/components/AuthHeader";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

interface Transaction {
  transaction_uuid: string;
  buyer_id: number;
  seller_id: number;
  buyer_name: string;
  seller_name: string;
  status: "pending" | "released" | "disputed" | "cancelled";
  created_at: string;
  item_name: string;
  description: string;
  amount: string;
}

const PUBLIC_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3300";

export default function MyTransactionsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`${PUBLIC_API}/api/transactions/get_all/${user.id}`, {
          credentials: "include", // include cookies for authentication
        });

        if (!res.ok) {
          throw new Error("Failed to fetch transactions");
        }

        const data: Transaction[] = await res.json();

        // Optional: sort by newest first
        const sorted = data.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setTransactions(sorted);
        setFilteredTransactions(sorted);
      } 
      catch (err: unknown) {
        console.error("Error fetching transactions:", err);

        const errorMessage = err instanceof Error ? err.message : "Failed to load transactions";

        setError(errorMessage);
        toast.error(errorMessage);
      }
      finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [user?.id]);

  // Filtering logic
  useEffect(() => {
    let result = transactions;

    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

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

  // Helper to format status nicely
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Helper to determine if chat should be disabled
  const isChatDisabled = (status: string) => {
    return !["pending", "released"].includes(status); // adjust logic as needed
  };

  if (!user) {
    return <div className="text-center mt-10">Please log in to view transactions.</div>;
  }

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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="released">Released</SelectItem>
                {/* Add more statuses if you have them */}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
            <p className="text-center text-gray-600">Loading transactions...</p>
          ) : error ? (
            <p className="text-center text-red-600">{error}</p>
          ) : filteredTransactions.length === 0 ? (
            searchQuery || statusFilter !== "all" ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <PackageSearch />
                  </EmptyMedia>
                  <EmptyTitle>Transactions not found</EmptyTitle>
                  <EmptyDescription>
                    No transactions match your filters.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Blocks />
                  </EmptyMedia>
                  <EmptyTitle>No Transactions Yet</EmptyTitle>
                  <EmptyDescription>
                    You haven&apos;t created any transactions. Get started by selling or buying items.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <div className="flex gap-2">
                    <Button className="bg-emerald-600 hover:bg-emerald-500 cursor-pointer">Post products</Button>
                    <Button variant="outline" onClick={() => router.push('/marketplace')} className="cursor-pointer">Browse products</Button> 
                  </div>
                </EmptyContent>
              </Empty>
            )
          ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTransactions.map((transaction) => (
              <Card
                key={transaction.transaction_uuid}
                className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden border border-gray-100"
              >
                <CardHeader
                  className={`bg-gradient-to-r ${
                    transaction.status === "released"
                      ? "from-green-50 to-emerald-50"
                      : "from-blue-50 to-indigo-50"
                  }`}
                >
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
                        {transaction.buyer_id === user.id
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
                        Amount: ₱{parseFloat(transaction.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <p className="text-sm text-gray-700">
                        {new Date(transaction.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium px-2 py-1 rounded-full ${
                          transaction.status === "released"
                            ? "bg-green-100 text-green-800"
                            : transaction.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {formatStatus(transaction.status)}
                      </span>
                    </div>

                    <Button
                      asChild
                      className="w-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                      disabled={isChatDisabled(transaction.status)}
                    >
                      <Link href={`/messages/c/${transaction.transaction_uuid}`}>
                        <MessageSquare className="h-5 w-5 mr-2" />
                        {isChatDisabled(transaction.status) ? "Chat Closed" : "Open Chat"}
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