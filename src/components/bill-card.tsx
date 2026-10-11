import { Image } from "expo-image";
import type { Ref } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Fonts, Spacing } from "@/constants/theme";
import type { BillData } from "@/lib/export-bill";
import { formatAmount } from "@/lib/format";

type BillCardProps = { bill: BillData; ref?: Ref<View> };
type LayoutProps = { bill: BillData };

const INK = "#1C1E21";
const MUTED = "#5F6670";
const LINE = "#D9DCE1";
const PANEL = "#F3F4F6";

export function BillCard({ bill, ref }: BillCardProps) {
  return (
    <View ref={ref} collapsable={false} style={styles.shell}>
      {bill.template === "compact" ? (
        <CompactLayout bill={bill} />
      ) : bill.template === "receipt" ? (
        <ReceiptLayout bill={bill} />
      ) : (
        <ClassicLayout bill={bill} />
      )}
    </View>
  );
}

function ClassicLayout({ bill }: LayoutProps) {
  return (
    <View style={classic.body}>
      <View style={classic.header}>
        <View style={classic.headerLeft}>
          <Text style={classic.issuer}>{bill.issuer}</Text>
          <Text style={styles.muted}>Bill</Text>
        </View>
        <View style={classic.headerRight}>
          <Text style={styles.muted}>No. {bill.billNo}</Text>
          <Text style={styles.muted}>{bill.date}</Text>
        </View>
      </View>

      <Text style={classic.label}>BILLED TO</Text>
      <Text style={classic.customer}>{bill.customer || "Customer name"}</Text>
      {bill.note ? <Text style={styles.note}>{bill.note}</Text> : null}

      <View style={classic.total}>
        <Text style={styles.muted}>Amount due</Text>
        <Text style={classic.amount}>Rs. {formatAmount(bill.amount)}</Text>
      </View>

      {bill.qr ? (
        <View style={classic.qrWrap}>
          <Image
            source={{ uri: bill.qr }}
            style={classic.qr}
            contentFit="contain"
          />
          <Text style={styles.muted}>Scan to pay</Text>
        </View>
      ) : null}
    </View>
  );
}

function CompactLayout({ bill }: LayoutProps) {
  return (
    <View style={compact.body}>
      <View style={compact.top}>
        <Text style={compact.issuer} numberOfLines={1}>
          {bill.issuer}
        </Text>
        <Text style={styles.muted}>
          No. {bill.billNo} {bill.date}
        </Text>
      </View>

      <View style={compact.mid}>
        <View style={compact.left}>
          <Text style={styles.muted}>Billed to</Text>
          <Text style={compact.customer}>
            {bill.customer || "Customer name"}
          </Text>
          {bill.note ? <Text style={styles.note}>{bill.note}</Text> : null}
        </View>
        <View style={compact.right}>
          <Text style={styles.muted}>Amount due</Text>
          <Text style={compact.amount}>Rs. {formatAmount(bill.amount)}</Text>
        </View>
      </View>

      {bill.qr ? (
        <View style={compact.qrWrap}>
          <Image
            source={{ uri: bill.qr }}
            style={compact.qr}
            contentFit="contain"
          />
        </View>
      ) : null}
    </View>
  );
}

function ReceiptLayout({ bill }: LayoutProps) {
  return (
    <View style={receipt.body}>
      <Text style={receipt.issuer}>{bill.issuer}</Text>
      <Text style={receipt.mono}>No. {bill.billNo}</Text>
      <Text style={receipt.mono}>{bill.date}</Text>

      <View style={receipt.dash} />

      <Text style={receipt.mono}>BILLED TO</Text>
      <Text style={receipt.customer}>{bill.customer || "Customer name"}</Text>
      {bill.note ? <Text style={receipt.note}>{bill.note}</Text> : null}

      <View style={receipt.dash} />

      <Text style={receipt.mono}>AMOUNT DUE</Text>
      <Text style={receipt.amount}>Rs. {formatAmount(bill.amount)}</Text>

      <View style={receipt.dash} />

      {bill.qr ? (
        <Image
          source={{ uri: bill.qr }}
          style={receipt.qr}
          contentFit="contain"
        />
      ) : null}
      <Text style={receipt.mono}>Thank you</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: "#FFFFFF",
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: LINE,
  },
  muted: { fontSize: 13, color: MUTED },
  note: { fontSize: 14, color: INK },
});

const classic = StyleSheet.create({
  body: { padding: Spacing.four, gap: Spacing.two },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.three,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  headerLeft: { flexShrink: 1, gap: Spacing.half },
  headerRight: { alignItems: "flex-end", gap: Spacing.half },
  issuer: { fontSize: 20, fontWeight: "600", color: INK },
  label: {
    marginTop: Spacing.three,
    fontSize: 12,
    letterSpacing: 0.8,
    color: MUTED,
  },
  customer: { fontSize: 20, fontWeight: "500", color: INK },
  total: {
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: PANEL,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.two,
  },
  amount: { fontSize: 24, fontWeight: "700", color: INK },
  qrWrap: { marginTop: Spacing.three, alignItems: "center", gap: Spacing.one },
  qr: { width: 180, height: 180 },
});

const compact = StyleSheet.create({
  body: { padding: Spacing.three, gap: Spacing.three },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: Spacing.two,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  issuer: { flexShrink: 1, fontSize: 17, fontWeight: "600", color: INK },
  mid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: Spacing.three,
  },
  left: { flexShrink: 1, gap: Spacing.half },
  right: { alignItems: "flex-end", gap: Spacing.half },
  customer: { fontSize: 17, fontWeight: "500", color: INK },
  amount: { fontSize: 22, fontWeight: "700", color: INK },
  qrWrap: { alignItems: "flex-end" },
  qr: { width: 110, height: 110 },
});

const receipt = StyleSheet.create({
  body: { padding: Spacing.four, alignItems: "center", gap: Spacing.one },
  issuer: {
    fontFamily: Fonts.mono,
    fontSize: 18,
    fontWeight: "700",
    color: INK,
    textAlign: "center",
  },
  mono: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
  },
  dash: {
    alignSelf: "stretch",
    marginVertical: Spacing.two,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "#9AA1AB",
  },
  customer: {
    fontFamily: Fonts.mono,
    fontSize: 16,
    color: INK,
    textAlign: "center",
  },
  note: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: INK,
    textAlign: "center",
  },
  amount: {
    fontFamily: Fonts.mono,
    fontSize: 24,
    fontWeight: "700",
    color: INK,
  },
  qr: { width: 150, height: 150 },
});
