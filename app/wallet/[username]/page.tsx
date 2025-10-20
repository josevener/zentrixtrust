"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, DollarSign, List, ArrowUpCircle, ArrowDownCircle, Search } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import Link from "next/link";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import AuthHeader from "@/components/AuthHeader";

const PUBLIC_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3300";

// Mock data for wallet and transactions
const mockWallet = {
  user_id: 1,
  balance: 25000.00,
  currency: "PHP",
};

const mockTransactions = [
  {
    transaction_uuid: "123e4567-e89b-12d3-a456-426614174000",
    buyer_id: 1,
    seller_id: 2,
    buyer_name: "John Doe",
    seller_name: "Jane Smith",
    status: "completed",
    created_at: "2025-10-15T10:00:00Z",
    completed_at: "2025-10-16T12:00:00Z",
    item_name: "Laptop",
    description: "High-performance gaming laptop with RTX 3080",
    amount: 64800.00,
    type: "purchase",
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
    amount: 43200.00,
    type: "sale",
  },
  {
    transaction_uuid: "523e4567-e89b-12d3-a456-426614174004",
    buyer_id: 1,
    seller_id: null,
    buyer_name: "John Doe",
    seller_name: null,
    status: "completed",
    created_at: "2025-10-14T08:00:00Z",
    completed_at: "2025-10-14T08:05:00Z",
    item_name: "Deposit",
    description: "Added funds to wallet",
    amount: 108000.00,
    type: "deposit",
  },
  {
    transaction_uuid: "623e4567-e89b-12d3-a456-426614174005",
    buyer_id: null,
    seller_id: 1,
    buyer_name: null,
    seller_name: "John Doe",
    status: "completed",
    created_at: "2025-10-17T15:00:00Z",
    completed_at: "2025-10-17T15:10:00Z",
    item_name: "Withdrawal",
    description: "Withdrawn funds from wallet",
    amount: 27000.00,
    type: "withdrawal",
  },
];

export default function WalletPage() {
  const { user } = useUser();
  const router = useRouter();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: undefined, to: undefined });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [isWithdrawFundsModalOpen, setIsWithdrawFundsModalOpen] = useState(false);
  const [isTransactionDetailModalOpen, setIsTransactionDetailModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [addFundsAmount, setAddFundsAmount] = useState("");
  const [withdrawFundsAmount, setWithdrawFundsAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "gcash" | "paymaya" | "qrph" | "">("");

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setIsLoading(true);
        setWallet(mockWallet);
        const userTransactions = mockTransactions.filter(
          (t) =>
            Number(t.buyer_id) === user?.id ||
            Number(t.seller_id) === user?.id ||
            (t.type === "deposit" && Number(t.buyer_id) === user?.id) ||
            (t.type === "withdrawal" && Number(t.seller_id) === user?.id)
        );
        setTransactions(userTransactions);
        setFilteredTransactions(userTransactions);
      } 
      catch (err) {
        console.error("Error fetching wallet data:", err);
        setError("Failed to load wallet data");
        toast.error("Failed to load wallet data");
      } 
      finally {
        setIsLoading(false);
      }
    };

    fetchWalletData();
  }, [user?.id, router]);

  useEffect(() => {
    let result = transactions;

    if (typeFilter !== "all") {
      result = result.filter((t) => t.type === typeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.item_name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          (t.buyer_name && t.buyer_name.toLowerCase().includes(query)) ||
          (t.seller_name && t.seller_name.toLowerCase().includes(query))
      );
    }

    if (dateRange?.from && dateRange?.to) {
      result = result.filter((t) => {
        const createdAt = new Date(t.created_at);
        return createdAt >= dateRange.from! && createdAt <= dateRange.to!;
      });
    }

    setFilteredTransactions(result);
  }, [typeFilter, searchQuery, dateRange, transactions]);

  const handleAddFunds = async () => {
    if (!addFundsAmount || isNaN(Number(addFundsAmount)) || Number(addFundsAmount) < 10) {
      toast.error(Number(addFundsAmount) < 10 ? "Minimum deposit is ₱10.00" : "Invalid amount");
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    try {
      const amountInCents = Number(addFundsAmount) * 100;
      const response = await axios.post(`${PUBLIC_API}/api/payments/create-checkout-session`, {
        amount: amountInCents,
        description: `Add funds to TrustWallet via ${paymentMethod}`,
        user_id: user?.id,
      });

      const { checkoutUrl } = response.data;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }

      await axios.post(`${PUBLIC_API}/api/messages/system`, {
        transaction_uuid: `deposit_${Date.now()}`,
        content: `Added ₱${Number(addFundsAmount).toFixed(2)} to TrustWallet via ${paymentMethod}.`,
      });

      setWallet((prev: any) => ({
        ...prev,
        balance: prev.balance + Number(addFundsAmount),
      }));

      toast.success(`Successfully added ₱${Number(addFundsAmount).toFixed(2)} to TrustWallet`);
      setIsAddFundsModalOpen(false);
      setAddFundsAmount("");
      setPaymentMethod("");
    } 
    catch (err: any) {
      console.error("Error adding funds:", err.response?.data || err);
      toast.error(err.response?.data?.error || "Failed to add funds");
    }
  };

  const handleWithdrawFunds = async () => {
    if (!withdrawFundsAmount || isNaN(Number(withdrawFundsAmount)) || Number(withdrawFundsAmount) <= 0) {
      toast.error("Invalid amount");
      return;
    }

    if (Number(withdrawFundsAmount) > wallet.balance) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      await axios.post(`${PUBLIC_API}/api/wallet/withdraw`, {
        user_id: user?.id,
        amount: Number(withdrawFundsAmount),
      });

      await axios.post(`${PUBLIC_API}/api/messages/system`, {
        transaction_uuid: `withdrawal_${Date.now()}`,
        content: `Withdrawn ₱${Number(withdrawFundsAmount).toFixed(2)} from TrustWallet.`,
      });

      setWallet((prev: any) => ({
        ...prev,
        balance: prev.balance - Number(withdrawFundsAmount),
      }));

      const newTransaction = {
        transaction_uuid: `withdrawal_${Date.now()}`,
        buyer_id: null,
        seller_id: user?.id,
        buyer_name: null,
        seller_name: user?.username,
        status: "completed",
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        item_name: "Withdrawal",
        description: "Withdrawn funds from TrustWallet",
        amount: Number(withdrawFundsAmount),
        type: "withdrawal",
      };
      setTransactions((prev) => [...prev, newTransaction]);
      setFilteredTransactions((prev) => [...prev, newTransaction]);

      toast.success(`Successfully withdrawn ₱${Number(withdrawFundsAmount).toFixed(2)} from TrustWallet`);
      setIsWithdrawFundsModalOpen(false);
      setWithdrawFundsAmount("");
    } 
    catch (err) {
      console.error("Error withdrawing funds:", err);
      toast.error("Failed to withdraw funds");
    }
  };

  const handleTransactionClick = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsTransactionDetailModalOpen(true);
  };

  const handlePaymentMethodChange = (value: string) => {
    if (value === "card" || value === "gcash" || value === "") {
      setPaymentMethod(value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center">
      <AuthHeader />
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-screen-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between my-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">My TrustWallet</h1>
          <Button asChild variant="outline" className="bg-white w-full sm:w-auto hover:bg-gray-50 transition-colors">
            <Link href="/transactions" aria-label="View all TrustWallet transactions">
              <List className="h-5 w-5 mr-2" />
              View Transactions
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-label="Loading TrustWallet data" />
          </div>
        ) : error ? (
          <p className="text-center text-red-600 font-medium">{error}</p>
        ) : (
          <div className="flex flex-col gap-8">
            {/* TrustWallet Balance */}
            <Card className="bg-white shadow-md rounded-2xl border border-gray-200 w-full transition-all hover:shadow-lg">
              <CardHeader className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-t-2xl">
                <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center justify-center gap-2">
                  TrustWallet Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 text-center">
                <p className="text-4xl sm:text-5xl font-bold text-gray-800 transition-all duration-300">
                  ₱{wallet.balance.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500 mt-2">{wallet.currency}</p>
                <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
                  <Button
                    onClick={() => setIsAddFundsModalOpen(true)}
                    className="bg-emerald-600 text-white hover:bg-emerald-700 w-full sm:w-48 text-lg py-6 transition-all cursor-pointer"
                    aria-label="Add funds to TrustWallet"
                  >
                    <ArrowUpCircle className="h-6 w-6 mr-2" />
                    Add Funds
                  </Button>
                  <Button
                    onClick={() => setIsWithdrawFundsModalOpen(true)}
                    variant="outline"
                    className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 w-full sm:w-48 text-lg py-6 transition-all cursor-pointer"
                    aria-label="Withdraw funds from TrustWallet"
                  >
                    <ArrowDownCircle className="h-6 w-6 mr-2" />
                    Withdraw Funds
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* TrustWallet Transactions */}
            <Card className="bg-white shadow-md rounded-2xl border border-gray-200 w-full">
              <CardHeader className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-t-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
                    <List className="h-6 w-6 text-emerald-600" />
                    TrustWallet Transactions
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white rounded-lg border-gray-300 focus:ring-emerald-500"
                        aria-label="Search TrustWallet transactions"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-full sm:w-[180px] bg-white rounded-lg border-gray-300">
                          <SelectValue placeholder="Filter by type" />
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
                          <Button variant="outline" className="w-full sm:w-auto bg-white">
                            {dateRange?.from && dateRange?.to
                              ? `${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}`
                              : "Filter by date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="range"
                            selected={dateRange}
                            onSelect={(range: DateRange | undefined) => setDateRange(range)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {filteredTransactions.length === 0 ? (
                  <p className="text-center text-gray-600 py-6">No transactions found.</p>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-700">
                        <thead className="text-xs text-gray-600 uppercase bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3">Type</th>
                            <th scope="col" className="px-6 py-3">Item/Description</th>
                            <th scope="col" className="px-6 py-3">Amount</th>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTransactions.map((transaction) => (
                            <tr
                              key={transaction.transaction_uuid}
                              className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => handleTransactionClick(transaction)}
                              role="button"
                              aria-label={`View details for ${transaction.item_name} TrustWallet transaction`}
                            >
                              <td className="px-6 py-4 capitalize flex items-center gap-2">
                                {transaction.type === "purchase" && <ArrowDownCircle className="h-4 w-4 text-red-500" />}
                                {transaction.type === "sale" && <ArrowUpCircle className="h-4 w-4 text-green-500" />}
                                {transaction.type === "deposit" && <ArrowUpCircle className="h-4 w-4 text-blue-500" />}
                                {transaction.type === "withdrawal" && <ArrowDownCircle className="h-4 w-4 text-orange-500" />}
                                {transaction.type}
                              </td>
                              <td className="px-6 py-4">
                                {transaction.item_name}
                                <p className="text-xs text-gray-500">{transaction.description}</p>
                              </td>
                              <td className="px-6 py-4">
                                ₱{transaction.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                {transaction.type === "purchase" && <span className="text-red-500"> (Debit)</span>}
                                {transaction.type === "sale" && <span className="text-green-500"> (Credit)</span>}
                              </td>
                              <td className="px-6 py-4">{format(new Date(transaction.created_at), "PPP")}</td>
                              <td className="px-6 py-4 capitalize">{transaction.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                      {filteredTransactions.map((transaction) => (
                        <div
                          key={transaction.transaction_uuid}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md cursor-pointer transition-all"
                          onClick={() => handleTransactionClick(transaction)}
                          role="button"
                          aria-label={`View details for ${transaction.item_name} TrustWallet transaction`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {transaction.type === "purchase" && <ArrowDownCircle className="h-5 w-5 text-red-500" />}
                              {transaction.type === "sale" && <ArrowUpCircle className="h-5 w-5 text-green-500" />}
                              {transaction.type === "deposit" && <ArrowUpCircle className="h-5 w-5 text-blue-500" />}
                              {transaction.type === "withdrawal" && <ArrowDownCircle className="h-5 w-5 text-orange-500" />}
                              <span className="font-medium capitalize">{transaction.type}</span>
                            </div>
                            <span className="text-sm text-gray-500">{format(new Date(transaction.created_at), "PPP")}</span>
                          </div>
                          <p className="mt-2 font-semibold">{transaction.item_name}</p>
                          <p className="text-sm text-gray-500">{transaction.description}</p>
                          <p className="mt-2 text-lg font-bold">
                            ₱{transaction.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                            {transaction.type === "purchase" && <span className="text-red-500 text-sm"> (Debit)</span>}
                            {transaction.type === "sale" && <span className="text-green-500 text-sm"> (Credit)</span>}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Funds Modal */}
        <Dialog open={isAddFundsModalOpen} onOpenChange={setIsAddFundsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Funds to TrustWallet</DialogTitle>
              <DialogDescription>Choose a payment method and amount to add funds.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={handlePaymentMethodChange}>
                  <SelectTrigger id="payment-method" className="bg-white">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="gcash">GCash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (PHP)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={addFundsAmount}
                  onChange={(e) => setAddFundsAmount(e.target.value)}
                  placeholder="Enter amount (min ₱10)"
                  min="10"
                  step="0.01"
                  className="focus:ring-emerald-500"
                  aria-describedby="amount-hint"
                />
                <p id="amount-hint" className="text-xs text-gray-500">Minimum deposit is ₱10.00</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddFundsModalOpen(false)}
                aria-label="Cancel adding funds to TrustWallet"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddFunds}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={!addFundsAmount || Number(addFundsAmount) < 10 || !paymentMethod}
                aria-label="Confirm add funds to TrustWallet"
              >
                Add Funds
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Withdraw Funds Modal */}
        <Dialog open={isWithdrawFundsModalOpen} onOpenChange={setIsWithdrawFundsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Withdraw Funds from TrustWallet</DialogTitle>
              <DialogDescription>Enter the amount to withdraw from your TrustWallet.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="withdraw-amount">Amount (PHP)</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  value={withdrawFundsAmount}
                  onChange={(e) => setWithdrawFundsAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  className="focus:ring-emerald-500"
                  aria-describedby="withdraw-amount-hint"
                />
                <p id="withdraw-amount-hint" className="text-sm text-gray-500">
                  Available balance: ₱{wallet?.balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsWithdrawFundsModalOpen(false)}
                aria-label="Cancel withdrawal from TrustWallet"
              >
                Cancel
              </Button>
              <Button
                onClick={handleWithdrawFunds}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={!withdrawFundsAmount || Number(withdrawFundsAmount) <= 0}
                aria-label="Confirm withdrawal from TrustWallet"
              >
                Withdraw Funds
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transaction Detail Modal */}
        <Dialog open={isTransactionDetailModalOpen} onOpenChange={setIsTransactionDetailModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>TrustWallet Transaction Details</DialogTitle>
            </DialogHeader>
            {selectedTransaction && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-sm font-medium">Type</Label>
                    <p className="capitalize">{selectedTransaction.type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Amount</Label>
                    <p>
                      ₱{selectedTransaction.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      {selectedTransaction.type === "purchase" && <span className="text-red-500"> (Debit)</span>}
                      {selectedTransaction.type === "sale" && <span className="text-green-500"> (Credit)</span>}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Item</Label>
                  <p>{selectedTransaction.item_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-gray-600">{selectedTransaction.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-sm font-medium">Date</Label>
                    <p>{format(new Date(selectedTransaction.created_at), "PPP")}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <p className="capitalize">{selectedTransaction.status}</p>
                  </div>
                </div>
                {(selectedTransaction.buyer_name || selectedTransaction.seller_name) && (
                  <div>
                    <Label className="text-sm font-medium">Parties</Label>
                    <p>
                      {selectedTransaction.buyer_name && `Buyer: ${selectedTransaction.buyer_name}`}
                      {selectedTransaction.buyer_name && selectedTransaction.seller_name && " | "}
                      {selectedTransaction.seller_name && `Seller: ${selectedTransaction.seller_name}`}
                    </p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsTransactionDetailModalOpen(false)}
                aria-label="Close TrustWallet transaction details"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}