import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Dimensions
} from 'react-native';
// Not: React Native projenizde 'lucide-react-native' yüklü olmalıdır.
// npm install lucide-react-native
import { Activity, Instagram, Twitter, MessageCircle, Youtube, Music, Smartphone } from 'lucide-react-native';
import { getDailyUsage, DailyUsage, AppUsage } from '../services/ScreenTimeService';

const { width } = Dimensions.get('window');

// Mock ikon eşleştirici (Gerçek uygulamada paket adına göre ikon getiren bir kütüphane kullanılabilir)
const getIconForApp = (packageName: string) => {
  if (packageName.includes('instagram')) return Instagram;
  if (packageName.includes('twitter')) return Twitter;
  if (packageName.includes('whatsapp')) return MessageCircle;
  if (packageName.includes('youtube')) return Youtube;
  if (packageName.includes('spotify')) return Music;
  return Smartphone;
};

// Uygulama ismini temizleme (örn: com.instagram.android -> Instagram)
const formatAppName = (packageName: string) => {
  const parts = packageName.split('.');
  const name = parts[parts.length - 1];
  return name.charAt(0).toUpperCase() + name.slice(1);
};

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [usageData, setUsageData] = useState<DailyUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    // Gerçek servisten veri çekiyoruz
    const data = await getDailyUsage();
    
    if (data) {
      // Sadece ilk 5 uygulamayı al
      const top5Apps = data.apps
        .sort((a, b) => b.minutes - a.minutes)
        .slice(0, 5);
      
      setUsageData({ ...data, apps: top5Apps });
    }
    setLoading(false);
  };

  const formatTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return { hours, minutes };
  };

  const renderTab = (tab: 'daily' | 'weekly' | 'monthly', label: string) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity 
        style={[styles.tab, isActive && styles.activeTab]} 
        onPress={() => setActiveTab(tab)}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderAppItem = ({ item, index }: { item: AppUsage, index: number }) => {
    const Icon = getIconForApp(item.packageName);
    const { hours, minutes } = formatTime(item.minutes);
    
    // En çok kullanılan uygulamaya göre yüzde hesapla
    const maxMinutes = usageData?.apps[0]?.minutes || 1;
    const percentage = (item.minutes / maxMinutes) * 100;

    return (
      <View style={styles.appItem}>
        <View style={styles.iconContainer}>
          <Icon color="#171717" size={24} />
        </View>
        <View style={styles.appInfo}>
          <View style={styles.appHeader}>
            <Text style={styles.appName}>{formatAppName(item.packageName)}</Text>
            <Text style={styles.appTime}>
              {hours > 0 ? `${hours}s ` : ''}{minutes}d
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${percentage}%` }]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Aktivite</Text>
        <View style={styles.headerIcon}>
          <Activity color="#171717" size={20} />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {renderTab('daily', 'Günlük')}
        {renderTab('weekly', 'Haftalık')}
        {renderTab('monthly', 'Aylık')}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : usageData ? (
        <View style={styles.content}>
          {/* Total Time Circle */}
          <View style={styles.circleContainer}>
            <View style={styles.circle}>
              <Text style={styles.circleLabel}>Toplam Süre</Text>
              <View style={styles.timeContainer}>
                <Text style={styles.timeValue}>{formatTime(usageData.totalMinutes).hours}</Text>
                <Text style={styles.timeUnit}>sa</Text>
                <Text style={[styles.timeValue, { marginLeft: 8 }]}>{formatTime(usageData.totalMinutes).minutes}</Text>
                <Text style={styles.timeUnit}>dk</Text>
              </View>
            </View>
          </View>

          {/* Top Apps List */}
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>EN ÇOK KULLANILANLAR</Text>
            <FlatList
              data={usageData.apps}
              keyExtractor={(item) => item.packageName}
              renderItem={renderAppItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.flatListContent}
            />
          </View>
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={styles.errorText}>Veri bulunamadı.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#171717',
    letterSpacing: -0.5,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#737373',
  },
  activeTabText: {
    color: '#171717',
  },
  content: {
    flex: 1,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  circle: {
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: width * 0.275,
    borderWidth: 6,
    borderColor: '#10B981', // Soft Yeşil Vurgu
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#737373',
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  timeValue: {
    fontSize: 48,
    fontWeight: '300',
    color: '#171717',
    letterSpacing: -2,
  },
  timeUnit: {
    fontSize: 20,
    fontWeight: '500',
    color: '#A3A3A3',
    marginLeft: 4,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  listTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#171717',
    letterSpacing: 1,
    marginBottom: 16,
  },
  flatListContent: {
    paddingBottom: 40,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  appInfo: {
    flex: 1,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  appName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#171717',
  },
  appTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#737373',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981', // Soft Yeşil Vurgu
    borderRadius: 3,
    opacity: 0.8,
  },
  errorText: {
    fontSize: 16,
    color: '#737373',
  }
});
