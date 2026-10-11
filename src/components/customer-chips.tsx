import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Customer } from '@/lib/storage';

type CustomerChipsProps = {
  customers: Customer[];
  query: string;
  onPick: (customer: Customer) => void;
};

export function CustomerChips({ customers, query, onPick }: CustomerChipsProps) {
  const theme = useTheme();
  const q = query.trim().toLowerCase();

  const matches = customers
    .filter((customer) => {
      const name = customer.name.toLowerCase();
      return name !== q && (q === '' || name.includes(q));
    })
    .slice(0, 12);

  if (matches.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.row}>
      {matches.map((customer) => (
        <Pressable
          key={customer.id}
          accessibilityRole="button"
          accessibilityLabel={`Use customer ${customer.name}`}
          onPress={() => onPick(customer)}
          style={({ pressed }) => [
            styles.chip,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="small">{customer.name}</ThemedText>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.two, paddingVertical: Spacing.one },
  chip: {
    minHeight: 36,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
});