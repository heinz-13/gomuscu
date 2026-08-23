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
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { MainStackParamList, MainTabParamList } from "../navigation/types";
import { useAuthStore } from "../store/authStore";
import { useProfileStore } from "../store/profileStore";
import { createGroup, listMyGroups } from "../services/groupService";
import { colors } from "../lib/theme";
import type { Group } from "../lib/types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Groupes">,
  NativeStackScreenProps<MainStackParamList>
>;

export default function GroupsListScreen({ navigation }: Props) {
  const session = useAuthStore((state) => state.session);
  const profile = useProfileStore((state) => state.profile);
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(() => {
    if (!session) return;
    setIsLoading(true);
    listMyGroups(session.user.id)
      .then(setGroups)
      .catch((error) =>
        Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue")
      )
      .finally(() => setIsLoading(false));
  }, [session]);

  useFocusEffect(load);

  const handleCreate = async () => {
    if (!session || !groupName.trim()) return;
    if (!profile?.username) {
      setShowCreateModal(false);
      Alert.alert(
        "Nom d'utilisateur requis",
        "Choisis d'abord un nom d'utilisateur dans ton profil pour pouvoir créer ou rejoindre un groupe."
      );
      return;
    }
    setIsCreating(true);
    try {
      await createGroup(session.user.id, groupName.trim());
      setGroupName("");
      setShowCreateModal(false);
      load();
    } catch (error) {
      Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsCreating(false);
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
        <Text style={styles.title}>Groupes</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={20} color={colors.accentText} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("GroupDetail", { groupId: item.id })}
          >
            <Ionicons name="people" size={20} color={colors.accent} />
            <Text style={styles.cardText}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Aucun groupe pour l'instant. Crée-en un ou fais-toi ajouter par un ami.
          </Text>
        }
      />

      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nouveau groupe</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom du groupe"
              placeholderTextColor={colors.textMuted}
              value={groupName}
              onChangeText={setGroupName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCreateModal(false)}
                disabled={isCreating}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleCreate}
                disabled={isCreating || !groupName.trim()}
              >
                {isCreating ? (
                  <ActivityIndicator color={colors.accentText} />
                ) : (
                  <Text style={styles.modalConfirmText}>Créer</Text>
                )}
              </TouchableOpacity>
            </View>
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
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  createButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  cardText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: 32,
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
    gap: 14,
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
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  modalCancelText: {
    color: colors.textMuted,
    fontWeight: "600",
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 12,
  },
  modalConfirmText: {
    color: colors.accentText,
    fontWeight: "700",
  },
});
