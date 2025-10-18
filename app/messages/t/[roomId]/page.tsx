"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { User, MessageCircle } from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";
import { toast } from "sonner";
import { Transaction, UserProfile } from "@/types/transaction";

const PUBLIC_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3300";

export default function TransactionDetailsPage() {
  const { roomId } = useParams();
  const { user } = useUser();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [seller, setSeller] = useState<UserProfile | null>(null);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(3); // Mock unread message count
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const transactionUUID = Array.isArray(roomId) ? roomId[0] : roomId;

  useEffect(() => {
    if (!user || !transactionUUID) return;

    const fetchTransactionDetails = async () => {
      try {
        const transactionRes = await axios.get(
          `${PUBLIC_API}/api/transactions/${transactionUUID}`
        );
        setTransaction(transactionRes.data);

        const sellerRes = await axios.get(
          `${PUBLIC_API}/api/users/${transactionRes.data.seller_id}`
        );
        setSeller(sellerRes.data);
      } 
      catch (err) {
        console.error("Error fetching transaction details:", err);
        toast.error("Failed to load transaction details");
      }
    };

    fetchTransactionDetails();
  }, [transactionUUID, user]);

  const handleReleasePayment = async (method: string) => {
    if (!user || !transaction) {
      toast.error(
        "You must be logged in and have a valid transaction to release payment."
      );
      return;
    }

    setIsReleasing(true);
    try {
      await axios.post(
        `${PUBLIC_API}/api/transactions/${transactionUUID}/release`,
        {
          transactionId: transaction.id,
          buyerId: user.id,
          paymentMethod: method,
        }
      );
      toast.success(`Payment released via ${method} successfully!`);
      const transactionRes = await axios.get(
        `${PUBLIC_API}/api/transactions/${transactionUUID}`
      );
      setTransaction(transactionRes.data);
      setIsPaymentModalOpen(false);
    } 
    catch (err) {
      console.error("Error releasing payment:", err);
      toast.error("Failed to release payment");
    } 
    finally {
      setIsReleasing(false);
    }
  };

  const handleCancelTransaction = async () => {
    if (!user || !transaction) {
      toast.error(
        "You must be logged in and have a valid transaction to cancel."
      );
      return;
    }

    setIsCanceling(true);
    try {
      await axios.post(
        `${PUBLIC_API}/api/transactions/${transactionUUID}/cancel`,
        {
          transactionId: transaction.id,
          buyerId: user.id,
        }
      );
      toast.success("Transaction canceled successfully!");
      const transactionRes = await axios.get(
        `${PUBLIC_API}/api/transactions/${transactionUUID}`
      );
      setTransaction(transactionRes.data);
      setIsCancelModalOpen(false);
    } 
    catch (err) {
      console.error("Error canceling transaction:", err);
      toast.error("Failed to cancel transaction");
    } 
    finally {
      setIsCanceling(false);
    }
  };

  if (!transaction || !seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const paymentMethods = [
    { name: "QR Code", icon: "/assets/icons/QRPh.png" },
    { name: "Debit/Credit Card", icon: "/assets/icons/debit_credit_card.jpg" },
    { name: "Gcash", icon: "/assets/icons/gcash.png" },
    { name: "Paymaya", icon: "/assets/icons/paymaya.jpg" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header with Seller Info and Message Button */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
          <TooltipProvider>
            <Tooltip>
              <Link href={`/profile/${transaction.username}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-emerald-700" />
                  </div>
                  <TooltipTrigger asChild>
                    <h2 className="text-xl font-semibold text-gray-900 hover:text-emerald-600 transition-colors">
                      {seller.username || transaction.seller_name || "Seller"}
                    </h2>
                  </TooltipTrigger>
                </div>
              </Link>
              <TooltipContent className="bg-white rounded-lg shadow-lg p-4 w-72">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {seller.username || transaction.seller_name || "Seller"}
                    </p>
                    <p className="text-xs text-gray-500">Online</p>
                  </div>
                </div>
                <Link
                  href={`/profile/${transaction.username}`}
                  className="text-xs text-emerald-600 hover:underline mt-2 block"
                >
                  View full profile
                </Link>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="outline"
            className="relative border-emerald-200 hover:bg-emerald-50"
            asChild
          >
            <Link href={`/messages/${transactionUUID}`}>
              <MessageCircle className="h-5 w-5 text-emerald-600" />
              {unreadMessages > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </Link>
          </Button>
        </div>

        {/* Transaction Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Post Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Post Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Title:</strong> {transaction.title}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Category:</strong> {transaction.category}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Price:</strong> ₱{transaction.amount}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Description:</strong> {transaction.description}
                </p>
                {transaction.post_image_url && (
                  <Image
                    src={transaction.post_image_url}
                    alt="Post image"
                    width={200}
                    height={150}
                    className="rounded-lg shadow-sm"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Seller Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Seller Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <p className="text-sm text-gray-600">
                <strong>Name:</strong>{" "}
                {seller.username || transaction.seller_name || "N/A"}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Email:</strong> {seller.email || "N/A"}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Phone:</strong> {seller.mobile_number || "N/A"}
              </p>
            </div>
          </div>

          {/* Transaction Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Transaction Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4">
              <p className="text-sm text-gray-600">
                <strong>Payment Status:</strong>  Pending
                {/* {transaction.amount} */}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Amount:</strong> ₱{transaction.amount}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Status:</strong>{" "}
                <span
                  className={`capitalize ${
                    transaction.status === "pending"
                      ? "text-yellow-600"
                      : transaction.status === "completed"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {transaction.status}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                <strong>Date & Time:</strong>{" "}
                {new Date(transaction.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Payment Method Selection Modal */}
          <div className="flex justify-end gap-4">
            <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                  disabled={isCanceling || isReleasing || transaction.status !== "pending"}
                >
                  {isCanceling ? (
                    <div className="animate-spin h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full" />
                  ) : (
                    "Cancel Transaction"
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-gray-900">
                    Cancel Transaction
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-gray-600">
                    Are you sure you want to cancel this transaction? This action cannot be undone.
                  </p>
                </div>
                <DialogFooter className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    className="border-gray-200 cursor-pointer"
                    onClick={() => setIsCancelModalOpen(false)}
                    disabled={isCanceling}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                    onClick={handleCancelTransaction}
                    disabled={isCanceling}
                  >
                    {isCanceling ? (
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      "Yes, cancel"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2"
                  disabled={isReleasing || isCanceling || transaction.status !== "pending"}
                >
                  {isReleasing ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    "Release Payment"
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-gray-900">
                    Select Payment Method
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 p-4">
                  {paymentMethods.map((method) => (
                    <Button
                      key={method.name}
                      variant="outline"
                      className="flex flex-col items-center justify-center h-24 border-gray-200 hover:bg-emerald-50"
                      onClick={() => handleReleasePayment(method.name)}
                      disabled={isReleasing || isCanceling}
                    >
                      <Image
                        src={method.icon}
                        alt={`${method.name} icon`}
                        width={40}
                        height={40}
                        className="mb-2"
                      />
                      <span className="text-sm font-medium">{method.name}</span>
                    </Button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}