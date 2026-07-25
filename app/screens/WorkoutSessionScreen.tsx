import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../navigation/types";
import ExerciseCard from "../components/ExerciseCard";
import SetRow from "../components/SetRow";
import CompletedSetRow from "../components/CompletedSetRow";
import RPESelector from "../components/RPESelector";
import RestTimer from "../components/RestTimer";
import { useAuthStore } from "../store/authStore";
import { useWorkoutSessionStore } from "../store/workoutSessionStore";
import {
  addSet,
  deleteSet,
  finishWorkout,
  getWorkoutDetail,
  setWorkoutPhoto,
  updateSet,
} from "../services/workoutService";
import { getLastPerformance } from "../services/progressService";
import type { LastPerformanceSet } from "../services/progressService";
import { takePhotoAndUpload } from "../services/photoService";
import { colors } from "../lib/theme";
import type { SessionExercise } from "../store/workoutSessionStore";

type Props = NativeStackScreenProps<MainStackParamList, "WorkoutSession">;

function groupByBlock(
  exercises: SessionExercise[]
): { number: number | null; items: SessionExercise[] }[] {
  const groups: { number: number | null; items: SessionExercise[] }[] = [];
  for (const item of exercises) {
    const label = item.sets[0]?.block_label ?? null;
    const number = label ? Number(label.split(".")[0]) : null;
    const last = groups[groups.length - 1];
    if (last && last.number === number && number !== null) last.items.push(item);
    else groups.push({ number, items: [item] });
  }
  return groups;
}

export default function WorkoutSessionScreen({ route, navigation }: Props) {
  const { workoutId } = route.params;
  const session = useAuthStore((state) => state.session);
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showGlobalRpe, setShowGlobalRpe] = useState(false);
  const [globalRpe, setGlobalRpe] = useState<number | null>(null);
  const [justFinished, setJustFinished] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [lastPerformance, setLastPerformance] = useState<
    Record<string, LastPerformanceSet[]>
  >({});
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimerKey, setRestTimerKey] = useState(0);
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<number>>(new Set());

  const toggleBlock = (number: number) => {
    setCollapsedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(number)) next.delete(number);
      else next.add(number);
      return next;
    });
  };

  const exercises = useWorkoutSessionStore((state) => state.exercises);
  const startSession = useWorkoutSessionStore((state) => state.startSession);
  const addExerciseSet = useWorkoutSessionStore((state) => state.addSet);
  const updateExerciseSet = useWorkoutSessionStore((state) => state.updateSet);
  const removeExerciseSet = useWorkoutSessionStore((state) => state.removeSet);
  const reset = useWorkoutSessionStore((state) => state.reset);

  useEffect(() => {
    let cancelled = false;

    getWorkoutDetail(workoutId)
      .then((detail) => {
        if (cancelled) return;

        const grouped = new Map<string, SessionExercise>();
        for (const set of detail.sets) {
          const existing = grouped.get(set.exercise_id);
          if (existing) {
            existing.sets.push(set);
          } else {
            grouped.set(set.exercise_id, { exercise: set.exercise, sets: [set] });
          }
        }

        const sessionExercises = Array.from(grouped.values());
        startSession(workoutId, sessionExercises);
        setIsLoading(false);

        if (session) {
          Promise.all(
            sessionExercises.map((e) =>
              getLastPerformance(session.user.id, e.exercise.id).then(
                (perf) => [e.exercise.id, perf] as const
              )
            )
          )
            .then((entries) => {
              if (cancelled) return;
              setLastPerformance(Object.fromEntries(entries));
            })
            .catch(() => {
              // La référence "dernière fois" est un bonus, pas bloquant si ça échoue.
            });
        }
      })
      .catch((error) => {
        if (cancelled) return;
        Alert.alert(
          "Erreur",
          error instanceof Error ? error.message : "Erreur inconnue"
        );
        navigation.popToTop();
      });

    return () => {
      cancelled = true;
    };
  }, [workoutId, startSession, session]);

  const handleAddSet = async (exerciseId: string, currentCount: number) => {
    try {
      const set = await addSet(workoutId, exerciseId, currentCount + 1, 0, 0, null);
      addExerciseSet(exerciseId, set);
    } catch (error) {
      Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue");
    }
  };

  const handleSetChange = async (
    setId: string,
    patch: Partial<{ reps: number; weight_kg: number; rpe: number | null; completed: boolean }>
  ) => {
    updateExerciseSet(setId, patch);

    if (patch.completed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRestTimerKey((k) => k + 1);
      setRestTimerActive(true);
    }

    try {
      await updateSet(setId, patch);
    } catch (error) {
      Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue");
    }
  };

  const handleDeleteSet = async (setId: string) => {
    removeExerciseSet(setId);
    try {
      await deleteSet(setId);
    } catch (error) {
      Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue");
    }
  };

  const handleFinish = async () => {
    if (exercises.length === 0) {
      Alert.alert("Sérieux ?", "Ajoute au moins un exercice avant de te défiler.");
      return;
    }
    if (!showGlobalRpe) {
      setShowGlobalRpe(true);
      return;
    }

    setIsFinishing(true);
    try {
      await finishWorkout(workoutId, globalRpe);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRestTimerActive(false);
      setJustFinished(true);
    } catch (error) {
      Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsFinishing(false);
    }
  };

  const leaveSession = () => {
    reset();
    navigation.popToTop();
  };

  const handleTakePhoto = async () => {
    if (!session) return;
    setIsTakingPhoto(true);
    try {
      const path = await takePhotoAndUpload(session.user.id, workoutId);
      if (path) await setWorkoutPhoto(workoutId, path);
      leaveSession();
    } catch (error) {
      Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsTakingPhoto(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (justFinished) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera" size={40} color={colors.accent} />
        <Text style={styles.photoTitle}>Immortalise ce moment</Text>
        <Text style={styles.photoSubtitle}>Une petite preuve que t'y étais vraiment.</Text>

        <TouchableOpacity
          style={styles.photoButton}
          onPress={handleTakePhoto}
          disabled={isTakingPhoto}
        >
          {isTakingPhoto ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={styles.photoButtonText}>Prendre une photo</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={leaveSession} disabled={isTakingPhoto}>
          <Text style={styles.skipPhotoText}>Passer, direction la douche</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      >
      <Text style={styles.title}>C'est parti, no pain no gain</Text>

      {groupByBlock(exercises).map((group, groupIndex) => {
        const isCollapsible = group.number !== null;
        const isCollapsed = isCollapsible && collapsedBlocks.has(group.number as number);

        return (
          <View
            key={group.number ?? `single-${groupIndex}`}
            style={isCollapsible ? styles.blockWrapper : undefined}
          >
            {isCollapsible && (
              <TouchableOpacity
                style={styles.blockHeader}
                onPress={() => toggleBlock(group.number as number)}
              >
                <Text style={styles.blockTitle}>
                  Bloc {group.number}
                  {group.items.length > 1 ? " (superset)" : ""}
                </Text>
                <Ionicons
                  name={isCollapsed ? "chevron-down" : "chevron-up"}
                  size={18}
                  color={colors.accent}
                />
              </TouchableOpacity>
            )}
            {!isCollapsed &&
              group.items.map(({ exercise, sets }) => {
                const firstIncomplete = sets.find((s) => !s.completed);
                const visibleSets = sets.filter(
                  (s) => s.completed || s.id === firstIncomplete?.id
                );

                return (
                  <View key={exercise.id} style={styles.exerciseBlock}>
                    <View style={styles.exerciseHeader}>
                      {sets[0]?.block_label && (
                        <Text style={styles.slotLabel}>{sets[0].block_label}</Text>
                      )}
                      <View style={{ flex: 1 }}>
                        <ExerciseCard exercise={exercise} />
                      </View>
                    </View>
                    {visibleSets.map((set) =>
                      set.completed ? (
                        <CompletedSetRow
                          key={set.id}
                          set={set}
                          onPress={() => handleSetChange(set.id, { completed: false })}
                        />
                      ) : (
                        <SetRow
                          key={set.id}
                          set={set}
                          progress={{
                            current: sets.findIndex((s) => s.id === set.id) + 1,
                            total: sets.length,
                          }}
                          previous={lastPerformance[exercise.id]?.find(
                            (p) => p.set_number === set.set_number
                          )}
                          onChange={(patch) => handleSetChange(set.id, patch)}
                          onDelete={() => handleDeleteSet(set.id)}
                        />
                      )
                    )}
                    <TouchableOpacity
                      style={styles.addSetButton}
                      onPress={() => handleAddSet(exercise.id, sets.length)}
                    >
                      <Text style={styles.addSetButtonText}>+ Une série de plus</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
          </View>
        );
      })}

      <TouchableOpacity
        style={styles.addExerciseButton}
        onPress={() => navigation.navigate("ExercisePicker")}
      >
        <Text style={styles.addExerciseButtonText}>+ Un exercice de plus (courage)</Text>
      </TouchableOpacity>

      {showGlobalRpe && (
        <View style={styles.globalRpeBlock}>
          <RPESelector
            label="T'as morflé à combien globalement ?"
            value={globalRpe}
            onChange={setGlobalRpe}
          />
        </View>
      )}

      <TouchableOpacity
        style={styles.finishButton}
        onPress={handleFinish}
        disabled={isFinishing}
      >
        {isFinishing ? (
          <ActivityIndicator color={colors.accentText} />
        ) : (
          <Text style={styles.finishButtonText}>
            {showGlobalRpe ? "Bouclé, GG" : "J'arrête là"}
          </Text>
        )}
      </TouchableOpacity>
      </ScrollView>

      {restTimerActive && (
        <RestTimer key={restTimerKey} onDismiss={() => setRestTimerActive(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
    padding: 24,
    gap: 8,
  },
  photoTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 8,
  },
  photoSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 16,
  },
  photoButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
    marginBottom: 12,
    minWidth: 220,
  },
  photoButtonText: {
    color: colors.accentText,
    fontWeight: "700",
    fontSize: 16,
  },
  skipPhotoText: {
    color: colors.textMuted,
    fontSize: 13,
    padding: 8,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 16,
    color: colors.textPrimary,
  },
  blockWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
  },
  blockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  blockTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  exerciseBlock: {
    marginBottom: 12,
  },
  exerciseHeader: {
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
  addSetButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  addSetButtonText: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  addExerciseButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  addExerciseButtonText: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  globalRpeBlock: {
    marginBottom: 20,
  },
  finishButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  finishButtonText: {
    color: colors.accentText,
    fontWeight: "700",
    fontSize: 16,
  },
});
