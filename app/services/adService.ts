import { InterstitialAd, AdEventType, TestIds } from "react-native-google-mobile-ads";

// ID de test officiel Google — à remplacer par un vrai ad unit ID AdMob avant la mise en prod.
const INTERSTITIAL_UNIT_ID = TestIds.INTERSTITIAL;

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
