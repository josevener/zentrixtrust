import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Metadata } from "next";
import { siteConfig } from "@/lib/seo";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: `Contact | ${siteConfig.name}`,
  description:
    "Get in touch with ZentrixMarket's support team for assistance or partnership inquiries.",
  openGraph: {
    title: `Contact | ${siteConfig.name}`,
    description:
      "Reach our team for help, feedback, or business partnerships.",
    url: `${siteConfig.url}/contact`,
    siteName: siteConfig.name,
    images: [{ url: siteConfig.image }],
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: siteConfig.twitter,
    title: `Contact | ${siteConfig.name}`,
    description:
      "Reach our team for help, feedback, or business partnerships.",
    images: [siteConfig.image],
  },
  alternates: {
    canonical: `${siteConfig.url}/contact`,
  },
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <ContactClient />
      <Footer />
    </>
  );
}
