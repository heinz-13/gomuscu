import { StyleSheet, Text, View } from "react-native";
import { colors } from "../lib/theme";

type Props = {
  label: string;
  tone?: "default" | "accent" | "highlight";
};

export default function Chip({ label, tone = "default" }: Props) {
  return (
    <View style={[styles.chip, tone === "accent" && styles.chipAccent, tone === "highlight" && styles.chipHighlight]}>
      <Text
        style={[
          styles.text,
          tone === "accent" && styles.textAccent,
          tone === "highlight" && styles.textHighlight,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAccent: {
    backgroundColor: "rgba(255, 122, 0, 0.12)",
    borderColor: colors.accent,
  },
  chipHighlight: {
    backgroundColor: "rgba(139, 92, 246, 0.14)",
    borderColor: colors.highlight,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
    color: colors.textSecondary,
  },
  textAccent: {
    color: colors.accent,
  },
  textHighlight: {
    color: colors.highlight,
  },
});
