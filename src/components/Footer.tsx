import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} AI Asset Studio. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/gallery" className="hover:text-white">
            Gallery
          </Link>
          <Link href="/pricing" className="hover:text-white">
            Pricing
          </Link>
          <Link href="/generate" className="hover:text-white">
            Generate
          </Link>
        </div>
      </div>
    </footer>
  );
}
