import { supabase } from "../lib/supabase";
import type { Profile } from "../lib/types";

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export type OnboardingData = Pick<
  Profile,
  | "objective"
  | "current_frequency"
  | "equipment_location"
  | "home_equipment"
  | "preferred_days"
  | "weight_kg"
  | "height_cm"
  | "experience_level"
  | "avoid_zones"
> &
  Partial<Pick<Profile, "first_name" | "last_name" | "birth_date">>;

export async function completeOnboarding(
  userId: string,
  data: OnboardingData
): Promise<Profile> {
  return updateProfile(userId, { ...data, onboarding_completed: true });
}

export async function updateProfile(
  userId: string,
  patch: Partial<Profile>
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateUsername(userId: string, username: string): Promise<Profile> {
  try {
    return await updateProfile(userId, { username });
  } catch (error) {
    if (error instanceof Object && "code" in error && error.code === "23505") {
      throw new Error("Ce nom d'utilisateur est déjà pris.");
    }
    throw error;
  }
}
