import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../lib/theme";

type Option = { value: string; label: string };

type Props = {
  options: Option[];
  selected: string | string[];
  multi?: boolean;
  onSelect: (value: string) => void;
};

export default function OnboardingStepChoice({
  options,
  selected,
  multi = false,
  onSelect,
}: Props) {
  const isSelected = (value: string) =>
    multi ? (selected as string[]).includes(value) : selected === value;

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const active = isSelected(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.option, active && styles.optionActive]}
            onPress={() => onSelect(option.value)}
          >
            <Text style={[styles.optionText, active && styles.optionTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  optionActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  optionText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  optionTextActive: {
    color: colors.accentText,
    fontWeight: "700",
  },
});
