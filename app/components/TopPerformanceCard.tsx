import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../lib/theme";
import type { TopPerformance } from "../services/progressService";

type Props = {
  performance: TopPerformance | null;
};

export default function TopPerformanceCard({ performance }: Props) {
  if (!performance) return null;

  return (
    <View style={styles.card}>
      <Ionicons name="trophy" size={22} color={colors.accent} />
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>Top perf de la semaine</Text>
        <Text style={styles.value}>
          {performance.exerciseName} — {performance.weight} kg
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});
