import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { supabase } from "../lib/supabase";

const BUCKET = "workout-photos";

export async function takePhotoAndUpload(
  userId: string,
  workoutId: string
): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Permission caméra refusée");
  }

  const result = await ImagePicker.launchCameraAsync({
    base64: true,
    quality: 0.5,
    allowsEditing: true,
    aspect: [1, 1],
  });

  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset.base64) return null;

  const path = `${userId}/${workoutId}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, decode(asset.base64), {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) throw error;
  return path;
}

export async function getSignedPhotoUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);

  if (error) throw error;
  return data.signedUrl;
}
