import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../navigation/types";
import ExerciseCard from "../components/ExerciseCard";
import DailyCheckinForm from "../components/DailyCheckinForm";
import { useAuthStore } from "../store/authStore";
import { useProfileStore } from "../store/profileStore";
import { buildSessionPlan, commitPlan, THEME_LABELS } from "../services/generateService";
import type { SessionPlan, SessionSlot, Theme } from "../services/generateService";
import { listExercises } from "../services/exerciseService";
import { listPersonalRecords } from "../services/progressService";
import { getTodayCheckin, upsertTodayCheckin } from "../services/checkinService";
import type { CheckinInput } from "../services/checkinService";
import { setWorkoutNotification, toLocalDateString } from "../services/workoutService";
import { scheduleWorkoutReminder } from "../services/notificationService";
import type { DailyCheckin, Exercise, Workout } from "../lib/types";
import { colors } from "../lib/theme";

type Props = NativeStackScreenProps<MainStackParamList, "WorkoutPreview">;

const EMPTY_PLAN: SessionPlan = { blocks: [], finisher: null };

const REMINDER_PRESETS: { label: string; hour: number }[] = [
  { label: "Matin (8h)", hour: 8 },
  { label: "Midi (12h)", hour: 12 },
  { label: "Soir (18h)", hour: 18 },
  { label: "20h", hour: 20 },
];

const THEME_ICONS: Record<Theme, keyof typeof MaterialCommunityIcons.glyphMap> = {
  haut: "arm-flex",
  bas: "run",
  dos: "human-handsup",
  abdo_bras: "dumbbell",
};

const THEMES: Theme[] = ["haut", "bas", "dos", "abdo_bras"];

function groupByBlock(slots: SessionSlot[]): { number: number; slots: SessionSlot[] }[] {
  const blocks: { number: number; slots: SessionSlot[] }[] = [];
  for (const slot of slots) {
    const number = Number(slot.blockLabel.split(".")[0]);
    const last = blocks[blocks.length - 1];
    if (last && last.number === number) last.slots.push(slot);
    else blocks.push({ number, slots: [slot] });
  }
  return blocks;
}

export default function WorkoutPreviewScreen({ navigation, route }: Props) {
  const session = useAuthStore((state) => state.session);
  const profile = useProfileStore((state) => state.profile);
  const insets = useSafeAreaInsets();

  const targetDate = route.params?.targetDate;
  const isToday = !targetDate || targetDate === toLocalDateString(new Date());

  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [personalRecords, setPersonalRecords] = useState<Record<string, number>>({});
  const [checkin, setCheckin] = useState<DailyCheckin | null>(null);
  const [isSubmittingCheckin, setIsSubmittingCheckin] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [plan, setPlan] = useState<SessionPlan>(EMPTY_PLAN);
  const [includeFinisher, setIncludeFinisher] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommitting, setIsCommitting] = useState(false);
  const [committedWorkout, setCommittedWorkout] = useState<Workout | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      listExercises(),
      listPersonalRecords(session.user.id),
      isToday ? getTodayCheckin(session.user.id) : Promise.resolve(null),
    ])
      .then(([exerciseList, records, todayCheckin]) => {
        setExercises(exerciseList);
        setPersonalRecords(records);
        setCheckin(todayCheckin);
      })
      .catch((error) => {
        Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue");
        navigation.goBack();
      })
      .finally(() => setIsLoading(false));
  }, [session, navigation, isToday]);

  const handleSubmitCheckin = async (input: CheckinInput) => {
    if (!session) return;
    setIsSubmittingCheckin(true);
    try {
      const saved = await upsertTodayCheckin(session.user.id, input);
      setCheckin(saved);
    } catch (error) {
      Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsSubmittingCheckin(false);
    }
  };

  const handleSelectTheme = (theme: Theme) => {
    if (!profile || !exercises) return;
    setSelectedTheme(theme);
    setPlan(buildSessionPlan(profile, exercises, theme, personalRecords, checkin));
  };

  const handleChangeTheme = () => {
    setSelectedTheme(null);
    setPlan(EMPTY_PLAN);
  };

  const handleRegenerate = useCallback(() => {
    if (!profile || !exercises || !selectedTheme) return;
    setPlan(buildSessionPlan(profile, exercises, selectedTheme, personalRecords, checkin));
  }, [profile, exercises, selectedTheme, personalRecords, checkin]);

  const handleConfirm = async () => {
    if (!session) return;
    setIsCommitting(true);
    try {
      const workout = await commitPlan(session.user.id, plan, includeFinisher, targetDate);
      if (isToday) {
        navigation.replace("WorkoutSession", { workoutId: workout.id });
      } else {
        setCommittedWorkout(workout);
      }
    } catch (error) {
      Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsCommitting(false);
    }
  };

  const handlePickReminder = async (hour: number) => {
    if (!committedWorkout || !targetDate || !selectedTheme) return;
    setIsScheduling(true);
    try {
      const [year, month, day] = targetDate.split("-").map(Number);
      const reminderDate = new Date(year, month - 1, day, hour, 0, 0);
      const dayLabel = reminderDate.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      const notificationId = await scheduleWorkoutReminder(
        reminderDate,
        `Séance ${THEME_LABELS[selectedTheme]} prévue ${dayLabel}, bouge-toi.`
      );
      if (notificationId) {
        await setWorkoutNotification(committedWorkout.id, notificationId);
        navigation.popToTop();
      } else {
        Alert.alert(
          "Notifications désactivées",
          "La séance est bien programmée, mais je ne peux pas t'envoyer de rappel sans autorisation de notification.",
          [{ text: "Compris", onPress: () => navigation.popToTop() }]
        );
      }
    } catch (error) {
      Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsScheduling(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (committedWorkout) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Séance programmée !</Text>
        <Text style={styles.subtitle}>
          Un petit rappel pour ne pas zapper ? Choisis une heure.
        </Text>

        <View style={styles.themeGrid}>
          {REMINDER_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.hour}
              style={styles.themeCard}
              onPress={() => handlePickReminder(preset.hour)}
              disabled={isScheduling}
            >
              <Ionicons name="notifications" size={28} color={colors.accent} />
              <Text style={styles.themeCardText}>{preset.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => navigation.popToTop()}
          style={styles.cancelButton}
          disabled={isScheduling}
        >
          <Text style={styles.cancelButtonText}>
            {isScheduling ? "Un instant..." : "Pas de rappel, je gère"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isToday && !checkin) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <DailyCheckinForm onSubmit={handleSubmitCheckin} isSubmitting={isSubmittingCheckin} />
      </View>
    );
  }

  if (!selectedTheme) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>On tape quoi aujourd'hui ?</Text>
        <Text style={styles.subtitle}>Choisis la thématique, je fais le reste.</Text>

        <View style={styles.themeGrid}>
          {THEMES.map((theme) => (
            <TouchableOpacity
              key={theme}
              style={styles.themeCard}
              onPress={() => handleSelectTheme(theme)}
            >
              <MaterialCommunityIcons
                name={THEME_ICONS[theme]}
                size={32}
                color={colors.accent}
              />
              <Text style={styles.themeCardText}>{THEME_LABELS[theme]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>J'ai eu peur, j'annule</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <TouchableOpacity style={styles.changeThemeButton} onPress={handleChangeTheme}>
        <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
        <Text style={styles.changeThemeText}>Changer de thématique</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{THEME_LABELS[selectedTheme]}</Text>
      <Text style={styles.subtitle}>Sois content(e), j'ai bossé pour toi.</Text>
      {plan.blocks.length > 0 && plan.blocks.length < 6 && (
        <Text style={styles.warning}>
          Ton matériel limite le choix — j'ai fait ce que j'ai pu.
        </Text>
      )}

      <ScrollView contentContainerStyle={styles.list}>
        {plan.blocks.length === 0 ? (
          <Text style={styles.empty}>
            Rien à proposer avec ton matériel actuel. Va falloir improviser.
          </Text>
        ) : (
          groupByBlock(plan.blocks).map((block) => (
            <View key={block.number} style={styles.block}>
              <Text style={styles.blockTitle}>
                Bloc {block.number}
                {block.slots.length > 1 ? " (superset)" : ""}
              </Text>
              {block.slots.map((slot) => (
                <View key={slot.exercise.id} style={styles.slot}>
                  <View style={styles.slotRow}>
                    <Text style={styles.slotLabel}>{slot.blockLabel}</Text>
                    <View style={{ flex: 1 }}>
                      <ExerciseCard exercise={slot.exercise} />
                    </View>
                  </View>
                  <Text style={styles.target}>
                    {slot.setsCount} × {slot.targetReps} reps
                    {slot.targetWeight > 0 ? ` — ${slot.targetWeight} kg conseillés` : ""}
                  </Text>
                </View>
              ))}
            </View>
          ))
        )}

        {plan.finisher && (
          <View style={[styles.block, styles.finisherBlock]}>
            <View style={styles.finisherHeader}>
              <Text style={styles.blockTitle}>Finisher bonus</Text>
              <Switch
                value={includeFinisher}
                onValueChange={setIncludeFinisher}
                trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
                thumbColor="#fff"
              />
            </View>
            <View style={[styles.slot, !includeFinisher && styles.finisherDisabled]}>
              <ExerciseCard exercise={plan.finisher.exercise} />
              <Text style={styles.target}>
                {plan.finisher.setsCount} × {plan.finisher.targetReps} reps
                {plan.finisher.targetWeight > 0 ? ` — ${plan.finisher.targetWeight} kg conseillés` : ""}
                {" "}— pour ceux qui en veulent encore
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>J'ai eu peur, j'annule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.regenerateButton}
          onPress={handleRegenerate}
          disabled={plan.blocks.length === 0}
        >
          <Ionicons name="refresh" size={16} color={colors.accent} />
          <Text style={styles.regenerateButtonText}>Une autre idée</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          disabled={isCommitting || plan.blocks.length === 0}
        >
          {isCommitting ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={styles.confirmButtonText}>
              {isToday ? "GO, c'est parti" : "Programmer cette séance"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
  },
  warning: {
    fontSize: 12,
    color: colors.accent,
    marginTop: -8,
    marginBottom: 12,
  },
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  themeCard: {
    width: "47%",
    aspectRatio: 1.1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  themeCardText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  changeThemeButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 2,
    marginBottom: 8,
  },
  changeThemeText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  list: {
    paddingBottom: 16,
  },
  block: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  finisherBlock: {
    borderColor: colors.accent,
    borderStyle: "dashed",
  },
  finisherHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  finisherDisabled: {
    opacity: 0.4,
  },
  blockTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.accent,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  slot: {
    marginBottom: 4,
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  slotLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textMuted,
    width: 28,
  },
  target: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: -4,
    marginBottom: 10,
    marginLeft: 40,
  },
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: 32,
  },
  actions: {
    paddingVertical: 16,
    gap: 10,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 6,
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  regenerateButton: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  regenerateButtonText: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmButtonText: {
    color: colors.accentText,
    fontWeight: "700",
    fontSize: 16,
  },
});
