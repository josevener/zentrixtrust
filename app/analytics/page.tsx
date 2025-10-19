"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, DollarSign, List } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import AuthHeader from "@/components/AuthHeader";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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

export default function TransactionAnalyticsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<{
    totalSpent: number;
    totalEarned: number;
    ongoingCount: number;
    completedCount: number;
  }>({ totalSpent: 0, totalEarned: 0, ongoingCount: 0, completedCount: 0 });

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        const userTransactions = mockTransactions.filter(
          (t) =>
            Number(t.buyer_id) === user?.id || Number(t.seller_id) === user?.id
        );

        // Calculate analytics
        const totalSpent = userTransactions
          .filter((t) => Number(t.buyer_id) === user?.id)
          .reduce((sum, t) => sum + t.amount, 0);
        const totalEarned = userTransactions
          .filter((t) => Number(t.seller_id) === user?.id)
          .reduce((sum, t) => sum + t.amount, 0);
        const ongoingCount = userTransactions.filter(
          (t) => t.status === "ongoing"
        ).length;
        const completedCount = userTransactions.filter(
          (t) => t.status === "completed"
        ).length;

        setAnalytics({ totalSpent, totalEarned, ongoingCount, completedCount });
        setTransactions(userTransactions);
      } 
      catch (err) {
        console.error("Error fetching transactions:", err);
        setError("Failed to load analytics");
        toast.error("Failed to load analytics");
      } 
      finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [user, router]);

  // Prepare chart data
  const chartData = {
    labels: transactions.map((t) =>
      new Date(t.created_at).toLocaleDateString()
    ),
    datasets: [
      {
        label: "Transaction Amount ($)",
        data: transactions.map((t) => t.amount),
        backgroundColor: "rgba(16, 185, 129, 0.6)", // emerald-600 with opacity
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Transaction Amounts Over Time",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Amount ($)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Date",
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex flex-col items-center">
      <AuthHeader />
      <div className="w-full max-w-5xl p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Transaction Analytics
          </h1>
          <Button asChild variant="outline" className="bg-white">
            <Link href="/transactions">
              <List className="h-5 w-5 mr-2" />
              View Transactions
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-600">Loading analytics...</p>
        ) : error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : transactions.length === 0 ? (
          <p className="text-center text-gray-600">
            No transactions available for analytics.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-white shadow-lg rounded-xl border border-gray-100">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  Total Spent
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold text-gray-900">
                  ${analytics.totalSpent.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  As buyer across all transactions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg rounded-xl border border-gray-100">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  Total Earned
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold text-gray-900">
                  ${analytics.totalEarned.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  As seller across all transactions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg rounded-xl border border-gray-100">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-emerald-600" />
                  Transaction Counts
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    Ongoing:{" "}
                    <span className="font-bold">{analytics.ongoingCount}</span>
                  </p>
                  <p className="text-sm text-gray-700">
                    Completed:{" "}
                    <span className="font-bold">
                      {analytics.completedCount}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg rounded-xl border border-gray-100 col-span-1 md:col-span-2 lg:col-span-3">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-emerald-600" />
                  Transaction Amounts Over Time
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-64">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
