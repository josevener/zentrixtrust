import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-emerald-900 text-emerald-100 py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        <div>
          <h4 className="text-lg font-semibold mb-3 text-white">ZentrixTrust</h4>
          <p className="text-sm text-emerald-200 leading-relaxed">
            A secure marketplace built with trust, transparency, and technology —
            connecting buyers and sellers safely worldwide.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-white">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-white">About Us</Link></li>
            <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
            <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-white">Resources</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
            <li><Link href="/faq" className="hover:text-white">FAQs</Link></li>
            <li><Link href="/support" className="hover:text-white">Contact Support</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-white">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-emerald-800 mt-12 pt-6 text-center text-sm text-emerald-400">
        © {new Date().getFullYear()} ZentrixTrust. All rights reserved.
      </div>
    </footer>
  );
}