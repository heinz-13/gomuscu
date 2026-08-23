import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { colors } from "../lib/theme";

type Props = {
  workSec: number;
  restSec: number;
  rounds: number;
  onComplete: () => void;
};

type Phase = "work" | "rest";

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function CardioTimer({ workSec, restSec, rounds, onComplete }: Props) {
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<Phase>("work");
  const [secondsLeft, setSecondsLeft] = useState(workSec);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    if (secondsLeft <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (phase === "work") {
        setPhase("rest");
        setSecondsLeft(restSec);
        return;
      }

      if (round >= rounds) {
        onComplete();
        return;
      }

      setRound((r) => r + 1);
      setPhase("work");
      setSecondsLeft(workSec);
      return;
    }

    const timeout = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timeout);
  }, [secondsLeft, isPaused, phase, round, rounds, workSec, restSec, onComplete]);

  const textColor = phase === "work" ? colors.accentText : colors.textPrimary;

  return (
    <View style={[styles.container, phase === "work" ? styles.work : styles.rest]}>
      <Text style={[styles.phaseLabel, { color: textColor }]}>
        {phase === "work" ? "EFFORT" : "RÉCUP"}
      </Text>
      <Text style={[styles.time, { color: textColor }]}>{formatTime(secondsLeft)}</Text>
      <Text style={[styles.round, { color: textColor }]}>
        Round {round}/{rounds}
      </Text>
      <TouchableOpacity style={styles.pauseButton} onPress={() => setIsPaused((p) => !p)}>
        <Text style={[styles.pauseButtonText, { color: textColor }]}>
          {isPaused ? "Reprendre" : "Pause"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  work: {
    backgroundColor: colors.accent,
  },
  rest: {
    backgroundColor: colors.surfaceAlt,
  },
  phaseLabel: {
    color: colors.accentText,
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 2,
  },
  time: {
    color: colors.accentText,
    fontWeight: "800",
    fontSize: 56,
    fontVariant: ["tabular-nums"],
  },
  round: {
    color: colors.accentText,
    fontSize: 15,
    fontWeight: "600",
    opacity: 0.9,
  },
  pauseButton: {
    marginTop: 12,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  pauseButtonText: {
    color: colors.accentText,
    fontWeight: "700",
  },
});
