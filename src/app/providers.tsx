// src/app/providers.tsx
"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

type Props = { children: ReactNode };

export function Providers({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}
