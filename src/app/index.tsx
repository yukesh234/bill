import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BillCard } from "@/components/bill-card";
import { Button } from "@/components/button";
import { CustomerChips } from "@/components/customer-chips";
import { Field } from "@/components/field";
import { IssuerSetup } from "@/components/issuer-setup";
import { Segmented } from "@/components/segmented";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  exportAndShare,
  type BillData,
  type ExportFormat,
} from "@/lib/export-bill";
import {
  formatAmount,
  formatBillNo,
  formatDate,
  sanitizeAmount,
} from "@/lib/format";
import { pickQr } from "@/lib/pick-qr";
import {
  clearQr,
  loadBills,
  loadCustomers,
  loadProfile,
  peekNextSeq,
  saveIssuer,
  saveQr,
  upsertBill,
  upsertCustomer,
  type Customer,
  type Profile,
  type SavedBill,
} from "@/lib/storage";
import { DEFAULT_TEMPLATE, TEMPLATES, type TemplateId } from "@/lib/templates";
import { buildMessage, normalizePhone, openWhatsApp } from "@/lib/whatsapp";

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "png", label: "PNG" },
  { value: "jpg", label: "JPG" },
];

type Editing = { id: string; seq: number; createdAt: string };
type Busy = "share" | "whatsapp" | "save" | null;

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ action?: string; id?: string }>();
  const cardRef = useRef<View>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [amountText, setAmountText] = useState("");
  const [note, setNote] = useState("");
  const [template, setTemplate] = useState<TemplateId>(DEFAULT_TEMPLATE);
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [nextSeq, setNextSeq] = useState(1);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [busy, setBusy] = useState<Busy>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [loadedProfile, list, next] = await Promise.all([
          loadProfile(),
          loadCustomers(),
          peekNextSeq(),
        ]);
        if (!active) return;
        setProfile(loadedProfile);
        setCustomers(list);
        setNextSeq(next);
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  useEffect(() => {
    const { action, id } = params;
    if (!action || !id) return;

    let active = true;
    (async () => {
      if (action === "edit" || action === "copy") {
        const bills: SavedBill[] = await loadBills();
        const found = bills.find((bill) => bill.id === id);
        if (found && active) {
          setCustomer(found.customer);
          setPhone(found.phone);
          setAmountText(String(found.amount));
          setNote(found.note);
          setTemplate(found.template);
          setEditing(
            action === "edit"
              ? { id: found.id, seq: found.seq, createdAt: found.createdAt }
              : null,
          );
        }
      } else if (action === "customer") {
        const list = await loadCustomers();
        const found = list.find((item) => item.id === id);
        if (found && active) {
          setCustomer(found.name);
          setPhone(found.phone);
          setAmountText("");
          setNote("");
          setEditing(null);
        }
      }
      if (active) router.setParams({ action: "", id: "" });
    })();

    return () => {
      active = false;
    };
  }, [params, router]);

  const handleSetupDone = useCallback(
    async (issuer: string, qr: string | null) => {
      await saveIssuer(issuer);
      if (qr) await saveQr(qr);
      setProfile({ issuer, qr });
    },
    [],
  );

  const handleChangeQr = useCallback(async () => {
    const picked = await pickQr();
    if (!picked) return;
    await saveQr(picked);
    setProfile((current) => (current ? { ...current, qr: picked } : current));
  }, []);

  const handleRemoveQr = useCallback(async () => {
    await clearQr();
    setProfile((current) => (current ? { ...current, qr: null } : current));
  }, []);

  const amount = useMemo(() => {
    const parsed = parseFloat(amountText);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountText]);

  const waNumber = normalizePhone(phone);
  const displaySeq = editing ? editing.seq : nextSeq;
  const displayDate = formatDate(
    editing ? new Date(editing.createdAt) : new Date(),
  );

  const bill: BillData | null = profile?.issuer
    ? {
        issuer: profile.issuer,
        customer: customer.trim(),
        amount,
        note: note.trim(),
        billNo: formatBillNo(displaySeq),
        date: displayDate,
        qr: profile.qr,
        template,
      }
    : null;

  const canShare = customer.trim().length > 0 && amount > 0;

  async function persist(): Promise<SavedBill> {
    const saved = await upsertBill(
      {
        customer: customer.trim(),
        phone: phone.trim(),
        amount,
        note: note.trim(),
        template,
      },
      editing?.id ?? null,
    );
    await upsertCustomer(customer, phone);
    setEditing({ id: saved.id, seq: saved.seq, createdAt: saved.createdAt });
    const [list, next] = await Promise.all([loadCustomers(), peekNextSeq()]);
    setCustomers(list);
    setNextSeq(next);
    return saved;
  }

  function showError(title: string, error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";
    Alert.alert(title, message);
  }

  async function handleShare() {
    if (!bill) return;
    setBusy("share");
    try {
      const saved = await persist();
      await exportAndShare(
        format,
        { ...bill, billNo: formatBillNo(saved.seq) },
        cardRef,
      );
    } catch (error) {
      showError("Could not share bill", error);
    } finally {
      setBusy(null);
    }
  }

  async function handleWhatsApp() {
    if (!bill || !waNumber) return;
    setBusy("whatsapp");
    try {
      const saved = await persist();
      await openWhatsApp(
        waNumber,
        buildMessage({ ...bill, billNo: formatBillNo(saved.seq) }),
      );
    } catch (error) {
      showError("Could not open WhatsApp", error);
    } finally {
      setBusy(null);
    }
  }

  async function handleSave() {
    setBusy("save");
    try {
      const saved = await persist();
      Alert.alert(
        "Saved",
        `Bill ${formatBillNo(saved.seq)} for Rs. ${formatAmount(amount)} is in your history.`,
      );
    } catch (error) {
      showError("Could not save bill", error);
    } finally {
      setBusy(null);
    }
  }

  function handleNewBill() {
    setCustomer("");
    setPhone("");
    setAmountText("");
    setNote("");
    setEditing(null);
  }

  function handlePickCustomer(picked: Customer) {
    setCustomer(picked.name);
    setPhone(picked.phone);
  }

  if (!profile) {
    return (
      <ThemedView style={styles.loading}>
        <ActivityIndicator color={theme.textSecondary} />
      </ThemedView>
    );
  }

  if (!profile.issuer || !bill) {
    return <IssuerSetup onDone={handleSetupDone} />;
  }

  let whatsappHint =
    "WhatsApp opens with a ready message. Files cannot be attached automatically, so use Share file to send the PDF or image.";
  if (!phone.trim()) {
    whatsappHint = "Add a WhatsApp number to message the customer.";
  } else if (!waNumber) {
    whatsappHint =
      "That number looks invalid. Use a 10 digit Nepal number or include the country code.";
  }

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            <View style={styles.column}>
              <View style={styles.titleRow}>
                <View style={styles.titleText}>
                  <ThemedText type="subtitle">
                    {editing ? `Bill ${formatBillNo(displaySeq)}` : "New bill"}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Issued by {profile.issuer}
                  </ThemedText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleNewBill}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <ThemedText type="link">
                    {editing ? "New bill" : "Clear"}
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.navRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push("/history")}
                  style={({ pressed }) => [
                    styles.navPill,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.backgroundElement,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <ThemedText type="small">History</ThemedText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push("/customers")}
                  style={({ pressed }) => [
                    styles.navPill,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.backgroundElement,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <ThemedText type="small">Customers</ThemedText>
                </Pressable>
              </View>

              <View style={styles.form}>
                <View style={styles.customerBlock}>
                  <Field
                    label="Customer name"
                    value={customer}
                    onChangeText={setCustomer}
                    placeholder="Who is this bill for"
                    autoCapitalize="words"
                  />
                  <CustomerChips
                    customers={customers}
                    query={customer}
                    onPick={handlePickCustomer}
                  />
                </View>
                <Field
                  label="WhatsApp number (optional)"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="98XXXXXXXX"
                  keyboardType="phone-pad"
                />
                <Field
                  label="Amount (Rs.)"
                  value={amountText}
                  onChangeText={(text) => setAmountText(sanitizeAmount(text))}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
                <Field
                  label="Note (optional)"
                  value={note}
                  onChangeText={setNote}
                  placeholder="Items or description"
                  multiline
                  style={styles.noteInput}
                />
              </View>

              <View style={styles.block}>
                <ThemedText type="small" themeColor="textSecondary">
                  Template
                </ThemedText>
                <Segmented
                  options={TEMPLATES}
                  value={template}
                  onChange={setTemplate}
                />
              </View>

              <View style={styles.qrRow}>
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  style={styles.qrLabel}
                >
                  {profile.qr
                    ? "Payment QR attached"
                    : "No payment QR attached"}
                </ThemedText>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleChangeQr}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <ThemedText type="link">
                    {profile.qr ? "Replace" : "Add QR"}
                  </ThemedText>
                </Pressable>
                {profile.qr ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={handleRemoveQr}
                    style={({ pressed }) => pressed && styles.pressed}
                  >
                    <ThemedText type="link">Remove</ThemedText>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.block}>
                <ThemedText type="small" themeColor="textSecondary">
                  Preview
                </ThemedText>
                <BillCard ref={cardRef} bill={bill} />
              </View>

              <View style={styles.actions}>
                <View style={styles.block}>
                  <ThemedText type="small" themeColor="textSecondary">
                    File format
                  </ThemedText>
                  <Segmented
                    options={FORMATS}
                    value={format}
                    onChange={setFormat}
                  />
                </View>
                <Button
                  label="Share file"
                  onPress={handleShare}
                  disabled={!canShare || busy !== null}
                  loading={busy === "share"}
                />
                <Button
                  label="Message on WhatsApp"
                  variant="secondary"
                  onPress={handleWhatsApp}
                  disabled={!canShare || !waNumber || busy !== null}
                  loading={busy === "whatsapp"}
                />
                <ThemedText type="small" themeColor="textSecondary">
                  {whatsappHint}
                </ThemedText>
                <Button
                  label="Save without sharing"
                  variant="secondary"
                  onPress={handleSave}
                  disabled={!canShare || busy !== null}
                  loading={busy === "save"}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { flexGrow: 1, alignItems: "center", padding: Spacing.four },
  column: { width: "100%", maxWidth: MaxContentWidth, gap: Spacing.four },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.three,
  },
  titleText: { flexShrink: 1 },
  navRow: { flexDirection: "row", gap: Spacing.two },
  navPill: {
    minHeight: 40,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  form: { gap: Spacing.three },
  customerBlock: { gap: Spacing.one },
  noteInput: { minHeight: 80, textAlignVertical: "top" },
  block: { gap: Spacing.two },
  qrRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.three,
  },
  qrLabel: { flexGrow: 1 },
  actions: { gap: Spacing.three },
  pressed: { opacity: 0.6 },
});
