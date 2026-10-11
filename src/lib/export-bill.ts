import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type { RefObject } from "react";
import type { View } from "react-native";
import { captureRef } from "react-native-view-shot";

import { formatAmount } from "@/lib/format";
import type { TemplateId } from "@/lib/templates";

export type ExportFormat = "pdf" | "png" | "jpg";

export type BillData = {
  issuer: string;
  customer: string;
  amount: number;
  note: string;
  billNo: string;
  date: string;
  qr: string | null;
  template: TemplateId;
};

const MIME: Record<ExportFormat, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
};

const UTI: Record<ExportFormat, string> = {
  pdf: "com.adobe.pdf",
  png: "public.png",
  jpg: "public.jpeg",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function page(css: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1c1e21; margin: 0; padding: 40px; }
  .muted { color: #5f6670; font-size: 13px; margin: 4px 0 0; }
  ${css}
</style>
</head>
<body>${body}</body>
</html>`;
}

function noteHtml(bill: BillData): string {
  return bill.note ? `<p class="note">${escapeHtml(bill.note)}</p>` : "";
}

function qrHtml(bill: BillData): string {
  return bill.qr
    ? `<div class="qr"><img src="${bill.qr}" /><p class="muted">Scan to pay</p></div>`
    : "";
}

function classicHtml(bill: BillData): string {
  const css = `
  .head { display: flex; justify-content: space-between; border-bottom: 1px solid #d9dce1; padding-bottom: 16px; }
  h1 { font-size: 22px; margin: 0; }
  .label { color: #5f6670; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; margin: 28px 0 4px; }
  .customer { font-size: 20px; margin: 0; }
  .note { font-size: 14px; margin: 12px 0 0; }
  .total { margin-top: 28px; padding: 18px; background: #f3f4f6; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
  .total span { font-size: 14px; color: #5f6670; }
  .total strong { font-size: 26px; }
  .qr { margin-top: 32px; text-align: center; }
  .qr img { width: 180px; height: 180px; object-fit: contain; }`;

  const body = `
  <div class="head">
    <div>
      <h1>${escapeHtml(bill.issuer)}</h1>
      <p class="muted">Bill</p>
    </div>
    <div style="text-align:right">
      <p class="muted">No. ${escapeHtml(bill.billNo)}</p>
      <p class="muted">${escapeHtml(bill.date)}</p>
    </div>
  </div>
  <p class="label">Billed to</p>
  <p class="customer">${escapeHtml(bill.customer)}</p>
  ${noteHtml(bill)}
  <div class="total"><span>Amount due</span><strong>Rs. ${formatAmount(bill.amount)}</strong></div>
  ${qrHtml(bill)}`;

  return page(css, body);
}

function compactHtml(bill: BillData): string {
  const css = `
  .top { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #d9dce1; padding-bottom: 10px; }
  .top strong { font-size: 18px; }
  .mid { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 16px; gap: 16px; }
  .customer { font-size: 17px; margin: 2px 0 0; }
  .note { font-size: 13px; margin: 6px 0 0; }
  .amount { text-align: right; }
  .amount strong { font-size: 24px; display: block; }
  .qr { margin-top: 20px; text-align: right; }
  .qr img { width: 110px; height: 110px; object-fit: contain; }`;

  const body = `
  <div class="top">
    <strong>${escapeHtml(bill.issuer)}</strong>
    <span class="muted">No. ${escapeHtml(bill.billNo)} &middot; ${escapeHtml(bill.date)}</span>
  </div>
  <div class="mid">
    <div>
      <p class="muted">Billed to</p>
      <p class="customer">${escapeHtml(bill.customer)}</p>
      ${noteHtml(bill)}
    </div>
    <div class="amount">
      <p class="muted">Amount due</p>
      <strong>Rs. ${formatAmount(bill.amount)}</strong>
    </div>
  </div>
  ${qrHtml(bill)}`;

  return page(css, body);
}

function receiptHtml(bill: BillData): string {
  const css = `
  body { font-family: "Courier New", Courier, monospace; }
  .receipt { max-width: 320px; margin: 0 auto; text-align: center; }
  .receipt h1 { font-size: 20px; margin: 0 0 6px; }
  .dash { border-top: 1px dashed #9aa1ab; margin: 16px 0; }
  .customer { font-size: 18px; margin: 4px 0 0; }
  .note { font-size: 13px; margin: 8px 0 0; }
  .big { font-size: 26px; font-weight: bold; margin: 6px 0 0; }
  .qr { margin-top: 4px; }
  .qr img { width: 150px; height: 150px; object-fit: contain; }`;

  const body = `
  <div class="receipt">
    <h1>${escapeHtml(bill.issuer)}</h1>
    <p class="muted">No. ${escapeHtml(bill.billNo)}</p>
    <p class="muted">${escapeHtml(bill.date)}</p>
    <div class="dash"></div>
    <p class="muted">BILLED TO</p>
    <p class="customer">${escapeHtml(bill.customer)}</p>
    ${noteHtml(bill)}
    <div class="dash"></div>
    <p class="muted">AMOUNT DUE</p>
    <p class="big">Rs. ${formatAmount(bill.amount)}</p>
    <div class="dash"></div>
    ${qrHtml(bill)}
    <p class="muted">Thank you</p>
  </div>`;

  return page(css, body);
}

function buildHtml(bill: BillData): string {
  if (bill.template === "compact") return compactHtml(bill);
  if (bill.template === "receipt") return receiptHtml(bill);
  return classicHtml(bill);
}

export async function exportAndShare(
  format: ExportFormat,
  bill: BillData,
  cardRef: RefObject<View | null>,
): Promise<void> {
  let uri: string;

  if (format === "pdf") {
    const file = await Print.printToFileAsync({ html: buildHtml(bill) });
    uri = file.uri;
  } else {
    if (!cardRef.current) throw new Error("Bill preview is not ready.");
    uri = await captureRef(cardRef, {
      format,
      quality: 1,
      result: "tmpfile",
    });
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device.");
  }

  await Sharing.shareAsync(uri, {
    mimeType: MIME[format],
    UTI: UTI[format],
    dialogTitle: "Share bill",
  });
}
