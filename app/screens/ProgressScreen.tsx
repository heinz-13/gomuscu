import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProgressChart from "../components/ProgressChart";
import { useAuthStore } from "../store/authStore";
import {
  getExerciseHistory,
  getPersonalRecord,
  listLoggedExercises,
} from "../services/progressService";
import { colors } from "../lib/theme";
import type {
  ExerciseHistoryPoint,
  LoggedExercise,
  PersonalRecord,
} from "../services/progressService";

export default function ProgressScreen() {
  const session = useAuthStore((state) => state.session);
  const insets = useSafeAreaInsets();
  const [loggedExercises, setLoggedExercises] = useState<LoggedExercise[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<ExerciseHistoryPoint[]>([]);
  const [record, setRecord] = useState<PersonalRecord | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      setIsLoadingList(true);
      listLoggedExercises(session.user.id)
        .then((list) => {
          setLoggedExercises(list);
          setSelectedId((current) => current ?? list[0]?.exerciseId ?? null);
        })
        .catch((error) =>
          Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue")
        )
        .finally(() => setIsLoadingList(false));
    }, [session])
  );

  useEffect(() => {
    if (!session || !selectedId) return;
    let cancelled = false;
    setIsLoadingDetail(true);
    Promise.all([
      getExerciseHistory(session.user.id, selectedId),
      getPersonalRecord(session.user.id, selectedId),
    ])
      .then(([historyData, recordData]) => {
        if (cancelled) return;
        setHistory(historyData);
        setRecord(recordData);
      })
      .catch((error) => {
        if (cancelled) return;
        Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session, selectedId]);

  if (isLoadingList) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Progression</Text>

      {loggedExercises.length === 0 ? (
        <Text style={styles.empty}>
          Termine une première séance et reviens frimer ici.
        </Text>
      ) : (
        <>
          <FlatList
            horizontal
            data={loggedExercises}
            keyExtractor={(item) => item.exerciseId}
            showsHorizontalScrollIndicator={false}
            style={styles.selector}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.chip,
                  selectedId === item.exerciseId && styles.chipActive,
                ]}
                onPress={() => setSelectedId(item.exerciseId)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedId === item.exerciseId && styles.chipTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />

          <ScrollView contentContainerStyle={styles.content}>
            {isLoadingDetail ? (
              <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
            ) : (
              <>
                {record && (
                  <View style={styles.recordCard}>
                    <Ionicons name="trophy" size={20} color={colors.highlight} />
                    <Text style={styles.recordLabel}>Ton record perso</Text>
                    <Text style={styles.recordValue}>{record.weight} kg</Text>
                  </View>
                )}
                <ProgressChart data={history.map((h) => ({ date: h.date, weight: h.maxWeight }))} />
              </>
            )}
          </ScrollView>
        </>
      )}
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
    fontFamily: "Poppins_800ExtraBold",
    marginBottom: 16,
    color: colors.textPrimary,
  },
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: 32,
  },
  selector: {
    marginBottom: 16,
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
  content: {
    paddingBottom: 48,
  },
  recordCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.highlight,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    gap: 4,
  },
  recordLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 4,
  },
  recordValue: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: "IBMPlexMono_600SemiBold",
    color: colors.highlight,
  },
});
