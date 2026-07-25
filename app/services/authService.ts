import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export type SignUpParams = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: string; // ISO format YYYY-MM-DD
};

export async function signUpWithEmail({
  email,
  password,
  firstName,
  lastName,
  birthDate,
}: SignUpParams) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        birth_date: birthDate,
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const redirectTo = makeRedirectUri({ scheme: "muscuapp", path: "auth" });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(
    data.url,
    redirectTo
  );

  if (result.type !== "success" || !result.url) {
    throw new Error("Connexion Google annulée");
  }

  const params = new URLSearchParams(result.url.split("#")[1] ?? "");
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) {
    throw new Error("Réponse Google invalide : tokens manquants");
  }

  const { data: sessionData, error: sessionError } =
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

  if (sessionError) throw sessionError;
  return sessionData;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
