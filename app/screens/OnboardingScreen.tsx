import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import OnboardingStepChoice from "../components/OnboardingStepChoice";
import { useAuthStore } from "../store/authStore";
import { useProfileStore } from "../store/profileStore";
import { completeOnboarding } from "../services/profileService";
import { colors } from "../lib/theme";
import type {
  Day,
  EquipmentLocation,
  ExperienceLevel,
  Frequency,
  HomeEquipment,
  Objective,
  SensitiveZone,
} from "../lib/types";

const OBJECTIVE_OPTIONS: { value: Objective; label: string }[] = [
  { value: "perte_de_poids", label: "Perte de poids" },
  { value: "entretien", label: "Entretien du corps" },
  { value: "performance", label: "Performance / prise de masse-force" },
];

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "0", label: "0 séance / semaine (aïe)" },
  { value: "1-2", label: "1 à 2 séances / semaine" },
  { value: "3-4", label: "3 à 4 séances / semaine" },
  { value: "5+", label: "5 séances ou plus / semaine" },
];

const LOCATION_OPTIONS: { value: EquipmentLocation; label: string }[] = [
  { value: "salle_de_sport", label: "Salle de sport" },
  { value: "domicile", label: "Domicile" },
];

const HOME_EQUIPMENT_OPTIONS: { value: HomeEquipment; label: string }[] = [
  { value: "halteres", label: "Haltères" },
  { value: "elastiques", label: "Élastiques" },
  { value: "poids_du_corps", label: "Poids du corps" },
  { value: "banc", label: "Banc" },
];

const DAY_OPTIONS: { value: Day; label: string }[] = [
  { value: "lun", label: "Lundi" },
  { value: "mar", label: "Mardi" },
  { value: "mer", label: "Mercredi" },
  { value: "jeu", label: "Jeudi" },
  { value: "ven", label: "Vendredi" },
  { value: "sam", label: "Samedi" },
  { value: "dim", label: "Dimanche" },
];

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

const IDENTITY_TITLE = "C'est qui, toi ?";

const BASE_STEP_TITLES = [
  "C'est quoi le plan, chef ?",
  "Sois honnête, pas comme d'habitude",
  "Salle ou salon, on ne juge pas (un peu)",
  "Quels jours tu vas VRAIMENT venir ?",
  "Les chiffres qui font mal",
  "Ton niveau ?",
  "Des zones sensibles ?",
];

export default function OnboardingScreen() {
  const session = useAuthStore((state) => state.session);
  const profile = useProfileStore((state) => state.profile);
  const setProfile = useProfileStore((state) => state.setProfile);

  // Les comptes créés via Google n'ont pas de prénom/nom/date de naissance
  // (Google ne fournit pas ces champs dans notre format) — on les récupère ici.
  const needsIdentity = !profile?.first_name || !profile?.last_name || !profile?.birth_date;
  const identityOffset = needsIdentity ? 1 : 0;
  const STEP_TITLES = needsIdentity ? [IDENTITY_TITLE, ...BASE_STEP_TITLES] : BASE_STEP_TITLES;
  const STEP_COUNT = STEP_TITLES.length;

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [objective, setObjective] = useState<Objective | null>(null);
  const [frequency, setFrequency] = useState<Frequency | null>(null);
  const [location, setLocation] = useState<EquipmentLocation | null>(null);
  const [homeEquipment, setHomeEquipment] = useState<HomeEquipment[]>([]);
  const [preferredDays, setPreferredDays] = useState<Day[]>([]);
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [avoidZones, setAvoidZones] = useState<SensitiveZone[]>([]);

  const toggleHomeEquipment = (value: string) => {
    const v = value as HomeEquipment;
    setHomeEquipment((prev) =>
      prev.includes(v) ? prev.filter((item) => item !== v) : [...prev, v]
    );
  };

  const toggleDay = (value: string) => {
    const v = value as Day;
    setPreferredDays((prev) =>
      prev.includes(v) ? prev.filter((item) => item !== v) : [...prev, v]
    );
  };

  const toggleZone = (value: string) => {
    const v = value as SensitiveZone;
    setAvoidZones((prev) =>
      prev.includes(v) ? prev.filter((item) => item !== v) : [...prev, v]
    );
  };

  const canProceed = (): boolean => {
    if (needsIdentity && step === 0) {
      return (
        firstName.trim().length > 0 &&
        lastName.trim().length > 0 &&
        /^\d{4}-\d{2}-\d{2}$/.test(birthDate)
      );
    }
    switch (step - identityOffset) {
      case 0:
        return objective !== null;
      case 1:
        return frequency !== null;
      case 2:
        return (
          location !== null &&
          (location === "salle_de_sport" || homeEquipment.length > 0)
        );
      case 3:
        return preferredDays.length > 0;
      case 4: {
        const weight = Number(weightKg.replace(",", "."));
        const height = Number(heightCm.replace(",", "."));
        return (
          Number.isFinite(weight) &&
          weight > 0 &&
          weight < 400 &&
          Number.isFinite(height) &&
          height > 0 &&
          height < 260
        );
      }
      case 5:
        return experienceLevel !== null;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (!canProceed()) return;
    if (step < STEP_COUNT - 1) {
      setStep((s) => s + 1);
      return;
    }
    if (!session) return;

    setIsSubmitting(true);
    try {
      const updated = await completeOnboarding(session.user.id, {
        ...(needsIdentity
          ? {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              birth_date: birthDate,
            }
          : {}),
        objective,
        current_frequency: frequency,
        equipment_location: location,
        home_equipment: location === "domicile" ? homeEquipment : null,
        preferred_days: preferredDays,
        weight_kg: Number(weightKg.replace(",", ".")),
        height_cm: Number(heightCm.replace(",", ".")),
        experience_level: experienceLevel,
        avoid_zones: avoidZones,
      });
      setProfile(updated);
    } catch (error) {
      Alert.alert(
        "Bug",
        error instanceof Error ? error.message : "Erreur inconnue"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.progress}>
        Étape {step + 1} / {STEP_COUNT}
      </Text>

      {needsIdentity && step === 0 && (
        <>
          <Text style={styles.title}>{STEP_TITLES[0]}</Text>
          <TextInput
            style={styles.input}
            placeholder="Prénom"
            placeholderTextColor={colors.textMuted}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Nom"
            placeholderTextColor={colors.textMuted}
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Date de naissance (AAAA-MM-JJ)"
            placeholderTextColor={colors.textMuted}
            value={birthDate}
            onChangeText={setBirthDate}
            keyboardType="numbers-and-punctuation"
          />
        </>
      )}

      {step - identityOffset === 0 && (
        <>
          <Text style={styles.title}>{STEP_TITLES[step]}</Text>
          <OnboardingStepChoice
            options={OBJECTIVE_OPTIONS}
            selected={objective ?? ""}
            onSelect={(v) => setObjective(v as Objective)}
          />
        </>
      )}

      {step - identityOffset === 1 && (
        <>
          <Text style={styles.title}>{STEP_TITLES[step]}</Text>
          <OnboardingStepChoice
            options={FREQUENCY_OPTIONS}
            selected={frequency ?? ""}
            onSelect={(v) => setFrequency(v as Frequency)}
          />
        </>
      )}

      {step - identityOffset === 2 && (
        <>
          <Text style={styles.title}>{STEP_TITLES[step]}</Text>
          <OnboardingStepChoice
            options={LOCATION_OPTIONS}
            selected={location ?? ""}
            onSelect={(v) => setLocation(v as EquipmentLocation)}
          />
          {location === "domicile" && (
            <>
              <Text style={styles.subtitle}>Quel équipement as-tu chez toi ?</Text>
              <OnboardingStepChoice
                options={HOME_EQUIPMENT_OPTIONS}
                selected={homeEquipment}
                multi
                onSelect={toggleHomeEquipment}
              />
            </>
          )}
        </>
      )}

      {step - identityOffset === 3 && (
        <>
          <Text style={styles.title}>{STEP_TITLES[step]}</Text>
          <OnboardingStepChoice
            options={DAY_OPTIONS}
            selected={preferredDays}
            multi
            onSelect={toggleDay}
          />
        </>
      )}

      {step - identityOffset === 4 && (
        <>
          <Text style={styles.title}>{STEP_TITLES[step]}</Text>
          <TextInput
            style={styles.input}
            placeholder="Poids (kg)"
            placeholderTextColor={colors.textMuted}
            value={weightKg}
            onChangeText={setWeightKg}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Taille (cm)"
            placeholderTextColor={colors.textMuted}
            value={heightCm}
            onChangeText={setHeightCm}
            keyboardType="decimal-pad"
          />
        </>
      )}

      {step - identityOffset === 5 && (
        <>
          <Text style={styles.title}>{STEP_TITLES[step]}</Text>
          <OnboardingStepChoice
            options={LEVEL_OPTIONS}
            selected={experienceLevel ?? ""}
            onSelect={(v) => setExperienceLevel(v as ExperienceLevel)}
          />
        </>
      )}

      {step - identityOffset === 6 && (
        <>
          <Text style={styles.title}>{STEP_TITLES[step]}</Text>
          <Text style={styles.subtitle}>
            Optionnel — coche ce qui te fait grimacer, on évitera.
          </Text>
          <OnboardingStepChoice
            options={ZONE_OPTIONS}
            selected={avoidZones}
            multi
            onSelect={toggleZone}
          />
        </>
      )}

      <View style={styles.actions}>
        {step > 0 && (
          <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
            <Text style={styles.secondaryButtonText}>Retour</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, !canProceed() && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!canProceed() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={styles.buttonText}>
              {step === STEP_COUNT - 1 ? "Go, au boulot" : "Suite"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.bg,
    gap: 16,
  },
  progress: {
    textAlign: "center",
    color: colors.textMuted,
    marginBottom: 8,
    fontWeight: "600",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 4,
    color: colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: colors.surfaceAlt,
  },
  buttonText: {
    color: colors.accentText,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});
