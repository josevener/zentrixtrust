"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  List,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  Copy,
  CheckCircle,
  Clock,
  DollarSign,
  Banknote,
  CreditCard,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Check,
  Plus,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import AuthHeader from "@/components/AuthHeader";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { copyToClipboard } from "@/helper/copyToClipboard";

const PUBLIC_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3300";

/* -------------------------------------------------
   MOCK DATA
   ------------------------------------------------- */
const mockWallet = {
  user_id: 1,
  balance: 25000.0,
  currency: "PHP",
  account_number: "1234-5678-9012",
  account_name: "John Doe",
  bank_name: "BDO Unibank",
  routing_code: "010540019",
};

const mockTransactions = [
  {
    transaction_uuid: "123e4567-e89b-12d3-a456-426614174000",
    buyer_id: 1,
    seller_id: 2,
    buyer_name: "John Doe",
    seller_name: "Jane Smith",
    status: "released",
    escrow_status: "released",
    created_at: "2025-10-15T10:00:00Z",
    completed_at: "2025-10-16T12:00:00Z",
    item_name: "Laptop",
    description: "High-performance gaming laptop with RTX 3080",
    amount: 64800.0,
    type: "purchase",
    reference: "REF-DEP-20251015",
  },
  {
    transaction_uuid: "112g4567-e89b-12d3-a456-426614174000",
    buyer_id: 1,
    seller_id: 2,
    buyer_name: "Jane Smith",
    seller_name: "John Doe",
    status: "released",
    escrow_status: "released",
    created_at: "2025-10-15T10:00:00Z",
    completed_at: "2025-10-16T12:00:00Z",
    item_name: "Laptop",
    description: "High-performance gaming laptop with RTX 3080",
    amount: 64800.0,
    type: "purchase",
    reference: "REF-DEP-20251015",
  },
  {
    transaction_uuid: "223e4567-e89b-12d3-a456-426614174001",
    buyer_id: 3,
    seller_id: 1,
    buyer_name: "Alice Johnson",
    seller_name: "John Doe",
    status: "released",
    escrow_status: "released",
    created_at: "2025-10-16T14:30:00Z",
    completed_at: "2025-10-18T09:00:00Z",
    item_name: "Smartphone",
    description: "Latest model smartphone with 128GB storage",
    amount: 43200.0,
    type: "sale",
    reference: null,
  },
  {
    transaction_uuid: "523e4567-e89b-12d3-a456-426614174004",
    buyer_id: 1,
    seller_id: null,
    buyer_name: "John Doe",
    seller_name: null,
    status: "completed",
    escrow_status: null,
    created_at: "2025-10-14T08:00:00Z",
    completed_at: "2025-10-14T08:05:00Z",
    item_name: "Deposit",
    description: "Added funds to wallet",
    amount: 108000.0,
    type: "deposit",
    reference: "REF-DEP-20251014",
  },
  {
    transaction_uuid: "623e4567-e89b-12d3-a456-426614174005",
    buyer_id: null,
    seller_id: 1,
    buyer_name: null,
    seller_name: "John Doe",
    status: "completed",
    escrow_status: null,
    created_at: "2025-10-17T15:00:00Z",
    completed_at: "2025-10-17T15:10:00Z",
    item_name: "Withdrawal",
    description: "Withdrawn funds from wallet",
    amount: 27000.0,
    type: "withdrawal",
    reference: "REF-WDL-20251017",
  },
  // Pending escrow
  {
    transaction_uuid: "held-1",
    buyer_id: 1,
    seller_id: 2,
    buyer_name: "John Doe",
    seller_name: "Jane Smith",
    status: "pending",
    escrow_status: "held",
    created_at: "2025-10-27T08:00:00Z",
    item_name: "Gaming Chair",
    description: "Buyer paid, awaiting seller confirmation",
    amount: 8500.0,
    type: "sale",
    reference: null,
  },
  {
    transaction_uuid: "held-2",
    buyer_id: 3,
    seller_id: 1,
    buyer_name: "Mike Tan",
    seller_name: "John Doe",
    status: "pending",
    escrow_status: "held",
    created_at: "2025-10-26T14:00:00Z",
    item_name: "Headphones",
    description: "Payment in escrow",
    amount: 3200.0,
    type: "sale",
    reference: null,
  },
];

export default function WalletPage() {
  const { user } = useUser();
  const router = useRouter();

  /* ---------- STATE ---------- */
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  // Add funds
  const [addAmt, setAddAmt] = useState("");
  const [payMethod, setPayMethod] = useState<"card" | "gcash" | "">("");
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // Withdraw
  const [withdrawAmt, setWithdrawAmt] = useState("");
  // const [bankAccount, setBankAccount] = useState("");

  /* ---------- FETCH ---------- */
  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoading(true);
        setWallet(mockWallet);

        const userTxs = mockTransactions.filter(
          (t) =>
            Number(t.buyer_id) === user?.id ||
            Number(t.seller_id) === user?.id ||
            (t.type === "deposit" && Number(t.buyer_id) === user?.id) ||
            (t.type === "withdrawal" && Number(t.seller_id) === user?.id)
        );
        setTransactions(userTxs);
        setFilteredTransactions(userTxs);
      } 
      catch (e: any) {
        console.error(e);
        setError("Failed to load wallet data");
        toast.error("Failed to load wallet data");
      } 
      finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [user?.id, router]);

  /* ---------- UPCOMING BALANCE ---------- */
  const upcomingBalance = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          t.type === "sale" &&
          (t.escrow_status === "held" || t.escrow_status === "released") &&
          t.status !== "completed"
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions]);

  /* ---------- FILTER ---------- */
  useEffect(() => {
    let list = transactions;

    if (typeFilter !== "all") list = list.filter((t) => t.type === typeFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.item_name?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.buyer_name?.toLowerCase().includes(q) ||
          t.seller_name?.toLowerCase().includes(q) ||
          t.reference?.toLowerCase().includes(q)
      );
    }
    if (dateRange?.from && dateRange?.to) {
      list = list.filter((t) => {
        const d = new Date(t.created_at);
        return d >= dateRange.from! && d <= dateRange.to!;
      });
    }

    setFilteredTransactions(list);
  }, [typeFilter, searchQuery, dateRange, transactions]);

  /* ---------- HANDLERS ---------- */
  const handleAddFundsEnhanced = async () => {
    const amt = Number(addAmt);
    if (!amt || amt < 10 || !payMethod) return;

    setIsAdding(true);
    try {
      const cents = Math.round(amt * 100 * 1.015); // include 1.5% fee
      const { data } = await axios.post(
        `${PUBLIC_API}/api/payments/create-checkout-session`,
        {
          amount: cents,
          description: `Add funds via ${payMethod}`,
          user_id: user?.id,
        }
      );

      if (data.checkoutUrl) {
        // Simulate success before redirect
        setWallet((w: any) => ({ ...w, balance: w.balance + amt }));
        setAddSuccess(true);
        toast.success(`₱${amt.toFixed(2)} added!`);

        setTimeout(() => {
          window.location.href = data.checkoutUrl;
        }, 1500);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Add funds failed");
    } finally {
      setIsAdding(false);
    }
  };

  // Add this inside your WalletPage component, just above the return()
  const [savedBanks] = useState([
    { id: 1, number: "1234-5678-9012", name: "John Doe", bank: "BDO" },
    { id: 2, number: "9876-5432-1098", name: "John Doe", bank: "BPI" },
  ]);
  const [selectedBank, setSelectedBank] = useState<any>(savedBanks[0]);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const feePercent = 0.02; // 2% fee
  const fee = Number(withdrawAmt) * feePercent;
  const netAmount = Number(withdrawAmt) - fee;
  const remainingBalance = wallet?.balance - Number(withdrawAmt);

  useEffect(() => {
    if (withdrawSuccess) {
      const timer = setTimeout(() => {
        setWithdrawOpen(false);
        setWithdrawSuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [withdrawSuccess]);

  const handleMax = () => {
    setWithdrawAmt(wallet.balance.toFixed(2));
  };

  const handleWithdrawEnhanced = async () => {
    const amt = Number(withdrawAmt);
    if (!amt || amt <= 0 || amt > wallet.balance || !selectedBank) return;

    setIsWithdrawing(true);
    try {
      await axios.post(`${PUBLIC_API}/api/wallet/withdraw`, {
        user_id: user?.id,
        amount: amt,
        bank_account: selectedBank.number,
      });

      setWallet((w: any) => ({ ...w, balance: w.balance - amt }));
      const newTx = {
        transaction_uuid: `wdl_${Date.now()}`,
        buyer_id: null,
        seller_id: user?.id,
        buyer_name: null,
        seller_name: user?.username,
        status: "completed",
        escrow_status: null,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        item_name: "Withdrawal",
        description: `Withdrawn to ${selectedBank.bank}`,
        amount: amt,
        type: "withdrawal",
        reference: `REF-WDL-${format(new Date(), "yyyyMMdd")}`,
      };
      setTransactions((p: any[]) => [...p, newTx]);

      setWithdrawSuccess(true);
      toast.success(`₱${amt.toFixed(2)} withdrawn successfully!`);
    } catch {
      toast.error("Withdraw failed");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const openDetail = (tx: any) => {
    setSelectedTx(tx);
    setDetailOpen(true);
  };

  /* ---------- UI HELPERS ---------- */
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      case "sale":
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case "deposit":
        return <ArrowUpCircle className="h-5 w-5 text-blue-600" />;
      case "withdrawal":
        return <ArrowDownCircle className="h-5 w-5 text-orange-600" />;
      default:
        return <DollarSign className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string, escrow?: string) => {
    if (escrow === "held")
      return (
        <Badge variant="secondary" className="text-xs">
          <Clock className="w-3 h-3 mr-1" />
          Held
        </Badge>
      );
    if (escrow === "released")
      return (
        <Badge className="bg-green-100 text-green-800 text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          Released
        </Badge>
      );
    if (status === "completed")
      return (
        <Badge className="bg-emerald-100 text-emerald-800 text-xs">
          Completed
        </Badge>
      );
    return (
      <Badge variant="outline" className="text-xs">
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50 to-teal-50 flex flex-col">
      <AuthHeader />
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto py-6 space-y-8">
        {/* Header */}
        {/* <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-800">My TrustWallet</h1>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/transactions">
              <List className="h-5 w-5 mr-2" />
              All Transactions
            </Link>
          </Button>
        </div> */}

        {/* Loading / Error */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        ) : error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : (
          <>
            {/* ========== ACCOUNT + BALANCE ROW ========== */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Account Details Card */}
              <Card className="bg-white/80 backdrop-blur shadow-xl rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Banknote className="h-6 w-6" />
                    Account Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-gray-600">
                        Account Number
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-mono text-lg text-gray-800">
                          {wallet.account_number}
                        </p>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="cursor-pointer"
                          onClick={() =>
                            copyToClipboard(
                              wallet.account_number,
                              "Account number"
                            )
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">
                        Account Name
                      </Label>
                      <p className="font-medium text-gray-800">
                        {wallet.account_name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Bank</Label>
                      <p className="font-medium text-gray-800">
                        {wallet.bank_name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">
                        Routing / SWIFT
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-mono text-gray-800">
                          {wallet.routing_code}
                        </p>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="cursor-pointer"
                          onClick={() =>
                            copyToClipboard(wallet.routing_code, "Routing code")
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Use these details when a buyer sends money to your account.
                  </p>
                </CardContent>
              </Card>

              {/* Enhanced Balance Card */}
              <Card className="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white shadow-2xl rounded-3xl overflow-hidden border-0">
                <CardHeader className="pb-8">
                  <CardTitle className="text-2xl flex items-start gap-2">
                    TrustWallet Balance
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-8 pb-10">
                  {/* Current Balance */}
                  <div className="text-center">
                    <p className="text-sm uppercase tracking-widest opacity-90">
                      Current Balance
                    </p>
                    <p className="text-6xl font-bold mt-2 drop-shadow-lg">
                      ₱
                      {wallet?.balance.toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xs opacity-75 mt-1">
                      Available to withdraw now
                    </p>
                  </div>

                  {/* Upcoming Balance */}
                  <div className="bg-white/10 backdrop-blur rounded-2xl p-5 text-center border border-white/20">
                    <div className="flex items-center justify-center gap-1 text-white/90">
                      <Clock className="h-4 w-4" />
                      <p className="text-sm uppercase tracking-wider">
                        Upcoming Balance
                      </p>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-70 hover:opacity-100"
                          >
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 text-xs bg-gray-800 text-white">
                          Money held in escrow. Will be released after buyer
                          confirms receipt.
                        </PopoverContent>
                      </Popover>
                    </div>

                    <p className="text-4xl font-bold mt-2">
                      ₱
                      {upcomingBalance.toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xs opacity-75 mt-1">
                      {upcomingBalance > 0
                        ? "Pending escrow release"
                        : "No pending funds"}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      size="lg"
                      className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold shadow-lg cursor-pointer"
                      onClick={() => setAddFundsOpen(true)}
                    >
                      <ArrowUpCircle className="h-6 w-6 mr-2" />
                      Add Funds
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      // className="border-white text-white hover:bg-white/20 font-semibold"
                      className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold shadow-lg cursor-pointer"
                      onClick={() => setWithdrawOpen(true)}
                      disabled={wallet?.balance <= 0}
                    >
                      <ArrowDownCircle className="h-6 w-6 mr-2" />
                      Withdraw
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ========== TIMELINE TRANSACTION HISTORY ========== */}
            <Card className="bg-white/80 backdrop-blur shadow-lg rounded-3xl border border-gray-100">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-3xl">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
                    <List className="h-6 w-6 text-emerald-700" />
                    Recent Activity
                  </CardTitle>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <Input
                        placeholder="Search…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-full sm:w-64"
                      />
                    </div>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-full sm:w-44">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="purchase">Purchases</SelectItem>
                        <SelectItem value="sale">Sales</SelectItem>
                        <SelectItem value="deposit">Deposits</SelectItem>
                        <SelectItem value="withdrawal">Withdrawals</SelectItem>
                      </SelectContent>
                    </Select>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline">
                          {dateRange?.from && dateRange?.to
                            ? `${format(dateRange.from, "PP")} – ${format(
                                dateRange.to,
                                "PP"
                              )}`
                            : "Date range"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="range"
                          selected={dateRange}
                          onSelect={(r) => setDateRange(r)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                {filteredTransactions.length === 0 ? (
                  <p className="text-center text-gray-600 py-12">
                    No transactions match your filters.
                  </p>
                ) : (
                  <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-200 to-teal-200 hidden md:block"></div>

                    <div className="space-y-8">
                      {filteredTransactions.map((tx, idx) => (
                        <div
                          key={idx}
                          className="relative flex items-start gap-4 md:ml-16 cursor-pointer group"
                          onClick={() => openDetail(tx)}
                        >
                          {/* Timeline Dot */}
                          <div className="absolute left-8 w-4 h-4 bg-white border-4 border-emerald-500 rounded-full -translate-x-1/2 shadow-md group-hover:scale-125 transition-transform hidden md:block"></div>

                          {/* Icon */}
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                            {getTypeIcon(tx.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {tx.item_name}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {tx.description}
                                </p>
                              </div>
                              {getStatusBadge(tx.status, tx.escrow_status)}
                            </div>

                            <div className="flex items-center justify-between mt-3">
                              <p className="text-xl font-bold text-gray-800">
                                {tx.type === "purchase" && "-"}
                                {tx.type === "sale" && "+"}₱
                                {tx.amount.toLocaleString("en-PH", {
                                  minimumFractionDigits: 2,
                                })}
                              </p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(tx.created_at), "MMM d, yyyy")}
                              </p>
                            </div>

                            {tx.reference && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                <span>{tx.reference}</span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-4 w-4"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(tx.reference, "Reference");
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
          <DialogContent
            className="
              sm:max-w-md md:max-w-3xl lg:max-w-4xl 
              w-[95vw] max-w-5xl
              bg-gradient-to-br from-white to-emerald-50/50 
              backdrop-blur-xl border border-emerald-200/50 
              shadow-2xl p-0
              flex flex-col
              max-h-[90vh]
            "
          >
            {/* === HEADER === */}
            <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                  <CreditCard className="h-8 w-8" />
                  Add Funds
                </DialogTitle>
                {addSuccess && (
                  <div className="flex items-center gap-2 text-white animate-pulse">
                    <Check className="h-6 w-6" />
                    <span className="text-lg font-semibold">Added!</span>
                  </div>
                )}
              </div>
              <DialogDescription className="text-emerald-50 mt-1">
                Choose a payment method and the amount you want to deposit.
              </DialogDescription>
            </DialogHeader>

            {/* === SCROLLABLE BODY === */}
            <div className="flex-1 overflow-y-auto p-6 pt-4 scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-emerald-50">
              {!addSuccess ? (
                <>
                  {/* Progress Steps */}
                  <div className="flex items-center justify-center mb-8">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-white text-emerald-600 flex items-center justify-center text-lg font-bold shadow-md">
                          1
                        </div>
                        <span className="font-semibold text-gray-700">
                          Method
                        </span>
                      </div>
                      <div className="w-24 h-1 bg-emerald-200"></div>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold">
                          2
                        </div>
                        <span className="font-medium text-gray-500">
                          Amount
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* === LEFT: PAYMENT METHOD === */}
                    <div className="space-y-5">
                      <Label className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-emerald-600" />
                        Payment Method
                      </Label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        {[
                          { value: "card", label: "Card", icon: CreditCard },
                          { value: "gcash", label: "GCash", icon: Wallet },
                        ].map((method) => (
                          <Button
                            key={method.value}
                            variant={
                              payMethod === method.value ? "default" : "outline"
                            }
                            className={`
                              h-24 flex flex-col items-center justify-center gap-2 text-lg font-medium
                              ${
                                payMethod === method.value
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                                  : "border-2 border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                              }
                            `}
                            onClick={() => setPayMethod(method.value as any)}
                            disabled={isAdding}
                          >
                            <method.icon className="h-7 w-7" />
                            <span>{method.label}</span>
                          </Button>
                        ))}
                      </div>

                      <div className="bg-emerald-50/70 rounded-xl p-4 text-sm">
                        <p className="text-emerald-700 font-medium">
                          Processing Fee: 1.5%
                        </p>
                        <p className="text-gray-600 mt-1">
                          Applied at checkout via secure gateway.
                        </p>
                      </div>
                    </div>

                    {/* === RIGHT: AMOUNT + QUICK AMOUNTS === */}
                    <div className="space-y-5">
                      <Label className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-emerald-600" />
                        Amount to Add
                      </Label>

                      <div className="relative mt-3">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl font-bold text-emerald-600">
                          ₱
                        </span>
                        <Input
                          type="number"
                          min="10"
                          step="0.01"
                          placeholder="10.00"
                          value={addAmt}
                          onChange={(e) => setAddAmt(e.target.value)}
                          className="pl-16 pr-20 text-3xl font-bold h-16 border-2 border-emerald-200 focus:border-emerald-500 focus:ring-0"
                          disabled={isAdding}
                        />
                      </div>

                      {/* QUICK AMOUNT BUTTONS */}
                      <div className="flex gap-2 mt-3">
                        {[100, 500, 1000].map((amt) => (
                          <Button
                            key={amt}
                            size="sm"
                            variant="outline"
                            className="flex-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-medium"
                            onClick={() => setAddAmt(amt.toFixed(2))}
                            disabled={isAdding}
                          >
                            ₱{amt.toLocaleString()}
                          </Button>
                        ))}
                      </div>

                      {/* Summary Card */}
                      {Number(addAmt) >= 10 && (
                        <Card className="bg-emerald-50/80 border-emerald-200 shadow-sm">
                          <CardContent className="p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Amount:</span>
                              <span className="font-bold text-emerald-700">
                                ₱{Number(addAmt).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Fee (1.5%):</span>
                              <span className="font-medium text-orange-600">
                                +₱{(Number(addAmt) * 0.015).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between font-semibold pt-2 border-t border-emerald-100">
                              <span className="text-gray-700">
                                Total Charged:
                              </span>
                              <span className="text-emerald-700">
                                ₱{(Number(addAmt) * 1.015).toFixed(2)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <p className="text-xs text-gray-500">
                        Minimum deposit: ₱10.00
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                /* === SUCCESS STATE === */
                <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center animate-pulse shadow-2xl">
                    <Check className="h-14 w-14 text-white" />
                  </div>
                  <div className="mt-8 max-w-md">
                    <h3 className="text-3xl font-bold text-emerald-800">
                      Funds Added!
                    </h3>
                    <p className="text-lg text-gray-700 mt-3">
                      ₱{Number(addAmt).toFixed(2)} added to your TrustWallet
                    </p>
                    <p className="text-sm text-gray-500 mt-4">
                      Payment via{" "}
                      <span className="font-medium capitalize">
                        {payMethod}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* === FIXED FOOTER === */}
            {!addSuccess && (
              <DialogFooter className="p-6 pt-4 bg-white border-t border-emerald-100 flex-shrink-0">
                <div className="flex justify-end gap-4 w-full">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setAddFundsOpen(false);
                      setAddAmt("");
                      setPayMethod("");
                    }}
                    disabled={isAdding}
                    className="px-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-lg h-14 px-10 shadow-xl"
                    onClick={handleAddFundsEnhanced}
                    disabled={
                      isAdding || !addAmt || Number(addAmt) < 10 || !payMethod
                    }
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Redirecting...
                      </>
                    ) : (
                      <>
                        <ArrowUpCircle className="mr-2 h-6 w-6" />
                        Add ₱
                        {Number(addAmt) >= 10
                          ? (Number(addAmt) * 1.015).toFixed(2)
                          : "0.00"}
                      </>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            )}

            {addSuccess && (
              <div className="p-6 bg-white border-t border-emerald-100 flex-shrink-0">
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      setAddFundsOpen(false);
                      setAddAmt("");
                      setPayMethod("");
                      setAddSuccess(false);
                    }}
                    className="px-12"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
          <DialogContent
            className="
              sm:max-w-md md:max-w-3xl lg:max-w-4xl 
              w-[95vw] max-w-5xl
              bg-gradient-to-br from-white to-emerald-50/50 
              backdrop-blur-xl border border-emerald-200/50 
              shadow-2xl p-0
              flex flex-col
              max-h-[90vh]
            "
          >
            {/* === HEADER === */}
            <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                  <ArrowDownCircle className="h-8 w-8" />
                  Withdraw Funds
                </DialogTitle>
                {withdrawSuccess && (
                  <div className="flex items-center gap-2 text-white animate-pulse">
                    <Check className="h-6 w-6" />
                    <span className="text-lg font-semibold">Success!</span>
                  </div>
                )}
              </div>
              <DialogDescription className="text-emerald-50 mt-1">
                Transfer money from TrustWallet to your bank account.
              </DialogDescription>
            </DialogHeader>

            {/* === SCROLLABLE BODY === */}
            <div className="flex-1 overflow-y-auto p-6 pt-4 scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-emerald-50">
              {!withdrawSuccess ? (
                <>
                  {/* Progress Steps */}
                  <div className="flex items-center justify-center mb-8">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-white text-emerald-600 flex items-center justify-center text-lg font-bold shadow-md">
                          1
                        </div>
                        <span className="font-semibold text-gray-700">
                          Amount
                        </span>
                      </div>
                      <div className="w-24 h-1 bg-emerald-200"></div>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold">
                          2
                        </div>
                        <span className="font-medium text-gray-500">Bank</span>
                      </div>
                    </div>
                  </div>

                  {/* === TWO-COLUMN LAYOUT === */}
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* === LEFT: AMOUNT + QUICK PERCENTAGES === */}
                    <div className="space-y-5">
                      <div>
                        <Label className="text-lg font-bold text-gray-800 flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-emerald-600" />
                          Amount to Withdraw
                        </Label>

                        {/* Input + Max */}
                        <div className="relative mt-3">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl font-bold text-emerald-600">
                            ₱
                          </span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={withdrawAmt}
                            onChange={(e) => setWithdrawAmt(e.target.value)}
                            className="pl-16 pr-20 text-3xl font-bold h-16 border-2 border-emerald-200 focus:border-emerald-500 focus:ring-0"
                            disabled={isWithdrawing}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 border-emerald-300 hover:bg-emerald-50 font-semibold"
                            onClick={handleMax}
                            disabled={isWithdrawing}
                          >
                            Max
                          </Button>
                        </div>

                        {/* QUICK PERCENTAGE BUTTONS */}
                        <div className="flex gap-2 mt-3">
                          {[25, 50, 75].map((pct) => (
                            <Button
                              key={pct}
                              size="sm"
                              variant="outline"
                              className="flex-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-medium"
                              onClick={() => {
                                const amount = (wallet.balance * pct) / 100;
                                setWithdrawAmt(amount.toFixed(2));
                              }}
                              // disabled={isWithdrawing || wallet.balance <= 0}
                            >
                              {pct}%
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Balance Summary */}
                      <Card className="bg-emerald-50/80 border-emerald-200 shadow-sm">
                        <CardContent className="p-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Available Balance:
                            </span>
                            <span className="font-bold text-emerald-700">
                              ₱
                              {wallet?.balance.toLocaleString("en-PH", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          {Number(withdrawAmt) > 0 && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Fee (2%):</span>
                                <span className="font-medium text-orange-600">
                                  -₱{fee.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between font-semibold">
                                <span className="text-gray-700">
                                  You Receive:
                                </span>
                                <span className="text-emerald-700">
                                  ₱{netAmount.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs pt-1 border-t border-emerald-100">
                                <span className="text-gray-500">
                                  Remaining:
                                </span>
                                <span className="font-medium">
                                  ₱
                                  {remainingBalance >= 0
                                    ? remainingBalance.toFixed(2)
                                    : "0.00"}
                                </span>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>

                      {/* Full Balance Warning */}
                      {Number(withdrawAmt) === wallet?.balance && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                          <p>
                            Withdrawing your full balance. Your wallet will be
                            empty after this.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* === RIGHT: BANK ACCOUNT (FIXED OVERFLOW) === */}
                    <div className="space-y-5">
                      <Label className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-emerald-600" />
                        Destination Bank Account
                      </Label>

                      <div className="mt-3">
                        <Select
                          value={selectedBank?.id.toString()}
                          onValueChange={(v) =>
                            setSelectedBank(
                              savedBanks.find((b) => b.id === Number(v))
                            )
                          }
                          disabled={isWithdrawing}
                        >
                          <SelectTrigger className="h-16 border-2 border-emerald-200">
                            <SelectValue>
                              {selectedBank ? (
                                <div className="flex items-center gap-3 w-full">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                                    <Banknote className="h-6 w-6 text-emerald-600" />
                                  </div>
                                  <div className="text-left min-w-0 flex-1">
                                    <p className="font-semibold text-lg truncate">
                                      {selectedBank.bank}
                                    </p>
                                    <p className="text-sm text-gray-600 font-mono truncate">
                                      {selectedBank.number}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                      {selectedBank.name}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-500">
                                  Select a bank account
                                </span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {savedBanks.map((bank) => (
                              <SelectItem
                                key={bank.id}
                                value={bank.id.toString()}
                              >
                                <div className="flex items-center gap-3 py-1">
                                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                    <Banknote className="h-5 w-5 text-emerald-600" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium truncate">
                                      {bank.bank}
                                    </p>
                                    <p className="text-sm text-gray-600 font-mono truncate">
                                      {bank.number}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                      {bank.name}
                                    </p>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        variant="ghost"
                        className="w-full mt-3 text-emerald-600 hover:bg-emerald-50 font-medium"
                        size="lg"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add New Bank Account
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                /* === SUCCESS STATE === */
                <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center animate-pulse shadow-2xl">
                    <Check className="h-14 w-14 text-white" />
                  </div>
                  <div className="mt-8 max-w-md">
                    <h3 className="text-3xl font-bold text-emerald-800">
                      Withdrawal Successful!
                    </h3>
                    <p className="text-lg text-gray-700 mt-3">
                      ₱{netAmount.toFixed(2)} sent to
                    </p>
                    <p className="text-xl font-bold text-emerald-700 mt-1">
                      {selectedBank.bank} •••• {selectedBank.number.slice(-4)}
                    </p>
                    <p className="text-sm text-gray-500 mt-4">
                      Reference:{" "}
                      <span className="font-mono">
                        REF-WDL-{format(new Date(), "yyyyMMdd")}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* === FIXED FOOTER === */}
            {!withdrawSuccess && (
              <DialogFooter className="p-6 pt-4 bg-white border-t border-emerald-100 flex-shrink-0">
                <div className="flex justify-end gap-4 w-full">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setWithdrawOpen(false);
                      setWithdrawAmt("");
                      setWithdrawSuccess(false);
                    }}
                    disabled={isWithdrawing}
                    className="px-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-lg h-14 px-10 shadow-xl"
                    onClick={handleWithdrawEnhanced}
                    disabled={
                      isWithdrawing ||
                      !withdrawAmt ||
                      Number(withdrawAmt) <= 0 ||
                      Number(withdrawAmt) > wallet.balance ||
                      !selectedBank
                    }
                  >
                    {isWithdrawing ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ArrowDownCircle className="mr-2 h-6 w-6" />
                        Withdraw ₱
                        {Number(withdrawAmt) > 0
                          ? netAmount.toFixed(2)
                          : "0.00"}
                      </>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            )}

            {withdrawSuccess && (
              <div className="p-6 bg-white border-t border-emerald-100 flex-shrink-0">
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      setWithdrawOpen(false);
                      setWithdrawAmt("");
                      setWithdrawSuccess(false);
                    }}
                    className="px-12"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
            </DialogHeader>

            {selectedTx && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3">
                  {getTypeIcon(selectedTx.type)}
                  <div>
                    <p className="font-medium capitalize">{selectedTx.type}</p>
                    <p className="text-sm text-gray-600">
                      {selectedTx.item_name}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Amount</Label>
                    <p className="font-semibold">
                      {selectedTx.type === "purchase" && "-"}
                      {selectedTx.type === "sale" && "+"}₱
                      {selectedTx.amount.toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">Date</Label>
                    <p>{format(new Date(selectedTx.created_at), "PPP")}</p>
                  </div>
                </div>

                {selectedTx.reference && (
                  <div>
                    <Label className="text-xs">Reference #</Label>
                    <div className="flex items-center gap-2">
                      <p className="font-mono">{selectedTx.reference}</p>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          copyToClipboard(selectedTx.reference, "Reference")
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-xs">Description</Label>
                  <p className="text-sm text-gray-600">
                    {selectedTx.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-xs">Status</Label>
                  {getStatusBadge(selectedTx.status, selectedTx.escrow_status)}
                </div>

                {(selectedTx.buyer_name || selectedTx.seller_name) && (
                  <div>
                    <Label className="text-xs">Parties</Label>
                    <p className="text-sm">
                      {selectedTx.buyer_name &&
                        `Buyer: ${selectedTx.buyer_name}`}
                      {selectedTx.buyer_name && selectedTx.seller_name && " | "}
                      {selectedTx.seller_name &&
                        `Seller: ${selectedTx.seller_name}`}
                    </p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
