import * as ImagePicker from "expo-image-picker";

/** Opens the photo library and returns the chosen image as a data URI, or null if cancelled. */
export async function pickQr(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    base64: true,
    quality: 0.8,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset?.base64) return null;

  return `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`;
}
