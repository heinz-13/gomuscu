import { Platform } from "react-native";
import { InterstitialAd, AdEventType, TestIds } from "react-native-google-mobile-ads";

// Vraies ad units (compte AdMob de l'utilisateur), une par plateforme.
const ANDROID_INTERSTITIAL_ID = "ca-app-pub-9897401906204484/8077329352";
const IOS_INTERSTITIAL_ID = "ca-app-pub-9897401906204484/9993046253";

// En dev, toujours des ID de test (Google suspend les comptes en cas de clics de test sur
// de vraies unités) ; en prod, la vraie unité de la plateforme courante.
const INTERSTITIAL_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.OS === "android"
    ? ANDROID_INTERSTITIAL_ID
    : IOS_INTERSTITIAL_ID;

let interstitial: InterstitialAd | null = null;
let isLoaded = false;

function loadNextInterstitial() {
  interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID);
  isLoaded = false;

  const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
    isLoaded = true;
    console.log("[adService] interstitial loaded, ready to show");
  });

  const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
    console.log("[adService] interstitial failed to load:", error);
  });

  const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    isLoaded = false;
    unsubscribeLoaded();
    unsubscribeError();
    unsubscribeClosed();
    loadNextInterstitial();
  });

  console.log("[adService] requesting interstitial:", INTERSTITIAL_UNIT_ID);
  interstitial.load();
}

export function preloadInterstitial() {
  if (!interstitial) loadNextInterstitial();
}

export function showInterstitialIfReady() {
  console.log("[adService] showInterstitialIfReady, isLoaded =", isLoaded);
  if (interstitial && isLoaded) {
    interstitial.show();
  }
}
