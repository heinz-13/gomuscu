import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { MainStackParamList, MainTabParamList } from "../navigation/types";
import WorkoutListItem from "../components/WorkoutListItem";
import { useAuthStore } from "../store/authStore";
import { listWorkouts } from "../services/workoutService";
import { colors } from "../lib/theme";
import type { Workout } from "../lib/types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Historique">,
  NativeStackScreenProps<MainStackParamList>
>;

export default function HistoryScreen({ navigation }: Props) {
  const session = useAuthStore((state) => state.session);
  const insets = useSafeAreaInsets();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      setIsLoading(true);
      listWorkouts(session.user.id)
        .then(setWorkouts)
        .catch((error) =>
          Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue")
        )
        .finally(() => setIsLoading(false));
    }, [session])
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Historique</Text>
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <WorkoutListItem
            workout={item}
            onPress={() =>
              navigation.navigate("WorkoutDetail", { workoutId: item.id })
            }
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Que dalle. Zéro. On commence quand ?
          </Text>
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
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
    color: colors.textPrimary,
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
