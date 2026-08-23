import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import RPESelector from "./RPESelector";
import { colors } from "../lib/theme";
import type { CheckinInput } from "../services/checkinService";

type Props = {
  onSubmit: (input: CheckinInput) => void;
  isSubmitting: boolean;
};

const FIELDS: { key: keyof CheckinInput; label: string }[] = [
  { key: "fatigue", label: "Fatigue générale (1 = pas fatigué, 10 = très fatigué)" },
  { key: "sommeil", label: "Sommeil la veille (1 = mauvais, 10 = excellent)" },
  { key: "morale", label: "Morale (1 = mauvaise, 10 = excellente)" },
  { key: "motivation", label: "Motivation (1 = aucune, 10 = à fond)" },
  { key: "haut_du_corps", label: "Courbatures haut du corps (1 = frais, 10 = très courbaturé)" },
  { key: "bas_du_corps", label: "Courbatures bas du corps (1 = frais, 10 = très courbaturé)" },
];

export default function DailyCheckinForm({ onSubmit, isSubmitting }: Props) {
  const [values, setValues] = useState<Partial<CheckinInput>>({});

  const isComplete = FIELDS.every((f) => values[f.key] != null);

  const handleSubmit = () => {
    if (!isComplete) return;
    onSubmit(values as CheckinInput);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ta forme du jour ?</Text>
      <Text style={styles.subtitle}>
        Deux minutes pour que je génère une séance vraiment adaptée à aujourd'hui.
      </Text>

      <ScrollView contentContainerStyle={styles.list}>
        {FIELDS.map((field) => (
          <View key={field.key} style={styles.field}>
            <RPESelector
              compact
              label={field.label}
              value={values[field.key] ?? null}
              onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
            />
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.submitButton, !isComplete && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!isComplete || isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? "Un instant..." : "C'est parti"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "Poppins_800ExtraBold",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
  },
  list: {
    paddingBottom: 16,
    gap: 18,
  },
  field: {
    marginBottom: 2,
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: colors.accentText,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
});
