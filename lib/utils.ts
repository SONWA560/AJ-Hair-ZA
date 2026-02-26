import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createUrl(pathname: string, params: URLSearchParams): string {
  const paramsString = params.toString();
  const queryString = `${paramsString.length ? "?" : ""}${paramsString}`;

  return `${pathname}${queryString}`;
}

export function ensureStartsWith(stringToCheck: string, startsWith: string): string {
  if (!stringToCheck.startsWith(startsWith)) {
    return `${startsWith}${stringToCheck}`;
  }

  return stringToCheck;
}

export function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
}

export function validateEnvironmentVariables() {
  if (process.env.NEXT_PUBLIC_BASE_URL) return;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_BASE_URL environment variable is not set. Please set it to your production URL."
    );
  }
}
