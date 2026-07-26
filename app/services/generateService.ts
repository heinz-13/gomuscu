import { addSet, createWorkout } from "./workoutService";
import { computeGlobalForme } from "./checkinService";
import type {
  DailyCheckin,
  Exercise,
  ExerciseCategory,
  ExperienceLevel,
  Profile,
  Workout,
} from "../lib/types";

export type SessionSlot = {
  exercise: Exercise;
  setsCount: number;
  targetReps: number;
  targetWeight: number;
  blockLabel: string;
};

export type SessionPlan = {
  blocks: SessionSlot[];
  finisher: SessionSlot | null;
};

export type Theme = "haut" | "bas" | "dos" | "abdo_bras";

export const THEME_LABELS: Record<Theme, string> = {
  haut: "Haut du corps",
  bas: "Bas du corps",
  dos: "Dos",
  abdo_bras: "Abdos & Bras",
};

const REP_SCHEME: Record<string, { setsCount: number; targetReps: number }> = {
  perte_de_poids: { setsCount: 3, targetReps: 15 },
  entretien: { setsCount: 3, targetReps: 12 },
  performance: { setsCount: 4, targetReps: 6 },
};

// Zone du corps sollicitée par thème, pour croiser avec les courbatures du check-in du jour.
const THEME_ZONE: Record<Theme, "haut_du_corps" | "bas_du_corps"> = {
  haut: "haut_du_corps",
  dos: "haut_du_corps",
  abdo_bras: "haut_du_corps",
  bas: "bas_du_corps",
};

// Poids recommandé à partir du record personnel, via la formule de Brzycki (approximation
// %1RM selon les répétitions visées), arrondi au 2.5 kg le plus proche.
function recommendWeight(personalRecord: number | undefined, targetReps: number): number {
  if (!personalRecord) return 0;
  const raw = (personalRecord * (37 - targetReps)) / 36;
  return Math.max(0, Math.round(raw / 2.5) * 2.5);
}

type ThemeSlot = { category: ExerciseCategory; preferCompound: boolean };

// Un thème = toujours 6 créneaux (3 blocs de 2). Les premiers créneaux
// privilégient les mouvements poly-articulaires (charges lourdes, frais),
// les derniers l'isolation — logique de programmation "pro" classique.
const THEME_TEMPLATES: Record<Theme, ThemeSlot[]> = {
  haut: [
    { category: "pectoraux", preferCompound: true },
    { category: "dos", preferCompound: true },
    { category: "epaules", preferCompound: true },
    { category: "dos", preferCompound: false },
    { category: "pectoraux", preferCompound: false },
    { category: "bras", preferCompound: false },
  ],
  bas: [
    { category: "jambes", preferCompound: true },
    { category: "jambes", preferCompound: true },
    { category: "jambes", preferCompound: false },
    { category: "jambes", preferCompound: false },
    { category: "abdos", preferCompound: false },
    { category: "jambes", preferCompound: false },
  ],
  dos: [
    { category: "dos", preferCompound: true },
    { category: "dos", preferCompound: true },
    { category: "dos", preferCompound: true },
    { category: "dos", preferCompound: false },
    { category: "bras", preferCompound: false },
    { category: "bras", preferCompound: false },
  ],
  abdo_bras: [
    { category: "bras", preferCompound: false },
    { category: "bras", preferCompound: false },
    { category: "bras", preferCompound: false },
    { category: "bras", preferCompound: false },
    { category: "abdos", preferCompound: false },
    { category: "abdos", preferCompound: false },
  ],
};

const LEVEL_ORDER: Record<ExperienceLevel, number> = {
  debutant: 0,
  intermediaire: 1,
  avance: 2,
};

function isEquipmentEligible(exercise: Exercise, profile: Profile): boolean {
  if (profile.equipment_location !== "domicile") return true;
  if (exercise.equipment === "poids du corps") return true;
  if (exercise.equipment === "halteres") {
    return (profile.home_equipment ?? []).includes("halteres");
  }
  return false;
}

function isLevelEligible(exercise: Exercise, profile: Profile): boolean {
  if (!profile.experience_level) return true;
  return LEVEL_ORDER[exercise.difficulty] <= LEVEL_ORDER[profile.experience_level];
}

function isSafeForZones(exercise: Exercise, profile: Profile): boolean {
  const avoidZones = profile.avoid_zones ?? [];
  if (avoidZones.length === 0) return true;
  return !exercise.stresses_joints.some((zone) => avoidZones.includes(zone));
}

function isEligible(exercise: Exercise, profile: Profile): boolean {
  return (
    isEquipmentEligible(exercise, profile) &&
    isLevelEligible(exercise, profile) &&
    isSafeForZones(exercise, profile)
  );
}

function pickExercise(
  category: ExerciseCategory,
  eligible: Exercise[],
  used: Set<string>,
  preferCompound: boolean
): Exercise | null {
  const candidates = eligible.filter((e) => e.category === category && !used.has(e.id));
  if (candidates.length === 0) return null;

  const preferred = candidates.filter((e) => e.is_compound === preferCompound);
  const pool = preferred.length > 0 ? preferred : candidates;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  used.add(pick.id);
  return pick;
}

export function buildSessionPlan(
  profile: Profile,
  exercises: Exercise[],
  theme: Theme,
  personalRecords: Record<string, number> = {},
  checkin: DailyCheckin | null = null
): SessionPlan {
  const template = THEME_TEMPLATES[theme];
  const scheme = REP_SCHEME[profile.objective ?? "entretien"] ?? REP_SCHEME.entretien;
  const eligible = exercises.filter((e) => isEligible(e, profile));
  const used = new Set<string>();

  let setsCount = scheme.setsCount;
  if (checkin) {
    if (computeGlobalForme(checkin) <= 4) setsCount -= 1;
    if (checkin[THEME_ZONE[theme]] >= 7) setsCount -= 1;
    setsCount = Math.max(2, setsCount);
  }

  const blocks: SessionSlot[] = [];
  template.forEach((slot, index) => {
    const exercise = pickExercise(slot.category, eligible, used, slot.preferCompound);
    if (!exercise) return;
    const blockIndex = Math.floor(index / 2);
    const position = index % 2 === 0 ? "A" : "B";
    blocks.push({
      exercise,
      setsCount,
      targetReps: scheme.targetReps,
      targetWeight: recommendWeight(personalRecords[exercise.id], scheme.targetReps),
      blockLabel: `${blockIndex + 1}.${position}`,
    });
  });

  const finisherExercise =
    pickExercise("full_body", eligible, used, true) ??
    pickExercise("abdos", eligible, used, false);
  const finisher: SessionSlot | null = finisherExercise
    ? {
        exercise: finisherExercise,
        setsCount: 3,
        targetReps: 20,
        targetWeight: recommendWeight(personalRecords[finisherExercise.id], 20),
        blockLabel: "Bonus",
      }
    : null;

  return { blocks, finisher };
}

export async function commitPlan(
  userId: string,
  plan: SessionPlan,
  includeFinisher: boolean,
  date?: string
): Promise<Workout> {
  const workout = await createWorkout(userId, date);
  const slots = includeFinisher && plan.finisher ? [...plan.blocks, plan.finisher] : plan.blocks;

  for (const slot of slots) {
    for (let i = 1; i <= slot.setsCount; i++) {
      await addSet(
        workout.id,
        slot.exercise.id,
        i,
        slot.targetReps,
        slot.targetWeight,
        null,
        slot.blockLabel
      );
    }
  }

  return workout;
}
