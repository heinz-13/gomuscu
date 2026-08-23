import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Workout } from "../lib/types";
import { colors } from "../lib/theme";

type Props = {
  workout: Workout;
  exerciseCount?: number;
  onPress?: () => void;
};

function formatDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return "en cours";
  const minutes = Math.round(
    (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000
  );
  return `${minutes} min`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function WorkoutListItem({ workout, exerciseCount, onPress }: Props) {
  const Wrapper = onPress ? TouchableOpacity : View;
  const done = workout.status === "terminee";

  return (
    <Wrapper style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.date}>{formatDate(workout.date)}</Text>
        <View style={[styles.badge, done ? styles.badgeDone : styles.badgePlanned]}>
          <Ionicons
            name={done ? "checkmark-circle" : "time-outline"}
            size={13}
            color={done ? colors.success : colors.accent}
          />
          <Text style={[styles.badgeText, { color: done ? colors.success : colors.accent }]}>
            {done ? "Terminée" : "Planifiée"}
          </Text>
        </View>
      </View>
      <Text style={styles.meta}>
        {formatDuration(workout.started_at, workout.ended_at)}
        {exerciseCount !== undefined ? ` · ${exerciseCount} exercice(s)` : ""}
        {workout.global_rpe ? ` · RPE ${workout.global_rpe}` : ""}
      </Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
    color: colors.textPrimary,
    textTransform: "capitalize",
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgeDone: {
    backgroundColor: "rgba(52, 199, 89, 0.15)",
  },
  badgePlanned: {
    backgroundColor: "rgba(255, 122, 0, 0.15)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
  },
});
