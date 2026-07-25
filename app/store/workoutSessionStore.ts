import { create } from "zustand";
import type { Exercise, WorkoutSet } from "../lib/types";

export type SessionExercise = {
  exercise: Pick<Exercise, "id" | "name" | "category">;
  sets: WorkoutSet[];
};

type WorkoutSessionState = {
  workoutId: string | null;
  exercises: SessionExercise[];
  startSession: (workoutId: string, existing: SessionExercise[]) => void;
  addExercise: (exercise: Exercise) => void;
  addSet: (exerciseId: string, set: WorkoutSet) => void;
  updateSet: (setId: string, patch: Partial<WorkoutSet>) => void;
  removeSet: (setId: string) => void;
  reset: () => void;
};

export const useWorkoutSessionStore = create<WorkoutSessionState>((set) => ({
  workoutId: null,
  exercises: [],
  startSession: (workoutId, existing) => set({ workoutId, exercises: existing }),
  addExercise: (exercise) =>
    set((state) => {
      if (state.exercises.some((e) => e.exercise.id === exercise.id)) return state;
      return { exercises: [...state.exercises, { exercise, sets: [] }] };
    }),
  addSet: (exerciseId, workoutSet) =>
    set((state) => ({
      exercises: state.exercises.map((e) =>
        e.exercise.id === exerciseId ? { ...e, sets: [...e.sets, workoutSet] } : e
      ),
    })),
  updateSet: (setId, patch) =>
    set((state) => ({
      exercises: state.exercises.map((e) => ({
        ...e,
        sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
      })),
    })),
  removeSet: (setId) =>
    set((state) => ({
      exercises: state.exercises.map((e) => ({
        ...e,
        sets: e.sets.filter((s) => s.id !== setId),
      })),
    })),
  reset: () => set({ workoutId: null, exercises: [] }),
}));
