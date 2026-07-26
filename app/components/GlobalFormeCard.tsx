import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../lib/theme";
import { computeGlobalForme, formeLabel } from "../services/checkinService";
import type { DailyCheckin } from "../lib/types";

type Props = {
  checkin: DailyCheckin | null;
};

export default function GlobalFormeCard({ checkin }: Props) {
  if (!checkin) {
    return (
      <View style={styles.card}>
        <Ionicons name="pulse-outline" size={22} color={colors.textMuted} />
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Forme du jour</Text>
          <Text style={styles.empty}>
            Pas encore renseignée — génère une séance pour la remplir.
          </Text>
        </View>
      </View>
    );
  }

  const globalForme = computeGlobalForme(checkin);

  return (
    <View style={styles.card}>
      <Ionicons name="pulse" size={22} color={colors.accent} />
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>Forme du jour</Text>
        <Text style={styles.value}>
          {globalForme.toFixed(1)}/10 · {formeLabel(globalForme)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  empty: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
