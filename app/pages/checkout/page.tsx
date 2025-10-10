"use client";

import React, { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const amount = 20; // Example ₱1,000

  const handlePay = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/create-checkout-session`,
        {
          amount,
          description: "Order #1234",
        }
      );

      const data = res.data;
      const checkoutUrl = data?.data?.attributes?.checkout_url;

      if (!checkoutUrl) {
        console.error("No checkout_url in response:", data);
        alert("Unable to create checkout session. Check backend logs.");
        setLoading(false);
        return;
      }

      window.location.href = checkoutUrl;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      alert("Failed to initialize payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="max-w-md w-full shadow-xl border border-emerald-200">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-emerald-700">
            Checkout
          </CardTitle>
          <CardDescription className="text-gray-500">
            Secure your payment via PayMongo
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-xl font-medium text-gray-700">
            Amount: <span className="text-emerald-700">₱{amount}</span>
          </p>

          <Button
            onClick={handlePay}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>Pay ₱{amount}</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
