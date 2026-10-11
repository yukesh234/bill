import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Field } from "@/components/field";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { formatAmount, formatBillNo, formatDate } from "@/lib/format";
import { deleteBill, loadBills, type SavedBill } from "@/lib/storage";

export default function HistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [bills, setBills] = useState<SavedBill[] | null>(null);
  const [query, setQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadBills().then((list) => {
        if (active) setBills(list);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  function openBill(bill: SavedBill, action: "edit" | "copy") {
    router.dismissTo({ pathname: "/", params: { action, id: bill.id } });
  }

  function confirmDelete(bill: SavedBill) {
    Alert.alert(
      `Delete bill ${formatBillNo(bill.seq)}?`,
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteBill(bill.id);
            setBills(await loadBills());
          },
        },
      ],
    );
  }

  if (!bills) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator color={theme.textSecondary} />
      </ThemedView>
    );
  }

  const q = query.trim().toLowerCase();
  const visible = q
    ? bills.filter(
        (bill) =>
          bill.customer.toLowerCase().includes(q) ||
          formatBillNo(bill.seq).includes(q),
      )
    : bills;

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        <View style={styles.searchWrap}>
          <View style={styles.inner}>
            <Field
              label="Search"
              value={query}
              onChangeText={setQuery}
              placeholder="Customer name or bill number"
              autoCapitalize="none"
            />
          </View>
        </View>

        <FlatList
          data={visible}
          keyExtractor={(bill) => bill.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.inner}>
              <ThemedText themeColor="textSecondary">
                {bills.length === 0
                  ? "No bills yet. A bill is saved when you share or save it."
                  : "No bills match your search."}
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open bill ${formatBillNo(item.seq)}`}
                onPress={() => openBill(item, "edit")}
                style={({ pressed }) => [
                  styles.cardMain,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.cardText}>
                  <ThemedText type="small" themeColor="textSecondary">
                    No. {formatBillNo(item.seq)}{" "}
                    {formatDate(new Date(item.createdAt))}
                  </ThemedText>
                  <ThemedText type="default">{item.customer}</ThemedText>
                </View>
                <ThemedText type="default" style={styles.amount}>
                  Rs. {formatAmount(item.amount)}
                </ThemedText>
              </Pressable>
              <View style={[styles.actions, { borderTopColor: theme.border }]}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openBill(item, "copy")}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <ThemedText type="link">Duplicate</ThemedText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => confirmDelete(item)}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <ThemedText type="link" themeColor="textSecondary">
                    Delete
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  searchWrap: {
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  inner: { width: "100%", maxWidth: MaxContentWidth },
  list: { alignItems: "center", padding: Spacing.four },
  separator: { height: Spacing.three },
  card: {
    width: "100%",
    maxWidth: MaxContentWidth,
    borderRadius: Spacing.three,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardMain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.three,
    padding: Spacing.three,
  },
  cardText: { flexShrink: 1, gap: Spacing.half },
  amount: { fontWeight: 700 },
  actions: {
    flexDirection: "row",
    gap: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
  },
  pressed: { opacity: 0.6 },
});
