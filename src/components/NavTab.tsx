// src/components/NavTab.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavTab({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`px-3 py-1 rounded ${
        isActive
          ? "text-blue-600 font-bold border-b-2 border-blue-600"
          : "text-gray-600"
      }`}
    >
      {children}
    </Link>
  );
}
