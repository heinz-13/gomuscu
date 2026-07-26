import { supabase } from "../lib/supabase";
import { getWeekBounds } from "./workoutService";

export type LoggedExercise = { exerciseId: string; name: string };
export type ExerciseHistoryPoint = { date: string; maxWeight: number };
export type PersonalRecord = { weight: number; date: string };

export async function listLoggedExercises(userId: string): Promise<LoggedExercise[]> {
  const { data, error } = await supabase
    .from("workout_sets")
    .select("exercise_id, exercise:exercises(name), workout:workouts!inner(user_id, status)")
    .eq("workout.user_id", userId)
    .eq("workout.status", "terminee");

  if (error) throw error;

  const seen = new Map<string, string>();
  for (const row of data ?? []) {
    const exercise = row.exercise as unknown as { name: string } | null;
    if (exercise && !seen.has(row.exercise_id)) {
      seen.set(row.exercise_id, exercise.name);
    }
  }

  return Array.from(seen.entries())
    .map(([exerciseId, name]) => ({ exerciseId, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getExerciseHistory(
  userId: string,
  exerciseId: string
): Promise<ExerciseHistoryPoint[]> {
  const { data, error } = await supabase
    .from("workout_sets")
    .select("weight_kg, workout:workouts!inner(user_id, status, date)")
    .eq("exercise_id", exerciseId)
    .eq("workout.user_id", userId)
    .eq("workout.status", "terminee");

  if (error) throw error;

  const maxByDate = new Map<string, number>();
  for (const row of data ?? []) {
    const workout = row.workout as unknown as { date: string };
    const current = maxByDate.get(workout.date) ?? 0;
    if (row.weight_kg > current) maxByDate.set(workout.date, row.weight_kg);
  }

  return Array.from(maxByDate.entries())
    .map(([date, maxWeight]) => ({ date, maxWeight }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type LastPerformanceSet = { set_number: number; reps: number; weight_kg: number };

export async function getLastPerformance(
  userId: string,
  exerciseId: string
): Promise<LastPerformanceSet[]> {
  const { data, error } = await supabase
    .from("workout_sets")
    .select(
      "set_number, reps, weight_kg, workout_id, workout:workouts!inner(user_id, status, date, created_at)"
    )
    .eq("exercise_id", exerciseId)
    .eq("workout.user_id", userId)
    .eq("workout.status", "terminee");

  if (error) throw error;
  if (!data || data.length === 0) return [];

  type Row = (typeof data)[number];
  const latest = data.reduce<Row | null>((best, row) => {
    if (!best) return row;
    const bestWorkout = best.workout as unknown as { date: string; created_at: string };
    const rowWorkout = row.workout as unknown as { date: string; created_at: string };
    if (
      rowWorkout.date > bestWorkout.date ||
      (rowWorkout.date === bestWorkout.date && rowWorkout.created_at > bestWorkout.created_at)
    ) {
      return row;
    }
    return best;
  }, null);

  if (!latest) return [];

  return data
    .filter((row) => row.workout_id === latest.workout_id)
    .map((row) => ({ set_number: row.set_number, reps: row.reps, weight_kg: row.weight_kg }))
    .sort((a, b) => a.set_number - b.set_number);
}

export type TopPerformance = { exerciseName: string; weight: number; date: string };

export async function getTopPerformanceThisWeek(userId: string): Promise<TopPerformance | null> {
  const { monday, sunday } = getWeekBounds();

  const { data, error } = await supabase
    .from("personal_records")
    .select("exercise_id, poids_max, date_obtenu")
    .eq("user_id", userId)
    .gte("date_obtenu", monday)
    .lte("date_obtenu", sunday)
    .order("date_obtenu", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { data: exercise, error: exerciseError } = await supabase
    .from("exercises")
    .select("name")
    .eq("id", data.exercise_id)
    .single();

  if (exerciseError) throw exerciseError;

  return { exerciseName: exercise.name, weight: data.poids_max, date: data.date_obtenu };
}

export async function listPersonalRecords(userId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("personal_records")
    .select("exercise_id, poids_max")
    .eq("user_id", userId);

  if (error) throw error;

  const map: Record<string, number> = {};
  for (const row of data ?? []) map[row.exercise_id] = row.poids_max;
  return map;
}

export async function getPersonalRecord(
  userId: string,
  exerciseId: string
): Promise<PersonalRecord | null> {
  const { data, error } = await supabase
    .from("personal_records")
    .select("poids_max, date_obtenu")
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return { weight: data.poids_max, date: data.date_obtenu };
}
