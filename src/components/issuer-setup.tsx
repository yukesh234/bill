import { Image } from "expo-image";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { Field } from "@/components/field";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { pickQr } from "@/lib/pick-qr";

type Props = {
  onDone: (issuer: string, qr: string | null) => Promise<void>;
};

export function IssuerSetup({ onDone }: Props) {
  const [name, setName] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canContinue = name.trim().length > 0;

  async function handlePickQr() {
    const picked = await pickQr();
    if (picked) setQr(picked);
  }

  async function handleContinue() {
    setSaving(true);
    try {
      await onDone(name.trim(), qr);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <View style={styles.column}>
            <View style={styles.intro}>
              <ThemedText type="subtitle">Set up your bills</ThemedText>
              <ThemedText themeColor="textSecondary">
                Your name appears at the top of every bill. You can add a
                payment QR code now or later.
              </ThemedText>
            </View>

            <Field
              label="Your name or business name"
              value={name}
              onChangeText={setName}
              placeholder="Enter name"
              autoCapitalize="words"
              returnKeyType="done"
            />

            <View style={styles.qrBlock}>
              <ThemedText type="small" themeColor="textSecondary">
                Payment QR code (optional)
              </ThemedText>
              {qr ? (
                <Image
                  source={{ uri: qr }}
                  style={styles.qr}
                  contentFit="contain"
                />
              ) : null}
              <Button
                label={qr ? "Choose a different QR" : "Choose QR from photos"}
                variant="secondary"
                onPress={handlePickQr}
              />
            </View>

            <Button
              label="Continue"
              onPress={handleContinue}
              disabled={!canContinue}
              loading={saving}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: { flexGrow: 1, alignItems: "center", padding: Spacing.four },
  column: { width: "100%", maxWidth: MaxContentWidth, gap: Spacing.four },
  intro: { gap: Spacing.two, paddingTop: Spacing.four },
  qrBlock: { gap: Spacing.two },
  qr: { width: 160, height: 160, alignSelf: "center" },
});
