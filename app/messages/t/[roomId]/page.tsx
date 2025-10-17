"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import { toast } from "sonner";
import { Transaction, UserProfile } from "@/types/transaction";

const PUBLIC_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3300";

export default function TransactionDetailsPage() {
  const { roomId } = useParams();
  const { user } = useUser();
  // const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [seller, setSeller] = useState<UserProfile | null>(null);
  // const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [isReleasing, setIsReleasing] = useState(false);

  const transactionUUID = Array.isArray(roomId) ? roomId[0] : roomId;

  // Fetch transaction, seller, and account information
  useEffect(() => {
    if (!user || !transactionUUID) return;

    const fetchTransactionDetails = async () => {
      try {
        // Fetch transaction details
        const transactionRes = await axios.get(
          `${PUBLIC_API}/api/transactions/${transactionUUID}`
        );
        const transactionData = transactionRes.data;
        console.log(
          "transactionData: ",
          JSON.stringify(transactionData, null, 2)
        );
        setTransaction(transactionData);

        // Fetch seller details
        const sellerRes = await axios.get(
          `${PUBLIC_API}/api/users/${transactionData.seller_id}`
        );
        setSeller(sellerRes.data);

        // Fetch seller's account information (assuming an endpoint exists)
        // const accountRes = await axios.get(
        //   `${PUBLIC_API}/api/users/${transactionData.seller_id}/account`
        // );
        // setAccountInfo(accountRes.data);
      } catch (err) {
        console.error("Error fetching transaction details:", err);
        toast.error("Failed to load transaction details");
      }
    };

    fetchTransactionDetails();
  }, [transactionUUID, user]);

  const handleReleasePayment = async () => {
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
        }
      );
      toast.success("Payment released to ZentrixTrust successfully!");
      // Refresh transaction data
      const transactionRes = await axios.get(
        `${PUBLIC_API}/api/transactions/${transactionUUID}`
      );
      setTransaction(transactionRes.data);
    } catch (err) {
      console.error("Error releasing payment:", err);
      toast.error("Failed to release payment");
    } finally {
      setIsReleasing(false);
    }
  };

  if (!transaction || !seller) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-5xl">
        {/* Seller Info Header */}
        <TooltipProvider>
          <Tooltip>
            <Link href={`/profile/${transaction.username}`}>
              <div className="bg-white rounded-t-xl shadow-lg ring-1 ring-gray-200 p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors duration-200">
                <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center">
                  <User className="h-6 w-6 text-emerald-700" />
                </div>
                <TooltipTrigger asChild>
                  <h2 className="text-xl font-semibold text-emerald-800 hover:underline">
                    {seller.username || transaction.seller_name || "Seller"}
                  </h2>
                </TooltipTrigger>
              </div>
            </Link>
            <TooltipContent className="bg-white rounded-lg shadow-xl p-4 z-10 w-64">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center">
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
                className="text-xs text-gray-600 hover:underline mt-2"
              >
                View full profile
              </Link>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Transaction Details Container */}
        <div className="bg-white rounded-b-xl shadow-lg ring-1 ring-gray-200 p-6 flex flex-col gap-6">
          {/* Post Details */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Post Details
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Title:</strong> {transaction.title}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Description:</strong> {transaction.description}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Category:</strong> {transaction.category}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Price:</strong> ${transaction.amount}
              </p>
              {transaction.post_image_url && (
                <div className="mt-2">
                  <Image
                    src={transaction.post_image_url}
                    alt="Post image"
                    width={150}
                    height={100}
                    className="rounded-lg shadow-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Seller Details */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Seller Details
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Username:</strong>{" "}
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

          {/* Seller's Account Information */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Seller's Account Information
            </h3>
            {/* {accountInfo ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Bank Name:</strong> {accountInfo.bank_name || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Account Holder:</strong> {accountInfo.account_holder || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Account Number:</strong> {accountInfo.account_number || "N/A"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No account information available.
              </p>
            )} */}
          </div>

          {/* Transaction Details */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Transaction Details
            </h3>
            <div className="space-y-2">
              {/* <p className="text-sm text-gray-600">
                <strong>Transaction ID:</strong> {transaction.transaction_uuid}
              </p> */}
              <p className="text-sm text-gray-600">
                <strong>Amount:</strong> ₱{transaction.amount}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Status:</strong> {transaction.status}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Created At:</strong>{" "}
                {new Date(transaction.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Release Payment Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleReleasePayment}
              className="bg-emerald-600 text-white hover:bg-emerald-700 transition-colors duration-200"
              disabled={isReleasing || transaction.status !== "pending"}
            >
              {isReleasing ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                "Release Payment to ZentrixTrust"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
