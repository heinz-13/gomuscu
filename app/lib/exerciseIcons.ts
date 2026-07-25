import type { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ExerciseCategory } from "./types";

type MCIName = keyof typeof MaterialCommunityIcons.glyphMap;

export const CATEGORY_ICONS: Record<ExerciseCategory, MCIName> = {
  pectoraux: "arm-flex",
  dos: "human-handsup",
  jambes: "run",
  epaules: "weight-lifter",
  bras: "dumbbell",
  abdos: "yoga",
  full_body: "run-fast",
};
