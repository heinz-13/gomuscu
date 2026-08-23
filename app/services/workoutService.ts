import { supabase } from "../lib/supabase";
import type { Workout, WorkoutSet, WorkoutWithSets } from "../lib/types";

export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getTodayWorkout(userId: string): Promise<Workout | null> {
  const today = toLocalDateString(new Date());

  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .eq("status", "planifiee")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function getWeekBounds(): { monday: string; sunday: string } {
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // 0 = lundi
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    monday: toLocalDateString(monday),
    sunday: toLocalDateString(sunday),
  };
}

export async function countCompletedThisWeek(userId: string): Promise<number> {
  const { monday, sunday } = getWeekBounds();

  const { count, error } = await supabase
    .from("workouts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "terminee")
    .gte("date", monday)
    .lte("date", sunday);

  if (error) throw error;
  return count ?? 0;
}

export async function listWeekWorkouts(userId: string): Promise<Workout[]> {
  const { monday, sunday } = getWeekBounds();

  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .gte("date", monday)
    .lte("date", sunday);

  if (error) throw error;
  return data ?? [];
}

export async function createWorkout(
  userId: string,
  date?: string,
  theme?: string
): Promise<Workout> {
  const { data, error } = await supabase
    .from("workouts")
    .insert({ user_id: userId, date: date ?? toLocalDateString(new Date()), theme: theme ?? null })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  const { error } = await supabase.from("workouts").delete().eq("id", workoutId);
  if (error) throw error;
}

export async function setWorkoutNotification(
  workoutId: string,
  notificationId: string | null
): Promise<Workout> {
  const { data, error } = await supabase
    .from("workouts")
    .update({ notification_id: notificationId })
    .eq("id", workoutId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function listWorkouts(userId: string): Promise<Workout[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "terminee")
    .order("date", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getWorkoutDetail(workoutId: string): Promise<WorkoutWithSets> {
  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .select("*")
    .eq("id", workoutId)
    .single();

  if (workoutError) throw workoutError;

  const { data: sets, error: setsError } = await supabase
    .from("workout_sets")
    .select("*, exercise:exercises(id, name, category)")
    .eq("workout_id", workoutId)
    .order("created_at")
    .order("set_number");

  if (setsError) throw setsError;

  return { ...workout, sets: sets ?? [] };
}

export async function addSet(
  workoutId: string,
  exerciseId: string,
  setNumber: number,
  reps: number,
  weightKg: number,
  rpe: number | null,
  blockLabel: string | null = null
): Promise<WorkoutSet> {
  const { data, error } = await supabase
    .from("workout_sets")
    .insert({
      workout_id: workoutId,
      exercise_id: exerciseId,
      set_number: setNumber,
      reps,
      weight_kg: weightKg,
      rpe,
      block_label: blockLabel,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateSet(
  setId: string,
  patch: Partial<Pick<WorkoutSet, "reps" | "weight_kg" | "rpe" | "completed">>
): Promise<WorkoutSet> {
  const { data, error } = await supabase
    .from("workout_sets")
    .update(patch)
    .eq("id", setId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSet(setId: string): Promise<void> {
  const { error } = await supabase.from("workout_sets").delete().eq("id", setId);
  if (error) throw error;
}

export async function finishWorkout(
  workoutId: string,
  globalRpe: number | null
): Promise<Workout> {
  const { data, error } = await supabase
    .from("workouts")
    .update({
      status: "terminee",
      ended_at: new Date().toISOString(),
      global_rpe: globalRpe,
    })
    .eq("id", workoutId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function setWorkoutPhoto(workoutId: string, photoPath: string): Promise<Workout> {
  const { data, error } = await supabase
    .from("workouts")
    .update({ photo_path: photoPath })
    .eq("id", workoutId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
