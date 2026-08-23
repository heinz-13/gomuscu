import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Exercise } from "../lib/types";
import { colors } from "../lib/theme";
import { CATEGORY_ICONS } from "../lib/exerciseIcons";

const CATEGORY_LABELS: Record<string, string> = {
  pectoraux: "Pectoraux",
  dos: "Dos",
  jambes: "Jambes",
  epaules: "Épaules",
  bras: "Bras",
  abdos: "Abdos",
  full_body: "Full-body",
};

type Props = {
  exercise: Pick<Exercise, "id" | "name" | "category">;
  onPress?: () => void;
};

export default function ExerciseCard({ exercise, onPress }: Props) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper style={styles.card} onPress={onPress}>
      <View style={styles.illustration}>
        <MaterialCommunityIcons
          name={CATEGORY_ICONS[exercise.category]}
          size={22}
          color={colors.accent}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{exercise.name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {CATEGORY_LABELS[exercise.category] ?? exercise.category}
          </Text>
        </View>
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  illustration: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
    color: colors.textPrimary,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
