import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../lib/theme";
import type { Workout } from "../lib/types";

type Props = {
  workouts: Workout[];
  onPress: (workoutId: string) => void;
};

function formatShortDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function RecentSessionsCarousel({ workouts, onPress }: Props) {
  if (workouts.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dernières séances</Text>
      <FlatList
        horizontal
        data={workouts.slice(0, 4)}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => onPress(item.id)}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.cardDate}>{formatShortDate(item.date)}</Text>
            {item.global_rpe && <Text style={styles.cardMeta}>RPE {item.global_rpe}</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    color: colors.textPrimary,
    marginBottom: 10,
  },
  list: {
    gap: 10,
  },
  card: {
    width: 110,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  cardDate: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
    color: colors.textPrimary,
    textTransform: "capitalize",
  },
  cardMeta: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
