import { supabase } from "../lib/supabase";
import { toLocalDateString } from "./workoutService";
import type { DailyCheckin } from "../lib/types";

export type CheckinInput = {
  fatigue: number;
  morale: number;
  haut_du_corps: number;
  bas_du_corps: number;
  motivation: number;
  sommeil: number;
};

export async function getTodayCheckin(userId: string): Promise<DailyCheckin | null> {
  const today = toLocalDateString(new Date());

  const { data, error } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertTodayCheckin(
  userId: string,
  input: CheckinInput
): Promise<DailyCheckin> {
  const today = toLocalDateString(new Date());

  const { data, error } = await supabase
    .from("daily_checkins")
    .upsert({ user_id: userId, date: today, ...input }, { onConflict: "user_id,date" })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

// Ramène les 6 notes sur une même échelle (10 = au mieux) puis moyenne : fatigue,
// haut_du_corps et bas_du_corps sont inversées puisque 10 y signifie "au plus mal".
export function computeGlobalForme(checkin: DailyCheckin): number {
  const aligned = [
    11 - checkin.fatigue,
    checkin.morale,
    11 - checkin.haut_du_corps,
    11 - checkin.bas_du_corps,
    checkin.motivation,
    checkin.sommeil,
  ];
  const sum = aligned.reduce((total, value) => total + value, 0);
  return Math.round((sum / aligned.length) * 10) / 10;
}

export function formeLabel(globalForme: number): string {
  if (globalForme >= 8) return "En pleine forme";
  if (globalForme >= 6) return "Forme correcte";
  if (globalForme >= 4) return "Un peu fatigué(e)";
  return "Repos recommandé";
}
