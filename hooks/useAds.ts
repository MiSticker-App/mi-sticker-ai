import { useEffect, useRef } from "react";
import mobileAds, {
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
  AdsConsent,
} from "react-native-google-mobile-ads";

// Test ID de AdMob para Interstitial
const INTERSTITIAL_AD_UNIT_ID = "ca-app-pub-3940256099942544/1033173712";
// Test ID de AdMob para Rewarded Ad
const REWARDED_AD_UNIT_ID = "ca-app-pub-3940256099942544/5224354917";

let interstitialAd: InterstitialAd | null = null;
let rewardedAd: RewardedAd | null = null;
let isInitialized = false;

/**
 * Inicializa el SDK de AdMob y carga el Interstitial Ad
 * Implementa el flujo UMP (User Messaging Platform) de Google para consentimiento GDPR
 */
async function initializeAds() {
  if (isInitialized) return;

  try {
    // Fase 1: Solicitar actualización de información de consentimiento
    try {
      const consentInfo = await AdsConsent.requestInfoUpdate();
      console.log("Consent Info Status:", consentInfo.status);

      // Fase 2: Cargar y mostrar el formulario de consentimiento si es requerido
      if (consentInfo.isConsentFormAvailable) {
        const formResult = await AdsConsent.loadAndShowConsentFormIfRequired();
        console.log("Consent Form Result:", formResult);
      }
    } catch (consentError) {
      console.error("Error en el flujo de consentimiento UMP:", consentError);
      // Fail-open: continuar con la inicialización aunque falle el consentimiento
    }

    // Fase 3: Inicializar mobileAds después del consentimiento
    await mobileAds().initialize();
    isInitialized = true;

    // Crear y cargar el Interstitial Ad
    interstitialAd = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    // Cargar el anuncio
    await interstitialAd.load();

    // Crear y cargar el Rewarded Ad
    rewardedAd = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    // Cargar el anuncio recompensado
    await rewardedAd.load();
  } catch (error) {
    console.error("Error inicializando AdMob:", error);
    // Fail-open: continuar aunque falle la inicialización
  }
}

/**
 * Muestra el Interstitial Ad y retorna una Promise que se resuelve cuando el usuario cierra el anuncio
 */
export async function showInterstitial(): Promise<void> {
  return new Promise((resolve) => {
    // Si no está inicializado, inicializar primero
    if (!isInitialized) {
      initializeAds().then(() => {
        showInterstitial().then(resolve);
      });
      return;
    }

    // Si no hay anuncio cargado, intentar cargar uno nuevo
    if (!interstitialAd) {
      try {
        interstitialAd = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
          requestNonPersonalizedAdsOnly: true,
        });
        interstitialAd.load();
      } catch (error) {
        console.error("Error creando Interstitial Ad:", error);
        // Fail-open: resolver inmediatamente si falla
        resolve();
        return;
      }
    }

    try {
      // Verificar si el anuncio está cargado
      if (!interstitialAd.loaded) {
        // Si no está cargado, esperar a que se cargue o resolver inmediatamente
        const unsubscribeLoaded = interstitialAd.addAdEventListener(
          AdEventType.LOADED,
          () => {
            unsubscribeLoaded();
            showAd();
          }
        );

        // Timeout: si no se carga en 3 segundos, continuar sin mostrar anuncio
        setTimeout(() => {
          unsubscribeLoaded();
          resolve();
        }, 3000);

        // Intentar cargar si no está cargando
        if (!interstitialAd.loading) {
          interstitialAd.load();
        }
        return;
      }

      showAd();

      function showAd() {
        if (!interstitialAd) {
          resolve();
          return;
        }

        // Escuchar cuando el anuncio se cierra
        const unsubscribeClosed = interstitialAd.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            unsubscribeClosed();
            // Crear un nuevo anuncio para la próxima vez
            interstitialAd = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
              requestNonPersonalizedAdsOnly: true,
            });
            interstitialAd.load();
            resolve();
          }
        );

        // Escuchar errores
        const unsubscribeError = interstitialAd.addAdEventListener(
          AdEventType.ERROR,
          () => {
            unsubscribeError();
            unsubscribeClosed();
            // Fail-open: resolver aunque haya error
            resolve();
          }
        );

        // Mostrar el anuncio
        interstitialAd.show().catch((error) => {
          console.error("Error mostrando Interstitial Ad:", error);
          unsubscribeClosed();
          unsubscribeError();
          // Fail-open: resolver aunque falle
          resolve();
        });
      }
    } catch (error) {
      console.error("Error en showInterstitial:", error);
      // Fail-open: resolver aunque haya error
      resolve();
    }
  });
}

/**
 * Muestra el Rewarded Ad y retorna una Promise<boolean> que se resuelve cuando el usuario completa el anuncio
 * Retorna true si el usuario vio el anuncio completo y recibió la recompensa, false en caso contrario
 */
export async function showRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    // Si no está inicializado, inicializar primero
    if (!isInitialized) {
      initializeAds().then(() => {
        showRewardedAd().then(resolve);
      });
      return;
    }

    // Si no hay anuncio cargado, intentar cargar uno nuevo
    if (!rewardedAd) {
      try {
        rewardedAd = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
          requestNonPersonalizedAdsOnly: true,
        });
        rewardedAd.load();
      } catch (error) {
        console.error("Error creando Rewarded Ad:", error);
        // Fail-open: resolver con false si falla
        resolve(false);
        return;
      }
    }

    try {
      // Verificar si el anuncio está cargado
      if (!rewardedAd.loaded) {
        // Si no está cargado, esperar a que se cargue o resolver inmediatamente
        const unsubscribeLoaded = rewardedAd.addAdEventListener(
          RewardedAdEventType.LOADED,
          () => {
            unsubscribeLoaded();
            showAd();
          }
        );

        // Timeout: si no se carga en 5 segundos, continuar sin mostrar anuncio
        setTimeout(() => {
          unsubscribeLoaded();
          resolve(false);
        }, 5000);

        // Intentar cargar si no está cargando
        if (!rewardedAd.loading) {
          rewardedAd.load();
        }
        return;
      }

      showAd();

      function showAd() {
        if (!rewardedAd) {
          resolve(false);
          return;
        }

        let rewardGranted = false;

        // Escuchar cuando el usuario recibe la recompensa
        const unsubscribeRewarded = rewardedAd.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          () => {
            rewardGranted = true;
          }
        );

        // Escuchar cuando el anuncio se cierra
        const unsubscribeClosed = rewardedAd.addAdEventListener(
          RewardedAdEventType.CLOSED,
          () => {
            unsubscribeRewarded();
            unsubscribeClosed();
            // Crear un nuevo anuncio para la próxima vez
            rewardedAd = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
              requestNonPersonalizedAdsOnly: true,
            });
            rewardedAd.load();
            resolve(rewardGranted);
          }
        );

        // Escuchar errores
        const unsubscribeError = rewardedAd.addAdEventListener(
          RewardedAdEventType.ERROR,
          () => {
            unsubscribeRewarded();
            unsubscribeClosed();
            unsubscribeError();
            // Fail-open: resolver con false aunque haya error
            resolve(false);
          }
        );

        // Mostrar el anuncio
        rewardedAd.show().catch((error) => {
          console.error("Error mostrando Rewarded Ad:", error);
          unsubscribeRewarded();
          unsubscribeClosed();
          unsubscribeError();
          // Fail-open: resolver con false aunque falle
          resolve(false);
        });
      }
    } catch (error) {
      console.error("Error en showRewardedAd:", error);
      // Fail-open: resolver con false aunque haya error
      resolve(false);
    }
  });
}

/**
 * Hook para inicializar AdMob al montar el componente
 */
export function useAds() {
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      initializeAds();
    }
  }, []);
}

