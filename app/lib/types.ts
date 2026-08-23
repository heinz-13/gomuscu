export type Objective = "perte_de_poids" | "entretien" | "performance";
export type Frequency = "0" | "1-2" | "3-4" | "5+";
export type EquipmentLocation = "salle_de_sport" | "domicile";
export type HomeEquipment = "halteres" | "elastiques" | "poids_du_corps" | "banc";
export type Day = "lun" | "mar" | "mer" | "jeu" | "ven" | "sam" | "dim";
export type ExperienceLevel = "debutant" | "intermediaire" | "avance";
export type SensitiveZone = "epaules" | "genoux" | "dos_bas" | "poignets";

export type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  birth_date: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  objective: Objective | null;
  current_frequency: Frequency | null;
  equipment_location: EquipmentLocation | null;
  home_equipment: HomeEquipment[] | null;
  preferred_days: Day[] | null;
  experience_level: ExperienceLevel | null;
  avoid_zones: SensitiveZone[] | null;
  is_premium: boolean;
  onboarding_completed: boolean;
  created_at: string;
};

export type ExerciseCategory =
  | "pectoraux"
  | "dos"
  | "jambes"
  | "epaules"
  | "bras"
  | "abdos"
  | "full_body";

export type Exercise = {
  id: string;
  name: string;
  category: ExerciseCategory;
  equipment: string | null;
  is_compound: boolean;
  difficulty: ExperienceLevel;
  stresses_joints: SensitiveZone[];
};

export type WorkoutStatus = "planifiee" | "terminee";

export type Workout = {
  id: string;
  user_id: string;
  date: string;
  started_at: string;
  ended_at: string | null;
  status: WorkoutStatus;
  global_rpe: number | null;
  photo_path: string | null;
  notification_id: string | null;
  theme: string | null;
};

export type WorkoutSet = {
  id: string;
  workout_id: string;
  exercise_id: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  rpe: number | null;
  block_label: string | null;
  completed: boolean;
};

export type WorkoutSetWithExercise = WorkoutSet & {
  exercise: Pick<Exercise, "id" | "name" | "category">;
};

export type WorkoutWithSets = Workout & {
  sets: WorkoutSetWithExercise[];
};

// Sens des notes (1-10) : fatigue/haut_du_corps/bas_du_corps -> 10 = au plus mal
// (très fatigué / très courbaturé) ; morale/motivation/sommeil -> 10 = au mieux.
export type DailyCheckin = {
  id: string;
  user_id: string;
  date: string;
  fatigue: number;
  morale: number;
  haut_du_corps: number;
  bas_du_corps: number;
  motivation: number;
  sommeil: number;
  created_at: string;
};

export type Group = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
};

export type GroupMember = {
  group_id: string;
  user_id: string;
  joined_at: string;
};

export type UserSearchResult = {
  id: string;
  username: string;
  first_name: string | null;
};

export type GroupWorkoutSummary = {
  user_id: string;
  first_name: string | null;
  username: string | null;
  date: string;
  theme: string | null;
  duration_min: number | null;
  global_rpe: number | null;
};

export type GroupTopPr = {
  user_id: string;
  first_name: string | null;
  exercise_name: string;
  poids_max: number;
  date_obtenu: string;
};

export type CardioType = "fractionne" | "bronco" | "course_libre" | "custom";
export type CardioStatus = "planifiee" | "terminee";

export type CardioSession = {
  id: string;
  user_id: string;
  date: string;
  type: CardioType;
  variant: string | null;
  status: CardioStatus;
  work_sec: number | null;
  rest_sec: number | null;
  rounds: number | null;
  target_distance_m: number | null;
  target_duration_min: number | null;
  actual_duration_sec: number | null;
  actual_distance_m: number | null;
  rpe: number | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
};
