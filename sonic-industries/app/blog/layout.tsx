import Link from "next/link";
import Image from "next/image";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Sonic Industries home">
            <Image
              src="/sonic_logo_transparent.png"
              alt="Sonic Industries"
              width={564}
              height={153}
              priority
              className="h-10 w-auto object-contain"
            />
          </Link>

          <nav className="flex items-center gap-6 text-sm font-medium text-gray-700">
            <Link href="/" className="transition hover:text-red-600">
              Home
            </Link>
            <Link href="/blog" className="text-red-600">
              Blog
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-16 border-t border-gray-100 py-8 text-center text-sm text-gray-500">
        Copyright © {new Date().getFullYear()}{" "}
        <span className="font-semibold text-red-600">Sonic Industries</span>.
        All rights reserved.
      </footer>
    </div>
  );
}
