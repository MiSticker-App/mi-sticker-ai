// hooks/useAds.ts
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import mobileAds, {
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
  AdsConsent,
  AdsConsentStatus,
} from 'react-native-google-mobile-ads';

// Test IDs de AdMob
const INTERSTITIAL_AD_ID =
  Platform.OS === 'ios'
    ? 'ca-app-pub-3940256099942544/4411468910'
    : 'ca-app-pub-3940256099942544/1033173712';

const REWARDED_AD_ID =
  Platform.OS === 'ios'
    ? 'ca-app-pub-3940256099942544/1712485313'
    : 'ca-app-pub-3940256099942544/5224354917';

let interstitialAd: InterstitialAd | null = null;
let rewardedAd: RewardedAd | null = null;

/**
 * Hook para manejar la inicialización y uso de anuncios AdMob
 */
export function useAds() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInterstitialLoaded, setIsInterstitialLoaded] = useState(false);
  const [isRewardedLoaded, setIsRewardedLoaded] = useState(false);

  useEffect(() => {
    initializeAds();
  }, []);

  /**
   * Inicializa AdMob y solicita consentimiento UMP (GDPR)
   */
  const initializeAds = async () => {
    try {
      // Solicitar consentimiento UMP
      const consentInfo = await AdsConsent.requestInfoUpdate();
      
      if (
        consentInfo.status === AdsConsentStatus.REQUIRED ||
        consentInfo.status === AdsConsentStatus.UNKNOWN
      ) {
        await AdsConsent.showForm();
      }

      // Inicializar AdMob
    await mobileAds().initialize();

      // Cargar anuncios
      loadInterstitialAd();
      loadRewardedAd();

      setIsInitialized(true);
  } catch (error) {
      console.error('Error initializing ads:', error);
      setIsInitialized(true); // Continuar sin anuncios en caso de error
    }
  };

  /**
   * Carga un nuevo anuncio intersticial
   */
  const loadInterstitialAd = () => {
    interstitialAd = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_ID);

        const unsubscribeLoaded = interstitialAd.addAdEventListener(
          AdEventType.LOADED,
          () => {
        setIsInterstitialLoaded(true);
      }
    );

        const unsubscribeClosed = interstitialAd.addAdEventListener(
          AdEventType.CLOSED,
          () => {
        setIsInterstitialLoaded(false);
        // Cargar nuevo anuncio para la próxima vez
        loadInterstitialAd();
      }
    );

    interstitialAd.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
    };
  };

  /**
   * Carga un nuevo anuncio con recompensa
   */
  const loadRewardedAd = () => {
    rewardedAd = RewardedAd.createForAdRequest(REWARDED_AD_ID);

    const unsubscribeLoaded = rewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
          () => {
        setIsRewardedLoaded(true);
      }
    );

    const unsubscribeClosed = rewardedAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setIsRewardedLoaded(false);
        // Cargar nuevo anuncio para la próxima vez
        loadRewardedAd();
      }
    );

    rewardedAd.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
    };
  };

  /**
   * Muestra un anuncio intersticial
   */
  const showInterstitial = async (): Promise<void> => {
    if (!interstitialAd || !isInterstitialLoaded) {
      console.log('Interstitial ad not ready');
      return;
    }

      try {
      await interstitialAd.show();
      } catch (error) {
      console.error('Error showing interstitial ad:', error);
    }
  };

  /**
   * Muestra un anuncio con recompensa
   * @returns Promise<boolean> - true si el usuario vio el anuncio completo
   */
  const showRewardedAd = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!rewardedAd || !isRewardedLoaded) {
        console.log('Rewarded ad not ready');
        resolve(false);
        return;
      }

      let rewarded = false;

      const unsubscribeEarned = rewardedAd.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
          () => {
          rewarded = true;
        }
      );

        const unsubscribeClosed = rewardedAd.addAdEventListener(
        AdEventType.CLOSED,
          () => {
          unsubscribeEarned();
            unsubscribeClosed();
          resolve(rewarded);
        }
      );

        rewardedAd.show().catch((error) => {
        console.error('Error showing rewarded ad:', error);
        unsubscribeEarned();
          unsubscribeClosed();
          resolve(false);
        });
    });
  };

  return {
    isInitialized,
    isInterstitialLoaded,
    isRewardedLoaded,
    showInterstitial,
    showRewardedAd,
  };
}
