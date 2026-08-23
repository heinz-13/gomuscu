import { FlatList, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../lib/theme";
import type { CardioSession } from "../lib/types";

type Props = {
  sessions: CardioSession[];
};

const TYPE_LABELS: Record<CardioSession["type"], string> = {
  fractionne: "Fractionné",
  bronco: "Bronco",
  course_libre: "Course libre",
  custom: "Sur-mesure",
};

function formatShortDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function RecentCardioCarousel({ sessions }: Props) {
  if (sessions.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dernières séances cardio</Text>
      <FlatList
        horizontal
        data={sessions.slice(0, 4)}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.cardDate}>{formatShortDate(item.date)}</Text>
            <Text style={styles.cardType}>{TYPE_LABELS[item.type]}</Text>
            {item.actual_duration_sec && (
              <Text style={styles.cardMeta}>{Math.round(item.actual_duration_sec / 60)} min</Text>
            )}
          </View>
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
    color: colors.textPrimary,
    textTransform: "capitalize",
  },
  cardType: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: "600",
  },
  cardMeta: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
