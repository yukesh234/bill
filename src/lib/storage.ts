import AsyncStorage from "@react-native-async-storage/async-storage";

import type { TemplateId } from "@/lib/templates";

const ISSUER_KEY = "billmaker.issuer";
const QR_KEY = "billmaker.qr";
const BILLS_KEY = "billmaker.bills";
const CUSTOMERS_KEY = "billmaker.customers";
const COUNTER_KEY = "billmaker.counter";

export type Profile = {
  issuer: string | null;
  qr: string | null;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
};

export type BillDraft = {
  customer: string;
  phone: string;
  amount: number;
  note: string;
  template: TemplateId;
};

export type SavedBill = BillDraft & {
  id: string;
  seq: number;
  createdAt: string;
};

function makeId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function loadProfile(): Promise<Profile> {
  const entries = await AsyncStorage.multiGet([ISSUER_KEY, QR_KEY]);
  const map = Object.fromEntries(entries);
  return { issuer: map[ISSUER_KEY] ?? null, qr: map[QR_KEY] ?? null };
}

export function saveIssuer(name: string) {
  return AsyncStorage.setItem(ISSUER_KEY, name);
}

export function saveQr(dataUri: string) {
  return AsyncStorage.setItem(QR_KEY, dataUri);
}

export function clearQr() {
  return AsyncStorage.removeItem(QR_KEY);
}

export async function peekNextSeq(): Promise<number> {
  const raw = await AsyncStorage.getItem(COUNTER_KEY);
  const current = raw ? parseInt(raw, 10) : 0;
  return (Number.isFinite(current) ? current : 0) + 1;
}

export async function loadBills(): Promise<SavedBill[]> {
  const bills = await readJson<SavedBill[]>(BILLS_KEY, []);
  return bills.sort((a, b) => b.seq - a.seq);
}

export async function upsertBill(
  draft: BillDraft,
  existingId: string | null,
): Promise<SavedBill> {
  const bills = await readJson<SavedBill[]>(BILLS_KEY, []);
  const index = existingId
    ? bills.findIndex((bill) => bill.id === existingId)
    : -1;

  if (index >= 0) {
    const updated: SavedBill = { ...bills[index], ...draft };
    bills[index] = updated;
    await AsyncStorage.setItem(BILLS_KEY, JSON.stringify(bills));
    return updated;
  }

  const seq = await peekNextSeq();
  const created: SavedBill = {
    ...draft,
    id: makeId(),
    seq,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.multiSet([
    [COUNTER_KEY, String(seq)],
    [BILLS_KEY, JSON.stringify([created, ...bills])],
  ]);
  return created;
}

export async function deleteBill(id: string): Promise<void> {
  const bills = await readJson<SavedBill[]>(BILLS_KEY, []);
  await AsyncStorage.setItem(
    BILLS_KEY,
    JSON.stringify(bills.filter((bill) => bill.id !== id)),
  );
}

export async function loadCustomers(): Promise<Customer[]> {
  const list = await readJson<Customer[]>(CUSTOMERS_KEY, []);
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export async function upsertCustomer(
  name: string,
  phone: string,
): Promise<void> {
  const trimmedName = name.trim();
  if (!trimmedName) return;

  const trimmedPhone = phone.trim();
  const list = await readJson<Customer[]>(CUSTOMERS_KEY, []);
  const key = trimmedName.toLowerCase();
  const existing = list.find((customer) => customer.name.toLowerCase() === key);

  if (existing) {
    existing.name = trimmedName;
    if (trimmedPhone) existing.phone = trimmedPhone;
  } else {
    list.push({ id: makeId(), name: trimmedName, phone: trimmedPhone });
  }

  await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(list));
}

export async function deleteCustomer(id: string): Promise<void> {
  const list = await readJson<Customer[]>(CUSTOMERS_KEY, []);
  await AsyncStorage.setItem(
    CUSTOMERS_KEY,
    JSON.stringify(list.filter((customer) => customer.id !== id)),
  );
}
