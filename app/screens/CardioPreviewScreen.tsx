import { useEffect, useState } from "react";
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../navigation/types";
import DailyCheckinForm from "../components/DailyCheckinForm";
import { useAuthStore } from "../store/authStore";
import { useProfileStore } from "../store/profileStore";
import {
  buildCardioSession,
  commitCardioSession,
} from "../services/cardioService";
import type { CardioPlan, CardioVariant, CustomCardioParams } from "../services/cardioService";
import { getTodayCheckin, upsertTodayCheckin } from "../services/checkinService";
import type { CheckinInput } from "../services/checkinService";
import { toLocalDateString } from "../services/workoutService";
import type { CardioType, DailyCheckin } from "../lib/types";
import { colors } from "../lib/theme";

type Props = NativeStackScreenProps<MainStackParamList, "CardioPreview">;

const TYPE_LABELS: Record<CardioType, string> = {
  fractionne: "Fractionné / HIIT",
  bronco: "Bronco test",
  course_libre: "Course libre",
  custom: "Sur-mesure",
};

const TYPE_ICONS: Record<CardioType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  fractionne: "timer-outline",
  bronco: "run-fast",
  course_libre: "shoe-print",
  custom: "tune-variant",
};

const TYPES: CardioType[] = ["fractionne", "bronco", "course_libre", "custom"];

export default function CardioPreviewScreen({ navigation, route }: Props) {
  const session = useAuthStore((state) => state.session);
  const profile = useProfileStore((state) => state.profile);
  const insets = useSafeAreaInsets();

  const targetDate = route.params?.targetDate;
  const isToday = !targetDate || targetDate === toLocalDateString(new Date());

  const [isLoading, setIsLoading] = useState(true);
  const [checkin, setCheckin] = useState<DailyCheckin | null>(null);
  const [isSubmittingCheckin, setIsSubmittingCheckin] = useState(false);
  const [selectedType, setSelectedType] = useState<CardioType | null>(null);
  const [variant, setVariant] = useState<CardioVariant>("30-30");
  const [customDistance, setCustomDistance] = useState("");
  const [customRounds, setCustomRounds] = useState("");
  const [customRecovery, setCustomRecovery] = useState("");
  const [plan, setPlan] = useState<CardioPlan | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);

  useEffect(() => {
    if (!session) return;
    (isToday ? getTodayCheckin(session.user.id) : Promise.resolve(null))
      .then(setCheckin)
      .catch((error) =>
        Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue")
      )
      .finally(() => setIsLoading(false));
  }, [session, isToday]);

  const handleSubmitCheckin = async (input: CheckinInput) => {
    if (!session) return;
    setIsSubmittingCheckin(true);
    try {
      setCheckin(await upsertTodayCheckin(session.user.id, input));
    } catch (error) {
      Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsSubmittingCheckin(false);
    }
  };

  const generate = (type: CardioType, v?: CardioVariant, customParams?: CustomCardioParams) => {
    if (!profile) return;
    setPlan(buildCardioSession(profile, type, v ?? null, checkin, customParams));
  };

  const handleSelectType = (type: CardioType) => {
    setSelectedType(type);
    if (type === "fractionne") generate(type, variant);
    else if (type !== "custom") generate(type);
  };

  const handleConfirmCustom = () => {
    generate("custom", undefined, {
      target_distance_m: customDistance ? Number(customDistance) : undefined,
      rounds: customRounds ? Number(customRounds) : undefined,
      rest_sec: customRecovery ? Number(customRecovery) : undefined,
    });
  };

  const handleConfirm = async () => {
    if (!session || !plan) return;
    setIsCommitting(true);
    try {
      const cardioSession = await commitCardioSession(session.user.id, plan, targetDate);
      navigation.replace("CardioSession", { cardioSessionId: cardioSession.id });
    } catch (error) {
      Alert.alert("Erreur", error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsCommitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (isToday && !checkin) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <DailyCheckinForm onSubmit={handleSubmitCheckin} isSubmitting={isSubmittingCheckin} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>J'ai eu peur, j'annule</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!selectedType) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Quel cardio aujourd'hui ?</Text>
        <View style={styles.grid}>
          {TYPES.map((type) => (
            <TouchableOpacity key={type} style={styles.card} onPress={() => handleSelectType(type)}>
              <MaterialCommunityIcons name={TYPE_ICONS[type]} size={32} color={colors.accent} />
              <Text style={styles.cardText}>{TYPE_LABELS[type]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>J'ai eu peur, j'annule</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (selectedType === "fractionne" && !plan) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>30-30 ou Tabata ?</Text>
        {(["30-30", "tabata"] as CardioVariant[]).map((v) => (
          <TouchableOpacity
            key={v}
            style={styles.variantRow}
            onPress={() => {
              setVariant(v);
              generate("fractionne", v);
            }}
          >
            <Text style={styles.variantText}>
              {v === "30-30" ? "30-30 (30s effort / 30s repos)" : "Tabata (20s effort / 10s repos)"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  if (selectedType === "custom" && !plan) {
    return (
      <ScrollView
        style={[styles.container, { paddingTop: insets.top + 16 }]}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <Text style={styles.title}>Ton protocole sur-mesure</Text>
        <Text style={styles.label}>Distance par répétition (mètres, optionnel)</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={customDistance}
          onChangeText={setCustomDistance}
          placeholder="ex: 400"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.label}>Nombre de répétitions</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={customRounds}
          onChangeText={setCustomRounds}
          placeholder="ex: 6"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.label}>Temps de récupération (secondes)</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={customRecovery}
          onChangeText={setCustomRecovery}
          placeholder="ex: 90"
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmCustom}
          disabled={!customRounds}
        >
          <Text style={styles.confirmButtonText}>Continuer</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (!plan) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>{TYPE_LABELS[selectedType]}</Text>
      <View style={styles.planCard}>
        {plan.rounds != null && (
          <Text style={styles.planLine}>
            <Ionicons name="repeat" size={16} color={colors.accent} /> {plan.rounds} rounds
          </Text>
        )}
        {plan.work_sec != null && (
          <Text style={styles.planLine}>
            {plan.work_sec}s effort / {plan.rest_sec}s récup
          </Text>
        )}
        {plan.target_duration_min != null && (
          <Text style={styles.planLine}>Durée cible : {plan.target_duration_min} min</Text>
        )}
        {plan.target_distance_m != null && (
          <Text style={styles.planLine}>Distance par répétition : {plan.target_distance_m} m</Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>J'ai eu peur, j'annule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} disabled={isCommitting}>
          {isCommitting ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={styles.confirmButtonText}>GO, c'est parti</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "Poppins_800ExtraBold",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "47%",
    aspectRatio: 1.1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  cardText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    color: colors.textPrimary,
    textAlign: "center",
  },
  variantRow: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  variantText: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 6,
    marginTop: 12,
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
  },
  planCard: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 12,
    padding: 18,
    gap: 8,
    marginBottom: 16,
  },
  planLine: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
  },
  actions: {
    marginTop: "auto",
    paddingVertical: 16,
    gap: 10,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 6,
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  confirmButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  confirmButtonText: {
    color: colors.accentText,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
});
