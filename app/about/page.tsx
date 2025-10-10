import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Metadata } from "next";
import { siteConfig } from "@/lib/seo";

export const generateMetadata = (): Metadata => ({
  title: `About | ${siteConfig.name}`,
  description: siteConfig.description,
  openGraph: {
    title: `About ${siteConfig.name}`,
    description: siteConfig.description,
    url: `${siteConfig.url}/about`,
    siteName: siteConfig.name,
    images: [{ url: siteConfig.image }],
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: siteConfig.twitter,
    title: `About ${siteConfig.name}`,
    description: siteConfig.description,
    images: [siteConfig.image],
  },
  alternates: {
    canonical: `${siteConfig.url}/about`,
  },
});

export default function AboutPage() {
  return (
    <>
      <Header />
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-emerald-700 mb-6">About ZentrixMarket</h1>
        <p className="text-lg text-gray-700 leading-relaxed mb-4">
          ZentrixMarket is a modern escrow-driven marketplace designed to ensure safe and transparent transactions between buyers and sellers.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          Our platform acts as a trusted middleman—holding payments securely until both parties confirm satisfaction. With real-time messaging and automated verification, ZentrixMarket simplifies digital trust.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Built by <strong>Zentrix</strong>, our goal is to empower online commerce with fairness, speed, and reliability.
        </p>
      </section>
      <Footer />
    </>
  );
}
