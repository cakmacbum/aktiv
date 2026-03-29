import { NativeModules, Platform } from 'react-native';

const { SharedStorageModule } = NativeModules;

export interface WidgetData {
  todayMinutes: number;
  yesterdayMinutes: number;
}

/**
 * Ana uygulamadan widget'a veri aktarmak için kullanılır.
 * iOS'ta App Groups (UserDefaults), Android'de SharedPreferences kullanır.
 */
export const syncDataWithWidget = async (data: WidgetData): Promise<void> => {
  try {
    if (Platform.OS === 'ios') {
      // iOS App Group Identifier (Info.plist ve Capabilities'den ayarlanmalı)
      const APP_GROUP = 'group.com.screentimeapp';
      await SharedStorageModule.setItem('widgetData', JSON.stringify(data), APP_GROUP);
      // WidgetKit timeline'ını yenilemeye zorla
      await SharedStorageModule.reloadWidget();
    } else if (Platform.OS === 'android') {
      await SharedStorageModule.setItem('widgetData', JSON.stringify(data));
      // Android AppWidgetProvider'ı güncellemeye zorla
      await SharedStorageModule.reloadWidget();
    }
  } catch (error) {
    console.error('Widget verisi senkronize edilemedi:', error);
  }
};

/**
 * Kıyaslama Algoritması
 * ((Bugünkü Süre - Dünkü Süre) / Dünkü Süre) * 100
 */
export const calculateComparison = (today: number, yesterday: number) => {
  if (yesterday === 0) return { percentage: 0, direction: 'none', text: 'Dün veri yok' };
  
  const diff = today - yesterday;
  const percentage = Math.round(Math.abs((diff / yesterday) * 100));
  
  if (diff > 0) {
    return { percentage, direction: 'up', text: `Düne göre %${percentage} daha fazla` };
  } else if (diff < 0) {
    return { percentage, direction: 'down', text: `Düne göre %${percentage} daha az` };
  } else {
    return { percentage: 0, direction: 'same', text: 'Dün ile aynı' };
  }
};
