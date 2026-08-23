import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../navigation/types";
import ExerciseCard from "../components/ExerciseCard";
import { listExercises } from "../services/exerciseService";
import { useWorkoutSessionStore } from "../store/workoutSessionStore";
import { colors } from "../lib/theme";
import type { Exercise, ExerciseCategory } from "../lib/types";

type Props = NativeStackScreenProps<MainStackParamList, "ExercisePicker">;

const CATEGORIES: { value: ExerciseCategory | "tous"; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "pectoraux", label: "Pectoraux" },
  { value: "dos", label: "Dos" },
  { value: "jambes", label: "Jambes" },
  { value: "epaules", label: "Épaules" },
  { value: "bras", label: "Bras" },
  { value: "abdos", label: "Abdos" },
  { value: "full_body", label: "Full-body" },
];

export default function ExercisePickerScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ExerciseCategory | "tous">("tous");
  const addExercise = useWorkoutSessionStore((state) => state.addExercise);

  useEffect(() => {
    listExercises()
      .then(setExercises)
      .catch((error) =>
        Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue")
      )
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesCategory = category === "tous" || exercise.category === category;
      const matchesSearch = exercise.name
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [exercises, search, category]);

  const handleSelect = (exercise: Exercise) => {
    addExercise(exercise);
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
        <Text style={styles.backButtonText}>Retour</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.search}
        placeholder="Cherche ton supplice"
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, category === item.value && styles.chipActive]}
            onPress={() => setCategory(item.value)}
          >
            <Text
              style={[
                styles.chipText,
                category === item.value && styles.chipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ExerciseCard exercise={item} onPress={() => handleSelect(item)} />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Rien ne correspond. Même la salle n'a pas ça.</Text>
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
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
    color: colors.textPrimary,
  },
  categoryList: {
    marginBottom: 12,
    flexGrow: 0,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.accentText,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
  },
  list: {
    paddingBottom: 24,
  },
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: 32,
  },
});
