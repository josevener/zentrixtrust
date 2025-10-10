import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Metadata } from "next";
import { siteConfig } from "@/lib/seo";
import FAQClient from "./FAQClient";

export const metadata: Metadata = {
  title: `FAQ | ${siteConfig.name}`,
  description: "Find answers to common questions about transactions, escrow, and security.",
  openGraph: {
    title: `FAQ | ${siteConfig.name}`,
    description: "Learn how ZentrixMarket protects your transactions and simplifies deals.",
    url: `${siteConfig.url}/faq`,
    siteName: siteConfig.name,
    images: [{ url: siteConfig.image }],
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: siteConfig.twitter,
    title: `FAQ | ${siteConfig.name}`,
    description: "Learn how ZentrixMarket protects your transactions and simplifies deals.",
    images: [siteConfig.image],
  },
  alternates: {
    canonical: `${siteConfig.url}/faq`,
  },
};

export default function FAQPage() {
  return (
    <>
      <Header />
      <FAQClient />
      <Footer />
    </>
  );
}
