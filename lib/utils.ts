import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function standardizeAddress(address: string) {
  let cleanAddress = address.replace(/^0x/, "");
  if (cleanAddress.length < 64) {
    cleanAddress = cleanAddress.padStart(64, "0");
  }
  if (cleanAddress.length > 64) {
    throw new Error(`Address ${address} is not a valid address`);
  }
  return `0x${cleanAddress}`;
}