"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Shield, MessageCircle, ShoppingBag } from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import FeatureCard from "@/components/FeatureCard";

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow">
      <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center text-lg font-bold mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-emerald-700 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-100 text-gray-800 flex flex-col">
      {/* HEADER */}
      <Header />

      {/* HERO SECTION */}
      <section className="flex-1 relative py-28 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-extrabold text-emerald-700 mb-6"
          >
            Buy & Sell Safely — Powered by ZentrixTrust
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-lg text-gray-600 mb-10 leading-relaxed"
          >
            ZentrixTrust helps you buy and sell securely with built-in
            security, real-time messaging, and verified users. Every transaction
            protected — every deal transparent.
          </motion.p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/marketplace">
              <Button size="lg" className="bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer">
                Explore Marketplace
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="cursor-pointer">
                Become a Seller
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Shield className="w-10 h-10 text-emerald-600" />}
            title="Escrow Protection"
            description="Payments are held securely until both buyer and seller complete their sides of the transaction."
          />
          <FeatureCard
            icon={<MessageCircle className="w-10 h-10 text-emerald-600" />}
            title="Real-Time Messaging"
            description="Communicate directly with the seller in a protected chat linked to each transaction."
          />
          <FeatureCard
            icon={<ShoppingBag className="w-10 h-10 text-emerald-600" />}
            title="Seamless Checkout"
            description="Integrated payment flow that ensures safety, convenience, and instant confirmation."
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-emerald-50 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-emerald-700 mb-8">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <Step
              number="1"
              title="Find a Listing"
              description="Browse verified sellers offering items and services across categories."
            />
            <Step
              number="2"
              title="Make Payment"
              description="Your payment is held in escrow until delivery is confirmed."
            />
            <Step
              number="3"
              title="Chat & Complete"
              description="Communicate, confirm, and release payment securely once satisfied."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-emerald-700 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-6">Start Trading with Confidence</h2>
          <p className="text-lg mb-8 text-emerald-100">
            Join thousands of verified users buying and selling safely online.
          </p>
          <Link href="/marketplace">
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-100">
              Browse Marketplace
            </Button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}