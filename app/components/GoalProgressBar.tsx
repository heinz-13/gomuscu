import { StyleSheet, Text, View } from "react-native";
import { colors } from "../lib/theme";

type Props = {
  completed: number;
  goal: number;
};

export default function GoalProgressBar({ completed, goal }: Props) {
  const ratio = goal > 0 ? Math.min(1, completed / goal) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Objectif de la semaine</Text>
        <Text style={styles.value}>
          {completed}
          {goal > 0 ? ` / ${goal}` : ""}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
  },
  value: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
});
