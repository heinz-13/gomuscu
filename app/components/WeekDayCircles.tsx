import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../lib/theme";
import { toLocalDateString } from "../services/workoutService";
import type { Workout } from "../lib/types";

export type DayInfo = {
  date: string;
  workout: Workout | null;
  isToday: boolean;
  isPast: boolean;
};

type Props = {
  workouts: Workout[];
  onDayPress: (day: DayInfo) => void;
};

const DAY_LABELS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

function buildWeekDays(workouts: Workout[]): DayInfo[] {
  const now = new Date();
  const today = toLocalDateString(now);
  const dayOfWeek = (now.getDay() + 6) % 7; // 0 = lundi
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek);

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const date = toLocalDateString(day);
    const workout = workouts.find((w) => w.date === date) ?? null;
    return { date, workout, isToday: date === today, isPast: date < today };
  });
}

export default function WeekDayCircles({ workouts, onDayPress }: Props) {
  const days = buildWeekDays(workouts);

  return (
    <View style={styles.row}>
      {days.map((day, index) => {
        const done = day.workout?.status === "terminee";
        const scheduled = day.workout?.status === "planifiee" && !day.isPast;
        const missed = day.isPast && !done;
        const disabled = missed;

        return (
          <View key={day.date} style={styles.dayColumn}>
            <Text style={styles.dayLabel}>{DAY_LABELS[index]}</Text>
            <TouchableOpacity
              style={[
                styles.circle,
                done && styles.circleDone,
                day.isToday && styles.circleToday,
                scheduled && !day.isToday && styles.circleScheduled,
                missed && styles.circleMissed,
              ]}
              onPress={() => onDayPress(day)}
              disabled={disabled}
            >
              {done ? (
                <Ionicons name="checkmark" size={16} color={colors.accentText} />
              ) : scheduled && !day.isToday ? (
                <Ionicons name="notifications" size={14} color={colors.accent} />
              ) : (
                <Text style={styles.dayNumber}>{Number(day.date.slice(-2))}</Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dayColumn: {
    alignItems: "center",
    gap: 6,
  },
  dayLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  circleDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  circleToday: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  circleScheduled: {
    borderColor: colors.accent,
    borderStyle: "dashed",
  },
  circleMissed: {
    opacity: 0.35,
  },
  dayNumber: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
  },
});
