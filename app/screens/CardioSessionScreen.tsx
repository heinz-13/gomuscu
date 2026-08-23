import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../navigation/types";
import CardioTimer from "../components/CardioTimer";
import RPESelector from "../components/RPESelector";
import { getCardioSession, finishCardioSession } from "../services/cardioService";
import { colors } from "../lib/theme";
import type { CardioSession } from "../lib/types";

type Props = NativeStackScreenProps<MainStackParamList, "CardioSession">;

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function CardioSessionScreen({ route, navigation }: Props) {
  const { cardioSessionId } = route.params;
  const insets = useSafeAreaInsets();

  const [session, setSession] = useState<CardioSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [roundsDone, setRoundsDone] = useState(0);
  const [timerDone, setTimerDone] = useState(false);
  const [showFinishForm, setShowFinishForm] = useState(false);
  const [actualDistance, setActualDistance] = useState("");
  const [rpe, setRpe] = useState<number | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    getCardioSession(cardioSessionId)
      .then(setSession)
      .catch((error) => {
        Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue");
        navigation.popToTop();
      })
      .finally(() => setIsLoading(false));
  }, [cardioSessionId, navigation]);

  useEffect(() => {
    if (showFinishForm) return;
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [showFinishForm]);

  const handleRoundDone = () => {
    if (!session?.rounds) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (roundsDone + 1 >= session.rounds) {
      setRoundsDone(session.rounds);
      setShowFinishForm(true);
    } else {
      setRoundsDone((r) => r + 1);
    }
  };

  const handleFinish = async () => {
    if (!session) return;
    setIsFinishing(true);
    try {
      await finishCardioSession(
        session.id,
        {
          actual_duration_sec: elapsed,
          actual_distance_m: actualDistance ? Number(actualDistance) : undefined,
        },
        rpe
      );
      navigation.popToTop();
    } catch (error) {
      Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsFinishing(false);
    }
  };

  if (isLoading || !session) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (showFinishForm) {
    const askDistance = session.type === "course_libre" || session.type === "custom";
    return (
      <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.title}>Séance terminée !</Text>
        <Text style={styles.elapsedLabel}>Durée : {formatElapsed(elapsed)}</Text>

        {askDistance && (
          <>
            <Text style={styles.label}>Distance parcourue (mètres, optionnel)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={actualDistance}
              onChangeText={setActualDistance}
              placeholder="ex: 5000"
              placeholderTextColor={colors.textMuted}
            />
          </>
        )}

        <RPESelector
          label="Ça t'a tué à combien sur 10 ?"
          value={rpe}
          onChange={setRpe}
        />

        <TouchableOpacity style={styles.finishButton} onPress={handleFinish} disabled={isFinishing}>
          {isFinishing ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={styles.finishButtonText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  if (session.type === "fractionne" && session.work_sec && session.rest_sec && session.rounds) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top + 24 }]}>
        {!timerDone ? (
          <CardioTimer
            workSec={session.work_sec}
            restSec={session.rest_sec}
            rounds={session.rounds}
            onComplete={() => {
              setTimerDone(true);
              setShowFinishForm(true);
            }}
          />
        ) : (
          <ActivityIndicator color={colors.accent} />
        )}
      </View>
    );
  }

  // bronco (rounds manuels) ou course_libre/custom (chrono simple)
  return (
    <View style={[styles.container, styles.centerContent, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.elapsedTime}>{formatElapsed(elapsed)}</Text>

      {session.type === "bronco" && session.rounds && (
        <>
          <Text style={styles.roundText}>
            Répétition {roundsDone + 1}/{session.rounds}
          </Text>
          <TouchableOpacity style={styles.roundButton} onPress={handleRoundDone}>
            <Text style={styles.roundButtonText}>Répétition terminée</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.stopButton} onPress={() => setShowFinishForm(true)}>
        <Text style={styles.stopButtonText}>Terminer la séance</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  elapsedLabel: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 20,
  },
  elapsedTime: {
    fontSize: 56,
    fontWeight: "800",
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  roundText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  roundButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  roundButtonText: {
    color: colors.accentText,
    fontWeight: "700",
    fontSize: 16,
  },
  stopButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  stopButtonText: {
    color: colors.textMuted,
    fontWeight: "600",
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 6,
    marginTop: 4,
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
    marginBottom: 16,
  },
  finishButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  finishButtonText: {
    color: colors.accentText,
    fontWeight: "700",
    fontSize: 16,
  },
});
