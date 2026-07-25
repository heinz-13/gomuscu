import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../lib/theme";

type Props = {
  value: number | null;
  onChange: (value: number) => void;
  label?: string;
  compact?: boolean;
};

const SCALE = Array.from({ length: 10 }, (_, i) => i + 1);

export default function RPESelector({ value, onChange, label, compact }: Props) {
  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        {SCALE.map((n) => {
          const active = value === n;
          return (
            <TouchableOpacity
              key={n}
              style={[
                styles.button,
                compact && styles.buttonCompact,
                active && styles.buttonActive,
              ]}
              onPress={() => onChange(n)}
            >
              <Text style={[styles.buttonText, active && styles.buttonTextActive]}>
                {n}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  buttonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  buttonText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  buttonTextActive: {
    color: colors.accentText,
    fontWeight: "700",
  },
});
