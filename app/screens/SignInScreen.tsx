import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../navigation/types";
import { signInWithEmail, signInWithGoogle } from "../services/authService";
import { colors, APP_NAME } from "../lib/theme";

type Props = NativeStackScreenProps<AuthStackParamList, "SignIn">;

export default function SignInScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleSignIn = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await signInWithEmail(email.trim(), password);
    } catch (error) {
      Alert.alert(
        "Raté",
        error instanceof Error ? error.message : "Erreur inconnue"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
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
    <View style={styles.container}>
      <View style={styles.brand}>
        <Ionicons name="barbell" size={36} color={colors.accent} />
        <Text style={styles.brandName}>{APP_NAME}</Text>
      </View>
      <Text style={styles.title}>Bon retour, champion</Text>
      <Text style={styles.subtitle}>T'as encore zappé hier, hein ?</Text>

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
        placeholder="Mot de passe"
        placeholderTextColor={colors.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        onPress={handleSignIn}
        disabled={!canSubmit || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.accentText} />
        ) : (
          <Text style={styles.buttonText}>Se connecter</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleGoogleSignIn}
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Text style={styles.googleButtonText}>Continuer avec Google</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
        <Text style={styles.link}>Pas encore de compte ? Aucune excuse valable</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 18,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
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
    color: colors.textPrimary,
  },
  link: {
    textAlign: "center",
    marginTop: 20,
    color: colors.textSecondary,
  },
});
