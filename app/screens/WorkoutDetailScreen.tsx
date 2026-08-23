import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../navigation/types";
import ExerciseCard from "../components/ExerciseCard";
import WorkoutListItem from "../components/WorkoutListItem";
import { getWorkoutDetail } from "../services/workoutService";
import { getSignedPhotoUrl } from "../services/photoService";
import { colors } from "../lib/theme";
import type { WorkoutWithSets } from "../lib/types";

type Props = NativeStackScreenProps<MainStackParamList, "WorkoutDetail">;

export default function WorkoutDetailScreen({ route, navigation }: Props) {
  const { workoutId } = route.params;
  const insets = useSafeAreaInsets();
  const [detail, setDetail] = useState<WorkoutWithSets | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    getWorkoutDetail(workoutId)
      .then(setDetail)
      .catch((error) =>
        Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue")
      );
  }, [workoutId]);

  useEffect(() => {
    if (detail?.photo_path) {
      getSignedPhotoUrl(detail.photo_path)
        .then(setPhotoUrl)
        .catch(() => {
          // La photo n'a pas pu être chargée — on l'affiche simplement pas, pas bloquant.
        });
    }
  }, [detail?.photo_path]);

  if (!detail) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const grouped = new Map<string, typeof detail.sets>();
  for (const set of detail.sets) {
    const existing = grouped.get(set.exercise_id);
    if (existing) existing.push(set);
    else grouped.set(set.exercise_id, [set]);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
        <Text style={styles.backButtonText}>Retour</Text>
      </TouchableOpacity>

      {photoUrl && <Image source={{ uri: photoUrl }} style={styles.photo} />}

      <WorkoutListItem workout={detail} exerciseCount={grouped.size} />

      {Array.from(grouped.entries()).map(([exerciseId, sets]) => (
        <View key={exerciseId} style={styles.block}>
          <ExerciseCard exercise={sets[0].exercise} />
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Série</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Reps</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Poids</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>RPE</Text>
            </View>
            {sets.map((set) => (
              <View key={set.id} style={styles.tableRow}>
                <Text style={styles.tableCell}>{set.set_number}</Text>
                <Text style={styles.tableCell}>{set.reps}</Text>
                <Text style={styles.tableCell}>{set.weight_kg} kg</Text>
                <Text style={styles.tableCell}>{set.rpe ?? "-"}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
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
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 2,
    marginBottom: 12,
  },
  backButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  photo: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: colors.surfaceAlt,
  },
  block: {
    marginBottom: 20,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 8,
  },
  tableHeaderText: {
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    color: colors.textMuted,
    fontSize: 12,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tableCell: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    color: colors.textPrimary,
  },
});
