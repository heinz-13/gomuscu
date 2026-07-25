import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../lib/theme";

type Props = {
  initialSeconds?: number;
  onDismiss: () => void;
};

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function RestTimer({ initialSeconds = 90, onDismiss }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onDismiss();
      return;
    }
    const timeout = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timeout);
  }, [secondsLeft, onDismiss]);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Ionicons name="time" size={18} color={colors.accentText} />
        <Text style={styles.time}>{formatTime(secondsLeft)}</Text>
        <Text style={styles.label}>de repos</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => setSecondsLeft((s) => Math.max(0, s - 15))}
        >
          <Text style={styles.smallButtonText}>-15s</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => setSecondsLeft((s) => s + 15)}
        >
          <Text style={styles.smallButtonText}>+15s</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={onDismiss}>
          <Text style={styles.skipButtonText}>Passer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  time: {
    color: colors.accentText,
    fontSize: 20,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  label: {
    color: colors.accentText,
    fontSize: 12,
    opacity: 0.85,
  },
  actions: {
    flexDirection: "row",
    gap: 6,
  },
  smallButton: {
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  smallButtonText: {
    color: colors.accentText,
    fontSize: 12,
    fontWeight: "700",
  },
  skipButton: {
    backgroundColor: colors.accentText,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  skipButtonText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800",
  },
});
