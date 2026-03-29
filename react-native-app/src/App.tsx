import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { checkAndRequestPermission } from './services/ScreenTimeService';
import DashboardScreen from './screens/DashboardScreen';
import FocusScreen from './screens/FocusScreen';
import { LayoutDashboard, Timer } from 'lucide-react-native';

const App = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'focus'>('dashboard');

  useEffect(() => {
    const init = async () => {
      const permission = await checkAndRequestPermission();
      setHasPermission(permission);
    };
    init();
  }, []);

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text>İzinler kontrol ediliyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            Uygulamayı kullanabilmek için kullanım verilerine erişim izni vermeniz gerekmektedir.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <View style={styles.content}>
        {activeTab === 'dashboard' ? <DashboardScreen /> : <FocusScreen />}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard color={activeTab === 'dashboard' ? '#10B981' : '#A3A3A3'} size={24} />
          <Text style={[styles.navText, activeTab === 'dashboard' && styles.navTextActive]}>
            Aktivite
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('focus')}
        >
          <Timer color={activeTab === 'focus' ? '#10B981' : '#A3A3A3'} size={24} />
          <Text style={[styles.navText, activeTab === 'focus' && styles.navTextActive]}>
            Odaklanma
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingBottom: 32, // Safe area for iOS
    paddingTop: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A3A3A3',
    marginTop: 4,
  },
  navTextActive: {
    color: '#10B981',
  }
});

export default App;
