import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import type { AuthStackParamList, MainStackParamList, MainTabParamList } from "./types";
import { useAuthStore } from "../store/authStore";
import { useProfileStore } from "../store/profileStore";
import SignInScreen from "../screens/SignInScreen";
import SignUpScreen from "../screens/SignUpScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import HomeScreen from "../screens/HomeScreen";
import HistoryScreen from "../screens/HistoryScreen";
import ProgressScreen from "../screens/ProgressScreen";
import ProfileScreen from "../screens/ProfileScreen";
import WorkoutSessionScreen from "../screens/WorkoutSessionScreen";
import WorkoutDetailScreen from "../screens/WorkoutDetailScreen";
import ExercisePickerScreen from "../screens/ExercisePickerScreen";
import WorkoutPreviewScreen from "../screens/WorkoutPreviewScreen";
import GroupsListScreen from "../screens/GroupsListScreen";
import GroupDetailScreen from "../screens/GroupDetailScreen";
import CardioPreviewScreen from "../screens/CardioPreviewScreen";
import CardioSessionScreen from "../screens/CardioSessionScreen";
import { colors } from "../lib/theme";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();
const MainStackNav = createNativeStackNavigator<MainStackParamList>();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.accent,
  },
};

const TAB_ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: "barbell",
  Historique: "time",
  Progression: "stats-chart",
  Groupes: "people",
  Profil: "person-circle",
};

function Spinner() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.bg,
      }}
    >
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
    >
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabsNavigator() {
  return (
    <MainTabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name as keyof MainTabParamList]} size={size} color={color} />
        ),
      })}
    >
      <MainTabs.Screen name="Home" component={HomeScreen} />
      <MainTabs.Screen name="Historique" component={HistoryScreen} />
      <MainTabs.Screen name="Progression" component={ProgressScreen} />
      <MainTabs.Screen name="Groupes" component={GroupsListScreen} />
      <MainTabs.Screen name="Profil" component={ProfileScreen} />
    </MainTabs.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStackNav.Navigator
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
    >
      <MainStackNav.Screen name="MainTabs" component={MainTabsNavigator} />
      <MainStackNav.Screen name="WorkoutSession" component={WorkoutSessionScreen} />
      <MainStackNav.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
      <MainStackNav.Screen name="ExercisePicker" component={ExercisePickerScreen} />
      <MainStackNav.Screen name="WorkoutPreview" component={WorkoutPreviewScreen} />
      <MainStackNav.Screen name="GroupDetail" component={GroupDetailScreen} />
      <MainStackNav.Screen name="CardioPreview" component={CardioPreviewScreen} />
      <MainStackNav.Screen name="CardioSession" component={CardioSessionScreen} />
    </MainStackNav.Navigator>
  );
}

export default function RootNavigator() {
  const session = useAuthStore((state) => state.session);
  const authLoading = useAuthStore((state) => state.isLoading);
  const init = useAuthStore((state) => state.init);

  const profile = useProfileStore((state) => state.profile);
  const profileLoading = useProfileStore((state) => state.isLoading);
  const fetchProfile = useProfileStore((state) => state.fetchProfile);
  const clearProfile = useProfileStore((state) => state.clear);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (session?.user.id) {
      fetchProfile(session.user.id);
    } else {
      clearProfile();
    }
  }, [session?.user.id, fetchProfile, clearProfile]);

  if (authLoading) return <Spinner />;

  return (
    <NavigationContainer theme={navigationTheme}>
      {!session ? (
        <AuthNavigator />
      ) : profileLoading || !profile ? (
        <Spinner />
      ) : !profile.onboarding_completed ? (
        <OnboardingScreen />
      ) : (
        <MainNavigator />
      )}
    </NavigationContainer>
  );
}
