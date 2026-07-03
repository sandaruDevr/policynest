import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge tailwind class names safely. Used by every UI primitive. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
