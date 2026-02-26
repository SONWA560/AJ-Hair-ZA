"use client";

import { useSyncExternalStore } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function AuthButtons() {
  const isHydrated = useHydrated();

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
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </>
  );
}
