import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import OnboardingStepChoice from "../components/OnboardingStepChoice";
import { useProfileStore } from "../store/profileStore";
import { useAuthStore } from "../store/authStore";
import { signOut } from "../services/authService";
import { updateProfile, updateUsername } from "../services/profileService";
import { deleteAccount } from "../services/accountService";
import { colors } from "../lib/theme";
import type { ExperienceLevel, SensitiveZone } from "../lib/types";

const OBJECTIVE_LABELS: Record<string, string> = {
  perte_de_poids: "Perte de poids",
  entretien: "Entretien du corps",
  performance: "Performance / prise de masse-force",
};

const LEVEL_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: "debutant", label: "Débutant" },
  { value: "intermediaire", label: "Intermédiaire" },
  { value: "avance", label: "Avancé" },
];

const ZONE_OPTIONS: { value: SensitiveZone; label: string }[] = [
  { value: "epaules", label: "Épaules" },
  { value: "genoux", label: "Genoux" },
  { value: "dos_bas", label: "Bas du dos" },
  { value: "poignets", label: "Poignets" },
];

export default function ProfileScreen() {
  const session = useAuthStore((state) => state.session);
  const insets = useSafeAreaInsets();
  const profile = useProfileStore((state) => state.profile);
  const setProfile = useProfileStore((state) => state.setProfile);

  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(
    profile?.experience_level ?? null
  );
  const [avoidZones, setAvoidZones] = useState<SensitiveZone[]>(profile?.avoid_zones ?? []);
  const [username, setUsername] = useState(profile?.username ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!profile) return null;

  const toggleZone = (value: string) => {
    const v = value as SensitiveZone;
    setAvoidZones((prev) =>
      prev.includes(v) ? prev.filter((item) => item !== v) : [...prev, v]
    );
  };

  const usernameChanged = username.trim() !== (profile.username ?? "");
  const isDirty =
    experienceLevel !== profile.experience_level ||
    avoidZones.length !== (profile.avoid_zones ?? []).length ||
    avoidZones.some((z) => !(profile.avoid_zones ?? []).includes(z)) ||
    usernameChanged;

  const handleSave = async () => {
    if (!session) return;
    setIsSaving(true);
    try {
      let updated = await updateProfile(session.user.id, {
        experience_level: experienceLevel,
        avoid_zones: avoidZones,
      });
      if (usernameChanged) {
        updated = await updateUsername(session.user.id, username.trim());
      }
      setProfile(updated);
    } catch (error) {
      Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      "Supprimer ton compte ?",
      "Toutes tes données (profil, séances, photos) seront définitivement supprimées. Impossible à annuler.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer définitivement",
          style: "destructive",
          onPress: handleDeleteAccount,
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      await signOut();
    } catch (error) {
      Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue");
      setIsDeleting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
    >
      <Text style={styles.title}>Profil</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={28} color={colors.accent} />
        </View>
        <View>
          <Text style={styles.name}>
            {profile.first_name} {profile.last_name}
          </Text>
          <Text style={styles.email}>{profile.email}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Row label="Objectif" value={OBJECTIVE_LABELS[profile.objective ?? ""] ?? "-"} />
        <Row label="Poids" value={profile.weight_kg ? `${profile.weight_kg} kg` : "-"} />
        <Row label="Taille" value={profile.height_cm ? `${profile.height_cm} cm` : "-"} />
        <Row
          label="Abonnement"
          value={profile.is_premium ? "Premium (le vrai)" : "Gratuit (radin)"}
          valueColor={profile.is_premium ? colors.premium : undefined}
        />
      </View>

      <View style={styles.choiceGroup}>
        <Text style={styles.sectionTitle}>Nom d'utilisateur</Text>
        <Text style={styles.helperText}>
          Permet à tes amis de te retrouver pour créer ou rejoindre un groupe.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="ex: mathieu75"
          placeholderTextColor={colors.textMuted}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.choiceGroup}>
        <Text style={styles.sectionTitle}>Ton niveau</Text>
        <OnboardingStepChoice
          options={LEVEL_OPTIONS}
          selected={experienceLevel ?? ""}
          onSelect={(v) => setExperienceLevel(v as ExperienceLevel)}
        />
      </View>

      <View style={styles.choiceGroup}>
        <Text style={styles.sectionTitle}>Zones sensibles</Text>
        <OnboardingStepChoice
          options={ZONE_OPTIONS}
          selected={avoidZones}
          multi
          onSelect={toggleZone}
        />
      </View>

      {isDirty && (
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => signOut()}
        disabled={isDeleting}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={styles.logoutButtonText}>Se tirer (temporairement)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteAccountButton}
        onPress={confirmDeleteAccount}
        disabled={isDeleting}
      >
        <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
        <Text style={styles.deleteAccountButtonText}>
          {isDeleting ? "Suppression en cours..." : "Supprimer mon compte définitivement"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
    color: colors.textPrimary,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  email: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  rowValue: {
    fontWeight: "600",
    fontSize: 14,
    color: colors.textPrimary,
  },
  choiceGroup: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 10,
  },
  helperText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: -6,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  saveButtonText: {
    color: colors.accentText,
    fontWeight: "700",
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  logoutButtonText: {
    color: colors.danger,
    fontWeight: "600",
  },
  deleteAccountButton: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  deleteAccountButtonText: {
    color: colors.textMuted,
    fontWeight: "500",
    fontSize: 13,
  },
});
