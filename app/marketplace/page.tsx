import { Metadata } from "next";
import MarketplaceClient from "./MarketplaceClient";

export const metadata: Metadata = {
  title: "Zentrix Marketplace | Buy & Sell Safely",
  description: "Discover a secure and trusted marketplace by Zentrix. Buy and sell products directly with verified users — with protected transactions and chat features.",
  keywords: [
    "Zentrix",
    "marketplace",
    "buy and sell",
    "secure marketplace",
    "Philippines marketplace",
    "escrow platform",
    "safe online buying",
  ],
  openGraph: {
    title: "Zentrix Marketplace | Safe & Trusted Deals",
    description: "Join the Zentrix Marketplace — connect with buyers and sellers directly, negotiate securely, and enjoy peace of mind with protected payments.",
    url: "https://zentrixtrust.com/marketplace",
    siteName: "Zentrix Marketplace",
    images: [
      {
        url: "https://zentrixtrust.com/images/og-marketplace.jpg",
        width: 1200,
        height: 630,
        alt: "Zentrix Marketplace Preview",
      },
    ],
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zentrix Marketplace | Buy & Sell with Confidence",
    description:
      "Experience a seamless and secure way to buy and sell online. Start dealing safely with Zentrix Marketplace.",
    images: ["https://zentrixtrust.com/images/og-marketplace.jpg"],
  },
};

export default function MarketplacePage() {
  return <MarketplaceClient />;
}
