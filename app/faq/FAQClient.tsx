"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How does ZentrixMarket ensure secure transactions?",
    answer:
      "We hold funds in escrow until both buyer and seller confirm the transaction is complete. This ensures neither party is at risk.",
  },
  {
    question: "Is there a transaction fee?",
    answer:
      "Yes, a small service fee is applied to each transaction to cover escrow and security costs. Exact rates are displayed at checkout.",
  },
  {
    question: "Can I cancel a deal?",
    answer:
      "Yes, as long as both parties agree or the order is still under review. Refunds are automatically processed to the buyer.",
  },
  {
    question: "How can I contact support?",
    answer:
      "You can reach our team anytime via the Contact page or at support@zentrixmarket.com.",
  },
];

export default function FAQClient() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold text-emerald-700 mb-8 text-center">
        Frequently Asked Questions
      </h1>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">{faq.question}</h2>
              <ChevronDown
                className={`h-5 w-5 text-emerald-600 transition-transform ${
                  open === i ? "rotate-180" : ""
                }`}
              />
            </div>
            {open === i && (
              <p className="mt-3 text-gray-700 leading-relaxed">{faq.answer}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
