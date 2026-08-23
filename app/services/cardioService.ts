import { supabase } from "../lib/supabase";
import { computeGlobalForme } from "./checkinService";
import { toLocalDateString } from "./workoutService";
import type { CardioSession, CardioType, DailyCheckin, ExperienceLevel, Profile } from "../lib/types";

export type CardioVariant = "30-30" | "tabata";

export type CardioPlan = {
  type: CardioType;
  variant: string | null;
  work_sec: number | null;
  rest_sec: number | null;
  rounds: number | null;
  target_distance_m: number | null;
  target_duration_min: number | null;
};

export type CustomCardioParams = {
  work_sec?: number;
  rest_sec?: number;
  rounds?: number;
  target_distance_m?: number;
  target_duration_min?: number;
};

const FRACTIONNE_ROUNDS: Record<ExperienceLevel, number> = {
  debutant: 8,
  intermediaire: 12,
  avance: 16,
};

const BRONCO_ROUNDS: Record<ExperienceLevel, number> = {
  debutant: 3,
  intermediaire: 5,
  avance: 7,
};

const COURSE_LIBRE_DURATION: Record<string, number> = {
  perte_de_poids: 35,
  entretien: 25,
  performance: 20,
};

function levelOf(profile: Profile): ExperienceLevel {
  return profile.experience_level ?? "debutant";
}

function isFormeLow(checkin: DailyCheckin | null): boolean {
  return checkin ? computeGlobalForme(checkin) <= 4 : false;
}

export function buildCardioSession(
  profile: Profile,
  type: CardioType,
  variant: CardioVariant | null,
  checkin: DailyCheckin | null,
  customParams?: CustomCardioParams
): CardioPlan {
  const formeLow = isFormeLow(checkin);

  if (type === "custom") {
    return {
      type,
      variant: null,
      work_sec: customParams?.work_sec ?? null,
      rest_sec: customParams?.rest_sec ?? null,
      rounds: customParams?.rounds ?? null,
      target_distance_m: customParams?.target_distance_m ?? null,
      target_duration_min: customParams?.target_duration_min ?? null,
    };
  }

  if (type === "fractionne") {
    const v = variant ?? "30-30";
    const workRest = v === "tabata" ? { work: 20, rest: 10 } : { work: 30, rest: 30 };
    const baseRounds = v === "tabata" ? 8 : FRACTIONNE_ROUNDS[levelOf(profile)];
    const rounds = Math.max(4, formeLow ? baseRounds - 2 : baseRounds);
    return {
      type,
      variant: v,
      work_sec: workRest.work,
      rest_sec: workRest.rest,
      rounds,
      target_distance_m: null,
      target_duration_min: null,
    };
  }

  if (type === "bronco") {
    const baseRounds = BRONCO_ROUNDS[levelOf(profile)];
    const rounds = Math.max(2, formeLow ? baseRounds - 1 : baseRounds);
    return {
      type,
      variant: null,
      work_sec: null,
      rest_sec: null,
      rounds,
      target_distance_m: null,
      target_duration_min: null,
    };
  }

  // course_libre
  const baseDuration = COURSE_LIBRE_DURATION[profile.objective ?? "entretien"] ?? 25;
  const duration = Math.max(10, formeLow ? baseDuration - 5 : baseDuration);
  return {
    type,
    variant: null,
    work_sec: null,
    rest_sec: null,
    rounds: null,
    target_distance_m: null,
    target_duration_min: duration,
  };
}

export async function commitCardioSession(
  userId: string,
  plan: CardioPlan,
  date?: string
): Promise<CardioSession> {
  const { data, error } = await supabase
    .from("cardio_sessions")
    .insert({
      user_id: userId,
      date: date ?? toLocalDateString(new Date()),
      type: plan.type,
      variant: plan.variant,
      work_sec: plan.work_sec,
      rest_sec: plan.rest_sec,
      rounds: plan.rounds,
      target_distance_m: plan.target_distance_m,
      target_duration_min: plan.target_duration_min,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function finishCardioSession(
  id: string,
  actuals: { actual_duration_sec?: number; actual_distance_m?: number },
  rpe: number | null
): Promise<CardioSession> {
  const { data, error } = await supabase
    .from("cardio_sessions")
    .update({
      status: "terminee",
      ended_at: new Date().toISOString(),
      actual_duration_sec: actuals.actual_duration_sec ?? null,
      actual_distance_m: actuals.actual_distance_m ?? null,
      rpe,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getCardioSession(id: string): Promise<CardioSession> {
  const { data, error } = await supabase.from("cardio_sessions").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function listCardioSessions(userId: string): Promise<CardioSession[]> {
  const { data, error } = await supabase
    .from("cardio_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "terminee")
    .order("date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
