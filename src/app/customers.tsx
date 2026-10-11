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

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { deleteCustomer, loadCustomers, type Customer } from "@/lib/storage";

export default function CustomersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadCustomers().then((list) => {
        if (active) setCustomers(list);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  function startBill(customer: Customer) {
    router.dismissTo({
      pathname: "/",
      params: { action: "customer", id: customer.id },
    });
  }

  function confirmDelete(customer: Customer) {
    Alert.alert(`Remove ${customer.name}?`, "Past bills are not affected.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await deleteCustomer(customer.id);
          setCustomers(await loadCustomers());
        },
      },
    ]);
  }

  if (!customers) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator color={theme.textSecondary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        <FlatList
          data={customers}
          keyExtractor={(customer) => customer.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.inner}>
              <ThemedText themeColor="textSecondary">
                No customers yet. They are remembered automatically when you
                save a bill.
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
                accessibilityLabel={`New bill for ${item.name}`}
                onPress={() => startBill(item)}
                style={({ pressed }) => [
                  styles.cardMain,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.cardText}>
                  <ThemedText type="default">{item.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.phone || "No number saved"}
                  </ThemedText>
                </View>
                <ThemedText type="link">New bill</ThemedText>
              </Pressable>
              <View style={[styles.actions, { borderTopColor: theme.border }]}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => confirmDelete(item)}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <ThemedText type="link" themeColor="textSecondary">
                    Remove
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
  actions: {
    flexDirection: "row",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
  },
  pressed: { opacity: 0.6 },
});
