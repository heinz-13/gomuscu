import { Platform } from "react-native";
import { InterstitialAd, AdEventType, TestIds } from "react-native-google-mobile-ads";

// Vrai ad unit Android (compte AdMob de l'utilisateur). Pas encore d'unité iOS créée.
const ANDROID_INTERSTITIAL_ID = "ca-app-pub-9897401906204484/8077329352";

// En dev, toujours des ID de test (Google suspend les comptes en cas de clics de test sur
// de vraies unités) ; en prod, la vraie unité Android, et l'ID de test tant qu'iOS n'est pas configuré.
const INTERSTITIAL_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.OS === "android"
    ? ANDROID_INTERSTITIAL_ID
    : TestIds.INTERSTITIAL;

let interstitial: InterstitialAd | null = null;
let isLoaded = false;

function loadNextInterstitial() {
  interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID);
  isLoaded = false;

  const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
    isLoaded = true;
  });

  const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    isLoaded = false;
    unsubscribeLoaded();
    unsubscribeClosed();
    loadNextInterstitial();
  });

  interstitial.load();
}

export function preloadInterstitial() {
  if (!interstitial) loadNextInterstitial();
}

export function showInterstitialIfReady() {
  if (interstitial && isLoaded) {
    interstitial.show();
  }
}
