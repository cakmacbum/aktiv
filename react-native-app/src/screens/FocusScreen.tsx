import React, { useState, useEffect, useRef } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  AppState, 
  AppStateStatus,
  Modal,
  Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Timer, Trophy, XCircle } from 'lucide-react-native';

const FOCUS_DURATIONS = [15, 30, 60, 120];

export default function FocusScreen() {
  const [selectedTime, setSelectedTime] = useState<number>(15);
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [plantState, setPlantState] = useState<'alive' | 'dead'>('alive');
  const [modalVisible, setModalVisible] = useState<'none' | 'success' | 'failed'>('none');
  const [score, setScore] = useState<number>(0);
  
  const appState = useRef(AppState.currentState);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Puanı yükle
  useEffect(() => {
    const loadScore = async () => {
      try {
        const savedScore = await AsyncStorage.getItem('@focus_score');
        if (savedScore !== null) {
          setScore(parseInt(savedScore, 10));
        }
      } catch (e) {
        console.error('Puan yüklenemedi', e);
      }
    };
    loadScore();
  }, []);

  // Puanı kaydet
  const saveScore = async (newScore: number) => {
    try {
      await AsyncStorage.setItem('@focus_score', newScore.toString());
      setScore(newScore);
    } catch (e) {
      console.error('Puan kaydedilemedi', e);
    }
  };

  // App Lifecycle (Arka plana atılma kontrolü)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/active/) && 
        nextAppState.match(/inactive|background/) &&
        isActive
      ) {
        // Uygulama arka plana atıldı ve sayaç aktifti -> Fidan kurudu!
        handleFailure();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isActive]);

  // Sayaç Mantığı
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Başarı durumu
      handleSuccess();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleStart = () => {
    setPlantState('alive');
    setTimeLeft(selectedTime * 60);
    setIsActive(true);
  };

  const handleGiveUp = () => {
    handleFailure();
  };

  const handleFailure = () => {
    setIsActive(false);
    setPlantState('dead');
    setModalVisible('failed');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSuccess = () => {
    setIsActive(false);
    setModalVisible('success');
    saveScore(score + selectedTime);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resetTimer = () => {
    setModalVisible('none');
    setPlantState('alive');
    setTimeLeft(selectedTime * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getPlantEmoji = () => {
    if (plantState === 'dead') return '🥀';
    if (!isActive && timeLeft === selectedTime * 60) return '🌱';
    
    const totalSeconds = selectedTime * 60;
    const passed = totalSeconds - timeLeft;
    const percentage = passed / totalSeconds;
    
    if (percentage < 0.25) return '🌱';
    if (percentage < 0.50) return '🌿';
    if (percentage < 0.75) return '🪴';
    return '🌳';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Odaklanma</Text>
        <View style={styles.scoreContainer}>
          <Trophy color="#10B981" size={16} />
          <Text style={styles.scoreText}>{score} Puan</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Plant Area */}
        <View style={styles.plantContainer}>
          <View style={[styles.plantCircle, plantState === 'dead' && styles.plantCircleDead]}>
            <Text style={styles.plantEmoji}>{getPlantEmoji()}</Text>
          </View>
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          {isActive && (
            <Text style={styles.warningText}>Uygulamadan çıkarsan fidan kurur!</Text>
          )}
        </View>

        {/* Duration Selectors */}
        <View style={styles.durationContainer}>
          {FOCUS_DURATIONS.map((duration) => (
            <TouchableOpacity
              key={duration}
              disabled={isActive}
              style={[
                styles.durationButton,
                selectedTime === duration && styles.durationButtonActive,
                isActive && styles.durationButtonDisabled
              ]}
              onPress={() => {
                setSelectedTime(duration);
                setTimeLeft(duration * 60);
              }}
            >
              <Text style={[
                styles.durationText,
                selectedTime === duration && styles.durationTextActive
              ]}>
                {duration} dk
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.actionButton, isActive ? styles.actionButtonGiveUp : styles.actionButtonStart]}
          onPress={isActive ? handleGiveUp : handleStart}
        >
          <Text style={styles.actionButtonText}>
            {isActive ? 'Pes Et' : 'Başla'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible !== 'none'}
        onRequestClose={resetTimer}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {modalVisible === 'success' ? (
              <>
                <Text style={styles.modalEmoji}>🌳</Text>
                <Text style={styles.modalTitle}>Tebrikler!</Text>
                <Text style={styles.modalMessage}>
                  {selectedTime} dakika boyunca başarıyla odaklandın ve fidanını büyüttün.
                </Text>
                <View style={styles.rewardBadge}>
                  <Trophy color="#10B981" size={20} />
                  <Text style={styles.rewardText}>+{selectedTime} Puan</Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalEmoji}>🥀</Text>
                <Text style={styles.modalTitle}>Odaklanman Bozuldu</Text>
                <Text style={styles.modalMessage}>
                  Uygulamadan çıktığın veya pes ettiğin için fidanın kurudu. Bir dahaki sefere daha iyi odaklanabilirsin!
                </Text>
              </>
            )}
            <TouchableOpacity style={styles.modalButton} onPress={resetTimer}>
              <Text style={styles.modalButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98115',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 6,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  plantContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  plantCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 4,
    borderColor: '#10B981',
  },
  plantCircleDead: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  plantEmoji: {
    fontSize: 80,
  },
  timerText: {
    fontSize: 56,
    fontWeight: '300',
    color: '#171717',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  warningText: {
    fontSize: 14,
    color: '#737373',
    marginTop: 8,
    fontWeight: '500',
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 48,
  },
  durationButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  durationButtonActive: {
    backgroundColor: '#10B98115',
    borderColor: '#10B981',
  },
  durationButtonDisabled: {
    opacity: 0.5,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#737373',
  },
  durationTextActive: {
    color: '#10B981',
  },
  actionButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionButtonStart: {
    backgroundColor: '#171717',
  },
  actionButtonGiveUp: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#737373',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98115',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  rewardText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
  },
  modalButton: {
    backgroundColor: '#171717',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  }
});
