import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../navigation/types";
import { useAuthStore } from "../store/authStore";
import {
  addMember,
  getGroupSummaries,
  getGroupTopPrs,
  getGroupWeeklyRanking,
  searchUsersByUsername,
} from "../services/groupService";
import type { GroupRankingEntry } from "../services/groupService";
import { getWeekBounds } from "../services/workoutService";
import { colors } from "../lib/theme";
import type { GroupTopPr, GroupWorkoutSummary, UserSearchResult } from "../lib/types";

type Props = NativeStackScreenProps<MainStackParamList, "GroupDetail">;

function memberLabel(entry: { first_name: string | null; username: string | null }): string {
  return entry.first_name ?? entry.username ?? "Quelqu'un";
}

export default function GroupDetailScreen({ route }: Props) {
  const { groupId } = route.params;
  const session = useAuthStore((state) => state.session);
  const insets = useSafeAreaInsets();

  const [ranking, setRanking] = useState<GroupRankingEntry[]>([]);
  const [topPrs, setTopPrs] = useState<GroupTopPr[]>([]);
  const [summaries, setSummaries] = useState<GroupWorkoutSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const load = useCallback(() => {
    setIsLoading(true);
    const { monday } = getWeekBounds();
    Promise.all([
      getGroupWeeklyRanking(groupId),
      getGroupTopPrs(groupId, monday),
      getGroupSummaries(groupId, monday),
    ])
      .then(([r, prs, s]) => {
        setRanking(r);
        setTopPrs(prs);
        setSummaries(s.sort((a, b) => b.date.localeCompare(a.date)));
      })
      .catch((error) =>
        Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue")
      )
      .finally(() => setIsLoading(false));
  }, [groupId]);

  useFocusEffect(load);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      setSearchResults(await searchUsersByUsername(query));
    } catch (error) {
      Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdd = async (userId: string) => {
    try {
      await addMember(groupId, userId);
      setShowAddModal(false);
      setSearchQuery("");
      setSearchResults([]);
      load();
    } catch (error) {
      Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue");
    }
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
      <View style={styles.header}>
        <Text style={styles.title}>Groupe</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Ionicons name="person-add" size={16} color={colors.accent} />
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={summaries}
        keyExtractor={(item, index) => `${item.user_id}-${item.date}-${index}`}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🏆 Top membre de la semaine</Text>
              {ranking.length === 0 ? (
                <Text style={styles.emptyText}>Aucune séance cette semaine dans le groupe.</Text>
              ) : (
                ranking.slice(0, 5).map((entry, i) => (
                  <View key={entry.user_id} style={styles.rankRow}>
                    <Text style={styles.rankPosition}>{i + 1}.</Text>
                    <Text style={styles.rankName}>{memberLabel(entry)}</Text>
                    <Text style={styles.rankValue}>{entry.sessionsCount} séance(s)</Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>💪 Top PR de la semaine</Text>
              {topPrs.length === 0 ? (
                <Text style={styles.emptyText}>Aucun record battu cette semaine.</Text>
              ) : (
                topPrs.slice(0, 5).map((pr, i) => (
                  <View key={`${pr.user_id}-${pr.exercise_name}-${i}`} style={styles.rankRow}>
                    <Text style={styles.rankName}>
                      {pr.first_name ?? "Quelqu'un"} — {pr.exercise_name}
                    </Text>
                    <Text style={styles.rankValue}>{pr.poids_max} kg</Text>
                  </View>
                ))
              )}
            </View>

            <Text style={styles.sectionTitle}>Séances récentes du groupe</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.summaryCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryName}>{memberLabel(item)}</Text>
              <Text style={styles.summaryMeta}>
                {new Date(item.date).toLocaleDateString("fr-FR", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
                {item.theme ? ` · ${item.theme}` : ""}
                {item.duration_min ? ` · ${item.duration_min} min` : ""}
                {item.global_rpe ? ` · RPE ${item.global_rpe}` : ""}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Pas encore de séance récente dans ce groupe.</Text>
        }
      />

      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ajouter un membre</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom d'utilisateur"
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
              autoCapitalize="none"
            />
            {isSearching && <ActivityIndicator color={colors.accent} />}
            {searchResults.map((u) => (
              <TouchableOpacity key={u.id} style={styles.resultRow} onPress={() => handleAdd(u.id)}>
                <Text style={styles.resultText}>
                  {u.username} {u.first_name ? `(${u.first_name})` : ""}
                </Text>
                <Ionicons name="add-circle" size={20} color={colors.accent} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowAddModal(false);
                setSearchQuery("");
                setSearchResults([]);
              }}
            >
              <Text style={styles.modalCancelText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addButtonText: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 13,
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 10,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  rankPosition: {
    color: colors.accent,
    fontWeight: "700",
    width: 18,
  },
  rankName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  rankValue: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 10,
  },
  summaryCard: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  summaryName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  summaryMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: "capitalize",
  },
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultText: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  modalCancelButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  modalCancelText: {
    color: colors.textMuted,
    fontWeight: "600",
  },
});
