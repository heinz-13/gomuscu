import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { MainStackParamList, MainTabParamList } from "../navigation/types";
import WorkoutListItem from "../components/WorkoutListItem";
import GoalProgressBar from "../components/GoalProgressBar";
import WeekDayCircles from "../components/WeekDayCircles";
import TopPerformanceCard from "../components/TopPerformanceCard";
import RecentSessionsCarousel from "../components/RecentSessionsCarousel";
import RecentCardioCarousel from "../components/RecentCardioCarousel";
import GlobalFormeCard from "../components/GlobalFormeCard";
import type { DayInfo } from "../components/WeekDayCircles";
import { useAuthStore } from "../store/authStore";
import { useProfileStore } from "../store/profileStore";
import {
  countCompletedThisWeek,
  createWorkout,
  deleteWorkout,
  getTodayWorkout,
  listWeekWorkouts,
  listWorkouts,
} from "../services/workoutService";
import { getTopPerformanceThisWeek } from "../services/progressService";
import type { TopPerformance } from "../services/progressService";
import { cancelReminder } from "../services/notificationService";
import { getTodayCheckin } from "../services/checkinService";
import { getTodayCardioSession, listCardioSessions } from "../services/cardioService";
import { colors, eyebrow } from "../lib/theme";
import type { CardioSession, DailyCheckin, Frequency, Workout } from "../lib/types";

type Mode = "muscu" | "cardio";

const CARDIO_TYPE_LABELS: Record<CardioSession["type"], string> = {
  fractionne: "Fractionné",
  bronco: "Bronco test",
  course_libre: "Course libre",
  custom: "Cardio sur-mesure",
};

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Home">,
  NativeStackScreenProps<MainStackParamList>
>;

const FREQUENCY_GOALS: Record<Frequency, number> = {
  "0": 0,
  "1-2": 2,
  "3-4": 4,
  "5+": 5,
};

export default function HomeScreen({ navigation }: Props) {
  const session = useAuthStore((state) => state.session);
  const profile = useProfileStore((state) => state.profile);
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>("muscu");
  const [todayWorkout, setTodayWorkout] = useState<Workout | null>(null);
  const [todayCardio, setTodayCardio] = useState<CardioSession | null>(null);
  const [completedThisWeek, setCompletedThisWeek] = useState(0);
  const [weekWorkouts, setWeekWorkouts] = useState<Workout[]>([]);
  const [topPerformance, setTopPerformance] = useState<TopPerformance | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [recentCardioSessions, setRecentCardioSessions] = useState<CardioSession[]>([]);
  const [checkin, setCheckin] = useState<DailyCheckin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  const goal = FREQUENCY_GOALS[profile?.current_frequency ?? "0"] ?? 0;

  const loadAll = useCallback((userId: string) => {
    setIsLoading(true);
    Promise.all([getTodayWorkout(userId), getTodayCardioSession(userId)])
      .then(([workout, cardio]) => {
        setTodayWorkout(workout);
        setTodayCardio(cardio);
      })
      .catch((error) =>
        Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue")
      )
      .finally(() => setIsLoading(false));

    countCompletedThisWeek(userId).then(setCompletedThisWeek).catch(() => {});
    listWeekWorkouts(userId).then(setWeekWorkouts).catch(() => {});
    getTopPerformanceThisWeek(userId).then(setTopPerformance).catch(() => {});
    listWorkouts(userId).then(setRecentWorkouts).catch(() => {});
    listCardioSessions(userId).then(setRecentCardioSessions).catch(() => {});
    getTodayCheckin(userId).then(setCheckin).catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      loadAll(session.user.id);
    }, [session, loadAll])
  );

  const handleStart = async () => {
    if (!session) return;
    setIsStarting(true);
    try {
      if (mode === "muscu") {
        const workout = todayWorkout ?? (await createWorkout(session.user.id));
        navigation.navigate("WorkoutSession", { workoutId: workout.id });
      } else if (todayCardio) {
        navigation.navigate("CardioSession", { cardioSessionId: todayCardio.id });
      } else {
        navigation.navigate("CardioPreview");
      }
    } catch (error) {
      Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsStarting(false);
    }
  };

  const handleCancelScheduled = async (workout: Workout) => {
    try {
      if (workout.notification_id) {
        await cancelReminder(workout.notification_id);
      }
      await deleteWorkout(workout.id);
      if (session) loadAll(session.user.id);
    } catch (error) {
      Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue");
    }
  };

  const handleDayPress = (day: DayInfo) => {
    if (!day.workout) {
      if (mode === "muscu") navigation.navigate("WorkoutPreview", { targetDate: day.date });
      else navigation.navigate("CardioPreview", { targetDate: day.date });
      return;
    }

    if (day.workout.status === "terminee") {
      navigation.navigate("WorkoutDetail", { workoutId: day.workout.id });
      return;
    }

    if (day.isToday) {
      handleStart();
      return;
    }

    Alert.alert(
      "Séance programmée",
      "Elle t'attend ce jour-là. Tu veux l'annuler ?",
      [
        { text: "Fermer", style: "cancel" },
        {
          text: "Annuler la séance",
          style: "destructive",
          onPress: () => handleCancelScheduled(day.workout as Workout),
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16 }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Alors {profile?.first_name} ?</Text>
        <View style={[styles.badge, profile?.is_premium && styles.badgePremium]}>
          <Text style={[styles.badgeText, profile?.is_premium && styles.badgeTextPremium]}>
            {profile?.is_premium ? "Premium (le vrai)" : "Gratuit (radin)"}
          </Text>
        </View>
      </View>

      <GoalProgressBar completed={completedThisWeek} goal={goal} />

      <WeekDayCircles workouts={weekWorkouts} onDayPress={handleDayPress} />

      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, mode === "muscu" && styles.modeButtonActive]}
          onPress={() => setMode("muscu")}
        >
          <Ionicons
            name="barbell"
            size={16}
            color={mode === "muscu" ? colors.accentText : colors.textMuted}
          />
          <Text style={[styles.modeButtonText, mode === "muscu" && styles.modeButtonTextActive]}>
            Musculation
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === "cardio" && styles.modeButtonActive]}
          onPress={() => setMode("cardio")}
        >
          <Ionicons
            name="heart"
            size={16}
            color={mode === "cardio" ? colors.accentText : colors.textMuted}
          />
          <Text style={[styles.modeButtonText, mode === "cardio" && styles.modeButtonTextActive]}>
            Cardio
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : mode === "muscu" ? (
        <View style={styles.todayBlock}>
          <Text style={styles.eyebrow}>Séance du jour</Text>
          {todayWorkout ? (
            <WorkoutListItem workout={todayWorkout} onPress={handleStart} />
          ) : (
            <Text style={styles.emptyToday}>
              Rien de prévu aujourd'hui. Le canapé peut attendre.
            </Text>
          )}
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStart}
            disabled={isStarting}
          >
            {isStarting ? (
              <ActivityIndicator color={colors.accentText} />
            ) : (
              <>
                <Ionicons name="flame" size={18} color={colors.accentText} />
                <Text style={styles.startButtonText}>
                  {todayWorkout ? "On reprend où t'as flanché" : "GO, plus d'excuses"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => navigation.navigate("WorkoutPreview")}
          >
            <Ionicons name="sparkles" size={16} color={colors.accent} />
            <Text style={styles.generateButtonText}>
              {todayWorkout
                ? "Envie d'autre chose ? Génère une nouvelle séance"
                : "Trop la flemme de choisir ? Génère-moi ça"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.todayBlock}>
          <Text style={styles.eyebrow}>Séance du jour</Text>
          {todayCardio ? (
            <Text style={styles.emptyToday}>
              Cardio du jour : {CARDIO_TYPE_LABELS[todayCardio.type]}
            </Text>
          ) : (
            <Text style={styles.emptyToday}>
              Rien de prévu aujourd'hui. Le canapé peut attendre.
            </Text>
          )}
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStart}
            disabled={isStarting}
          >
            {isStarting ? (
              <ActivityIndicator color={colors.accentText} />
            ) : (
              <>
                <Ionicons name="flame" size={18} color={colors.accentText} />
                <Text style={styles.startButtonText}>
                  {todayCardio ? "On reprend où t'as flanché" : "GO, plus d'excuses"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => navigation.navigate("CardioPreview")}
          >
            <Ionicons name="sparkles" size={16} color={colors.accent} />
            <Text style={styles.generateButtonText}>
              {todayCardio
                ? "Envie d'autre chose ? Génère une nouvelle séance"
                : "Trop la flemme de choisir ? Génère-moi ça"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === "muscu" ? (
        <>
          <TopPerformanceCard performance={topPerformance} />
          <RecentSessionsCarousel
            workouts={recentWorkouts}
            onPress={(workoutId) => navigation.navigate("WorkoutDetail", { workoutId })}
          />
        </>
      ) : (
        <RecentCardioCarousel sessions={recentCardioSessions} />
      )}

      <GlobalFormeCard checkin={checkin} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "Poppins_800ExtraBold",
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgePremium: {
    backgroundColor: colors.highlight,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
    color: colors.textSecondary,
  },
  badgeTextPremium: {
    color: colors.highlightText,
  },
  todayBlock: {
    marginBottom: 24,
  },
  eyebrow: {
    ...eyebrow,
    color: colors.accent,
    marginBottom: 8,
  },
  emptyToday: {
    color: colors.textMuted,
    marginBottom: 12,
  },
  startButton: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  startButtonText: {
    color: colors.accentText,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
  generateButton: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  generateButtonText: {
    color: colors.accent,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modeButtonActive: {
    backgroundColor: colors.accent,
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    color: colors.textMuted,
  },
  modeButtonTextActive: {
    color: colors.accentText,
  },
});
