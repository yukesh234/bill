import { Linking } from "react-native";

import type { BillData } from "@/lib/export-bill";
import { formatAmount } from "@/lib/format";

const DEFAULT_COUNTRY_CODE = "977";

/** Returns digits in international format without a plus sign, or null if invalid. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = DEFAULT_COUNTRY_CODE + digits.slice(1);
  } else if (digits.length === 10) {
    digits = DEFAULT_COUNTRY_CODE + digits;
  }

  return digits.length >= 11 && digits.length <= 15 ? digits : null;
}

export function buildMessage(bill: BillData): string {
  const lines = [
    `Hello ${bill.customer},`,
    `Your bill No. ${bill.billNo} from ${bill.issuer} is Rs. ${formatAmount(bill.amount)}.`,
  ];
  if (bill.note) lines.push(bill.note);
  lines.push("Please pay when you can. Thank you.");
  return lines.join("\n");
}

export async function openWhatsApp(
  phone: string,
  message: string,
): Promise<void> {
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  await Linking.openURL(url);
}
