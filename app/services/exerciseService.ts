import { supabase } from "../lib/supabase";
import type { Exercise } from "../lib/types";

let cache: Exercise[] | null = null;

export async function listExercises(): Promise<Exercise[]> {
  if (cache) return cache;

  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("category")
    .order("name");

  if (error) throw error;
  cache = data;
  return data;
}
