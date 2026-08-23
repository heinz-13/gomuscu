import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import RPESelector from "./RPESelector";
import type { WorkoutSet } from "../lib/types";
import { colors } from "../lib/theme";

type Props = {
  set: WorkoutSet;
  progress: { current: number; total: number };
  previous?: { reps: number; weight_kg: number };
  onChange: (
    patch: Partial<Pick<WorkoutSet, "reps" | "weight_kg" | "rpe" | "completed">>
  ) => void;
  onDelete: () => void;
};

export default function SetRow({ set, progress, previous, onChange, onDelete }: Props) {
  const [reps, setReps] = useState(set.reps != null ? String(set.reps) : "");
  const [weight, setWeight] = useState(set.weight_kg != null ? String(set.weight_kg) : "");

  const commitReps = () => {
    const value = parseInt(reps, 10);
    if (!Number.isNaN(value) && value !== set.reps) onChange({ reps: value });
  };

  const commitWeight = () => {
    const value = Number(weight.replace(",", "."));
    if (!Number.isNaN(value) && value !== set.weight_kg) onChange({ weight_kg: value });
  };

  const currentReps = () => {
    const parsed = parseInt(reps, 10);
    return Number.isNaN(parsed) ? set.reps : parsed;
  };

  const currentWeight = () => {
    const parsed = Number(weight.replace(",", "."));
    return Number.isNaN(parsed) ? set.weight_kg : parsed;
  };

  const stepReps = (delta: number) => {
    const next = Math.max(0, currentReps() + delta);
    setReps(String(next));
    onChange({ reps: next });
  };

  const stepWeight = (delta: number) => {
    const next = Math.max(0, Math.round((currentWeight() + delta) * 2) / 2);
    setWeight(String(next));
    onChange({ weight_kg: next });
  };

  const handleValidate = () => {
    commitReps();
    commitWeight();
    onChange({ completed: true });
  };

  return (
    <View style={styles.row}>
      <View style={styles.topRow}>
        <Text style={styles.progress}>
          Série {progress.current}/{progress.total}
        </Text>
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Ionicons name="trash-outline" size={14} color={colors.danger} />
          <Text style={styles.delete}>Virer</Text>
        </TouchableOpacity>
      </View>

      {previous && (
        <Text style={styles.previous}>
          Dernière fois : {previous.weight_kg} kg × {previous.reps}
        </Text>
      )}

      <View style={styles.inputsRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Reps</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity style={styles.stepButton} onPress={() => stepReps(-1)}>
              <Text style={styles.stepButtonText}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={reps}
              onChangeText={setReps}
              onBlur={commitReps}
              keyboardType="number-pad"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity style={styles.stepButton} onPress={() => stepReps(1)}>
              <Text style={styles.stepButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Poids (kg)</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity style={styles.stepButton} onPress={() => stepWeight(-2.5)}>
              <Text style={styles.stepButtonText}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              onBlur={commitWeight}
              keyboardType="decimal-pad"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity style={styles.stepButton} onPress={() => stepWeight(2.5)}>
              <Text style={styles.stepButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <RPESelector
        compact
        value={set.rpe}
        onChange={(rpe) => onChange({ rpe })}
        label="Ça t'a tué à combien sur 10 ?"
      />

      <TouchableOpacity style={styles.validateButton} onPress={handleValidate}>
        <Ionicons name="checkmark-circle" size={20} color={colors.accentText} />
        <Text style={styles.validateButtonText}>Valider cette série</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progress: {
    fontWeight: "800",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 15,
    color: colors.textPrimary,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  delete: {
    color: colors.danger,
    fontSize: 13,
  },
  previous: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: -4,
  },
  inputsRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepButton: {
    width: 30,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  stepButtonText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    lineHeight: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: "center",
  },
  validateButton: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  validateButtonText: {
    color: colors.accentText,
    fontWeight: "800",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 15,
  },
});
