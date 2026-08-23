import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { MainStackParamList, MainTabParamList } from "../navigation/types";
import WorkoutListItem from "../components/WorkoutListItem";
import { useAuthStore } from "../store/authStore";
import { listWorkouts } from "../services/workoutService";
import { listCardioSessions } from "../services/cardioService";
import { colors } from "../lib/theme";
import type { CardioSession, Workout } from "../lib/types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Historique">,
  NativeStackScreenProps<MainStackParamList>
>;

type HistoryItem =
  | { kind: "workout"; date: string; workout: Workout }
  | { kind: "cardio"; date: string; cardio: CardioSession };

const CARDIO_LABELS: Record<CardioSession["type"], string> = {
  fractionne: "Fractionné",
  bronco: "Bronco test",
  course_libre: "Course libre",
  custom: "Cardio sur-mesure",
};

export default function HistoryScreen({ navigation }: Props) {
  const session = useAuthStore((state) => state.session);
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      setIsLoading(true);
      Promise.all([listWorkouts(session.user.id), listCardioSessions(session.user.id)])
        .then(([workouts, cardioSessions]) => {
          const merged: HistoryItem[] = [
            ...workouts.map((w): HistoryItem => ({ kind: "workout", date: w.date, workout: w })),
            ...cardioSessions.map(
              (c): HistoryItem => ({ kind: "cardio", date: c.date, cardio: c })
            ),
          ].sort((a, b) => b.date.localeCompare(a.date));
          setItems(merged);
        })
        .catch((error) =>
          Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue")
        )
        .finally(() => setIsLoading(false));
    }, [session])
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Historique</Text>
      <FlatList
        data={items}
        keyExtractor={(item) =>
          item.kind === "workout" ? item.workout.id : item.cardio.id
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) =>
          item.kind === "workout" ? (
            <WorkoutListItem
              workout={item.workout}
              onPress={() =>
                navigation.navigate("WorkoutDetail", { workoutId: item.workout.id })
              }
            />
          ) : (
            <TouchableOpacity style={styles.cardioCard}>
              <View style={styles.cardioRow}>
                <Text style={styles.cardioDate}>
                  {new Date(item.cardio.date).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </Text>
                <View style={styles.cardioBadge}>
                  <Ionicons name="heart" size={13} color={colors.accent} />
                  <Text style={styles.cardioBadgeText}>{CARDIO_LABELS[item.cardio.type]}</Text>
                </View>
              </View>
              <Text style={styles.cardioMeta}>
                {item.cardio.actual_duration_sec
                  ? `${Math.round(item.cardio.actual_duration_sec / 60)} min`
                  : ""}
                {item.cardio.actual_distance_m ? ` · ${item.cardio.actual_distance_m} m` : ""}
                {item.cardio.rpe ? ` · RPE ${item.cardio.rpe}` : ""}
              </Text>
            </TouchableOpacity>
          )
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            Que dalle. Zéro. On commence quand ?
          </Text>
        }
      />
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
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
    color: colors.textPrimary,
  },
  list: {
    paddingBottom: 24,
  },
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: 32,
  },
  cardioCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  cardioRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardioDate: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    textTransform: "capitalize",
  },
  cardioMeta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  cardioBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 122, 0, 0.15)",
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  cardioBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.accent,
  },
});
