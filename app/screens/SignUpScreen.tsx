import { useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../navigation/types";
import { signInWithGoogle, signUpWithEmail } from "../services/authService";
import { colors, APP_NAME } from "../lib/theme";

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;

export default function SignUpScreen({ navigation }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const isBirthDateValid = /^\d{4}-\d{2}-\d{2}$/.test(birthDate);
  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    isBirthDateValid &&
    email.trim().length > 0 &&
    password.length >= 6;

  const handleSignUp = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const result = await signUpWithEmail({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate,
      });

      if (!result.session) {
        Alert.alert(
          "Check ta boîte mail",
          "On t'a envoyé un lien de confirmation. Clique dessus, puis reviens ici te connecter — on ne mord pas."
        );
      }
    } catch (error) {
      Alert.alert(
        "Raté",
        error instanceof Error ? error.message : "Erreur inconnue"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      Alert.alert(
        "Google boude",
        error instanceof Error ? error.message : "Erreur inconnue"
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.brand}>
        <Ionicons name="barbell" size={36} color={colors.accent} />
        <Text style={styles.brandName}>{APP_NAME}</Text>
      </View>
      <Text style={styles.title}>Nouvelle recrue</Text>
      <Text style={styles.subtitle}>
        On va te secouer un peu. C'est pour ton bien.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Prénom"
        placeholderTextColor={colors.textMuted}
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Nom"
        placeholderTextColor={colors.textMuted}
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Date de naissance (AAAA-MM-JJ)"
        placeholderTextColor={colors.textMuted}
        value={birthDate}
        onChangeText={setBirthDate}
        keyboardType="numbers-and-punctuation"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe (6 caractères min.)"
        placeholderTextColor={colors.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        onPress={handleSignUp}
        disabled={!canSubmit || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.accentText} />
        ) : (
          <Text style={styles.buttonText}>C'est parti, plus d'excuses</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleGoogleSignUp}
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Text style={styles.googleButtonText}>
            Continuer avec Google (la flemme, on comprend)
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
        <Text style={styles.link}>Déjà un compte ? Retour au front</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.bg,
  },
  brand: {
    alignItems: "center",
    marginBottom: 24,
    gap: 6,
  },
  brandName: {
    color: colors.textPrimary,
    fontWeight: "800",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 18,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: "Poppins_800ExtraBold",
    marginBottom: 4,
    textAlign: "center",
    color: colors.textPrimary,
  },
  subtitle: {
    textAlign: "center",
    color: colors.textMuted,
    marginBottom: 24,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: colors.surfaceAlt,
  },
  buttonText: {
    color: colors.accentText,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
  },
  googleButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
    color: colors.textPrimary,
  },
  link: {
    textAlign: "center",
    marginTop: 20,
    color: colors.textSecondary,
  },
});
