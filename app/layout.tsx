import {
    ClerkProvider,
} from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { AuthenticatedCartProvider } from "components/cart/authenticated-cart-provider";
import { Navbar } from "components/layout/navbar";
import { GeistSans } from "geist/font/sans";
import type { Cart } from "lib/types";
import { baseUrl } from "lib/utils";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";

const { SITE_NAME } = process.env;

export const metadata = {
  metadataBase: new URL(baseUrl()),
  title: {
    default: SITE_NAME!,
    template: `%s | ${SITE_NAME}`,
  },
  robots: {
    follow: true,
    index: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Initial cart promise (will be replaced by client-side when user auth state is known)
  const initialCartPromise: Promise<Cart | undefined> = Promise.resolve(undefined);

  return (
    <ClerkProvider>
      <html lang="en" className={GeistSans.variable}>
        <body
          className="bg-neutral-50 text-black selection:bg-teal-300 dark:bg-neutral-900 dark:text-white dark:selection:bg-pink-500 dark:selection:text-white"
          suppressHydrationWarning
        >
          <AuthenticatedCartProvider>
            <Navbar />
            <main>
              {children}
              <Toaster closeButton />
            </main>
          </AuthenticatedCartProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
