"use client";

import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
    useOrganizationList,
    UserButton,
} from "@clerk/nextjs";
import { Heart, LayoutDashboard, User } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function AuthButtons() {
  const isHydrated = useHydrated();
  const { userMemberships } = useOrganizationList({ userMemberships: true });

  const isAdminOrgMember = userMemberships?.data?.some(
    (m) => m.organization.id === process.env.NEXT_PUBLIC_ADMIN_ORG_ID
  ) ?? false;

  if (!isHydrated) {
    return (
      <div className="flex gap-4">
        <div className="h-10 w-20 animate-pulse rounded bg-neutral-200" />
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="text-sm font-medium hover:text-blue-600">
            Sign In
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Sign Up
          </button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        {isAdminOrgMember && (
          <Link
            href="/admin"
            aria-label="Admin Dashboard"
            className="text-neutral-500 transition-colors hover:text-black dark:text-neutral-400 dark:hover:text-white"
          >
            <LayoutDashboard size={20} />
          </Link>
        )}
        <Link
          href="/account/wishlist"
          aria-label="Wishlist"
          className="text-neutral-500 transition-colors hover:text-black dark:text-neutral-400 dark:hover:text-white"
        >
          <Heart size={20} />
        </Link>
        <Link
          href="/account"
          aria-label="My Account"
          className="text-neutral-500 transition-colors hover:text-black dark:text-neutral-400 dark:hover:text-white"
        >
          <User size={20} />
        </Link>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </>
  );
}
