import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { WorkoutSet } from "../lib/types";
import { colors } from "../lib/theme";

type Props = {
  set: WorkoutSet;
  onPress: () => void;
};

export default function CompletedSetRow({ set, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
      <Text style={styles.text}>
        Série {set.set_number} · {set.weight_kg} kg × {set.reps}
        {set.rpe ? ` · RPE ${set.rpe}` : ""}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    opacity: 0.75,
  },
  text: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
