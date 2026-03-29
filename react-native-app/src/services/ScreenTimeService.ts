import { NativeModules, Platform } from 'react-native';

// Native modüllerimizi alıyoruz
const { UsageStatsModule, ScreenTimeModule } = NativeModules;

export interface AppUsage {
  packageName: string;
  minutes: number;
}

export interface DailyUsage {
  totalMinutes: number;
  apps: AppUsage[];
  note?: string; // iOS kısıtlamaları gibi durumlar için bilgi notu
}

/**
 * Gerekli izinleri kontrol eder ve yoksa kullanıcıdan ister.
 * @returns {Promise<boolean>} İzin verildiyse true, verilmediyse/bekleniyorsa false
 */
export const checkAndRequestPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const hasPermission = await UsageStatsModule.checkPermission();
    if (!hasPermission) {
      // Kullanıcıyı ayarlara yönlendirir
      UsageStatsModule.requestPermission();
      return false;
    }
    return true;
  } else if (Platform.OS === 'ios') {
    try {
      // iOS 15+ Family Controls yetkilendirmesi
      const authorized = await ScreenTimeModule.requestAuthorization();
      return authorized;
    } catch (e) {
      console.error("iOS Screen Time yetkilendirme hatası:", e);
      return false;
    }
  }
  return false;
};

/**
 * Günlük toplam ekran süresini ve uygulama bazlı kullanımı getirir.
 * @returns {Promise<DailyUsage | null>} Kullanım verileri
 */
export const getDailyUsage = async (): Promise<DailyUsage | null> => {
  try {
    if (Platform.OS === 'android') {
      return await UsageStatsModule.getDailyUsage();
    } else if (Platform.OS === 'ios') {
      return await ScreenTimeModule.getDailyUsage();
    }
  } catch (e) {
    console.error("Günlük kullanım verisi çekilirken hata oluştu:", e);
  }
  return null;
};
