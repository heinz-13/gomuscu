export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Historique: undefined;
  Progression: undefined;
  Groupes: undefined;
  Profil: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  WorkoutSession: { workoutId: string };
  WorkoutDetail: { workoutId: string };
  ExercisePicker: undefined;
  WorkoutPreview: { targetDate?: string } | undefined;
  GroupDetail: { groupId: string };
  CardioPreview: { targetDate?: string } | undefined;
  CardioSession: { cardioSessionId: string };
};
