import { useState, useEffect, useRef } from 'react';
import { Instagram, Twitter, MessageCircle, Youtube, Music, Activity, ArrowDownRight, ArrowUpRight, Smartphone, LayoutDashboard, Timer, Trophy, Store, Lock, CheckCircle2 } from 'lucide-react';

// Web önizlemesi için mock veri servisi
const mockFetchDailyUsage = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        totalMinutes: 285, // 4 saat 45 dakika
        yesterdayMinutes: 340, // 5 saat 40 dakika (Daha az kullanım senaryosu)
        apps: [
          { id: '1', name: 'Instagram', minutes: 120, icon: Instagram },
          { id: '2', name: 'Twitter', minutes: 65, icon: Twitter },
          { id: '3', name: 'WhatsApp', minutes: 45, icon: MessageCircle },
          { id: '4', name: 'YouTube', minutes: 35, icon: Youtube },
          { id: '5', name: 'Spotify', minutes: 20, icon: Music },
        ]
      });
    }, 800);
  });
};

const FOCUS_DURATIONS = [15, 30, 60, 120];

const STORE_ITEMS = [
  { id: 'default', name: 'Klasik Ağaç', cost: 0, icon: '🌳', stages: ['🌱', '🌿', '🪴', '🌳'] },
  { id: 'sunflower', name: 'Ayçiçeği', cost: 50, icon: '🌻', stages: ['🌰', '🌿', '🪴', '🌻'] },
  { id: 'cactus', name: 'Kaktüs', cost: 100, icon: '🌵', stages: ['🪨', '🪴', '🌵', '🏜️'] },
  { id: 'pine', name: 'Çam Ağacı', cost: 200, icon: '🌲', stages: ['🌰', '🌿', '🪴', '🌲'] },
  { id: 'rose', name: 'Gül', cost: 500, icon: '🌹', stages: ['🌱', '🌿', '🪴', '🌹'] },
];

export default function App() {
  const [viewMode, setViewMode] = useState<'app' | 'widget'>('app');
  const [activeNavTab, setActiveNavTab] = useState<'dashboard' | 'focus' | 'market'>('dashboard');
  
  // Dashboard State
  const [activeTab, setActiveTab] = useState('daily');
  const [usageData, setUsageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Focus & Gamification State
  const [selectedTime, setSelectedTime] = useState<number>(15);
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [plantState, setPlantState] = useState<'alive' | 'dead'>('alive');
  const [modalVisible, setModalVisible] = useState<'none' | 'success' | 'failed'>('none');
  const [score, setScore] = useState<number>(0);
  const [unlockedPlants, setUnlockedPlants] = useState<string[]>(['default']);
  const [activePlant, setActivePlant] = useState<string>('default');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Dashboard Data & Local Storage
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await mockFetchDailyUsage();
      setUsageData(data);
      setLoading(false);
    };
    loadData();
    
    // Load gamification data
    const savedScore = localStorage.getItem('@focus_score');
    if (savedScore) setScore(parseInt(savedScore, 10));

    const savedUnlocked = localStorage.getItem('@unlocked_plants');
    if (savedUnlocked) setUnlockedPlants(JSON.parse(savedUnlocked));

    const savedActive = localStorage.getItem('@active_plant');
    if (savedActive) setActivePlant(savedActive);
  }, []);

  // App Lifecycle (Web Visibility API)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        // Uygulama arka plana atıldı (sekme değiştirildi vs.)
        handleFailure();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive]);

  // Timer Logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleSuccess();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleStartFocus = () => {
    setPlantState('alive');
    setTimeLeft(selectedTime * 60);
    setIsActive(true);
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
    const newScore = score + selectedTime;
    setScore(newScore);
    localStorage.setItem('@focus_score', newScore.toString());
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resetFocus = () => {
    setModalVisible('none');
    setPlantState('alive');
    setTimeLeft(selectedTime * 60);
  };

  const handleBuyPlant = (plantId: string, cost: number) => {
    if (score >= cost && !unlockedPlants.includes(plantId)) {
      const newScore = score - cost;
      const newUnlocked = [...unlockedPlants, plantId];
      
      setScore(newScore);
      setUnlockedPlants(newUnlocked);
      setActivePlant(plantId);
      
      localStorage.setItem('@focus_score', newScore.toString());
      localStorage.setItem('@unlocked_plants', JSON.stringify(newUnlocked));
      localStorage.setItem('@active_plant', plantId);
    }
  };

  const handleSelectPlant = (plantId: string) => {
    if (unlockedPlants.includes(plantId)) {
      setActivePlant(plantId);
      localStorage.setItem('@active_plant', plantId);
    }
  };

  const formatFocusTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getPlantEmoji = () => {
    if (plantState === 'dead') return '🥀';
    
    const currentPlant = STORE_ITEMS.find(p => p.id === activePlant) || STORE_ITEMS[0];
    const stages = currentPlant.stages;

    if (!isActive && timeLeft === selectedTime * 60) return stages[0];
    
    const totalSeconds = selectedTime * 60;
    const passed = totalSeconds - timeLeft;
    const percentage = passed / totalSeconds;
    
    if (percentage < 0.25) return stages[0];
    if (percentage < 0.50) return stages[1];
    if (percentage < 0.75) return stages[2];
    return stages[3];
  };

  const formatTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes };
  };

  const getComparison = () => {
    if (!usageData) return { pct: 0, isLess: false, text: '' };
    const diff = usageData.totalMinutes - usageData.yesterdayMinutes;
    const pct = Math.round(Math.abs((diff / usageData.yesterdayMinutes) * 100));
    const isLess = diff < 0;
    return { pct, isLess, text: `Düne göre %${pct} daha ${isLess ? 'az' : 'fazla'}` };
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center sm:p-6 font-sans">
      
      {/* View Mode Toggle */}
      <div className="mb-8 bg-white p-1.5 rounded-full shadow-sm border border-neutral-200 flex space-x-1">
        <button 
          onClick={() => setViewMode('app')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'app' ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-900'}`}
        >
          Ana Uygulama
        </button>
        <button 
          onClick={() => setViewMode('widget')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'widget' ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-900'}`}
        >
          Widget Önizleme
        </button>
      </div>

      {viewMode === 'app' ? (
        /* Mobil Cihaz Çerçevesi (Ana Uygulama) */
        <div className="w-full max-w-md h-screen sm:h-[800px] bg-white sm:rounded-[2.5rem] sm:border-[8px] border-neutral-900 overflow-hidden relative shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-300">
          
          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {activeNavTab === 'dashboard' ? (
              /* DASHBOARD SCREEN */
              <div className="animate-in fade-in duration-300">
                <div className="pt-12 pb-6 px-6 bg-white">
                  <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Aktivite</h1>
                    <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-neutral-900" />
                    </div>
                  </div>

                  <div className="flex p-1 bg-neutral-100 rounded-2xl">
                    {['daily', 'weekly', 'monthly'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                          activeTab === tab 
                            ? 'bg-white text-neutral-900 shadow-sm' 
                            : 'text-neutral-500 hover:text-neutral-700'
                        }`}
                      >
                        {tab === 'daily' ? 'Günlük' : tab === 'weekly' ? 'Haftalık' : 'Aylık'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-6 pb-8">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-pulse">
                      <div className="w-32 h-32 rounded-full bg-neutral-100"></div>
                      <div className="w-48 h-8 bg-neutral-100 rounded-lg"></div>
                    </div>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="relative w-48 h-48 flex items-center justify-center">
                          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                            <circle cx="96" cy="96" r="92" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-neutral-100" />
                            <circle cx="96" cy="96" r="92" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="578" strokeDashoffset="150" className="text-[#10B981] transition-all duration-1000 ease-out" strokeLinecap="round" />
                          </svg>
                          <div className="text-center">
                            <p className="text-sm font-medium text-neutral-500 mb-1">Toplam Süre</p>
                            <div className="flex items-baseline justify-center space-x-1">
                              <span className="text-5xl font-light tracking-tighter text-neutral-900">{formatTime(usageData.totalMinutes).hours}</span>
                              <span className="text-xl font-medium text-neutral-400">sa</span>
                              <span className="text-5xl font-light tracking-tighter text-neutral-900 ml-2">{formatTime(usageData.totalMinutes).minutes}</span>
                              <span className="text-xl font-medium text-neutral-400">dk</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-4">En Çok Kullanılanlar</h2>
                        <div className="space-y-5">
                          {usageData.apps.map((app: any) => {
                            const Icon = app.icon;
                            const maxMinutes = usageData.apps[0].minutes;
                            const percentage = (app.minutes / maxMinutes) * 100;
                            const { hours, minutes } = formatTime(app.minutes);

                            return (
                              <div key={app.id} className="flex items-center group">
                                <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mr-4 group-hover:bg-[#10B981]/10 transition-colors">
                                  <Icon className="w-6 h-6 text-neutral-700 group-hover:text-[#10B981] transition-colors" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-end mb-1.5">
                                    <span className="font-medium text-neutral-900">{app.name}</span>
                                    <span className="text-sm font-medium text-neutral-500">
                                      {hours > 0 ? `${hours}s ` : ''}{minutes}d
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#10B981] rounded-full opacity-80" style={{ width: `${percentage}%` }} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : activeNavTab === 'focus' ? (
              /* FOCUS SCREEN */
              <div className="animate-in fade-in duration-300 h-full flex flex-col">
                <div className="pt-12 pb-6 px-6 bg-white shrink-0">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Odaklanma</h1>
                    <div className="flex items-center space-x-1.5 bg-[#10B981]/10 px-3 py-1.5 rounded-full">
                      <Trophy className="w-4 h-4 text-[#10B981]" />
                      <span className="text-sm font-semibold text-[#10B981]">{score} Puan</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 px-6 flex flex-col items-center justify-center pb-12">
                  
                  {/* Plant Area */}
                  <div className="flex flex-col items-center mb-12">
                    <div className={`w-48 h-48 rounded-full flex items-center justify-center mb-6 border-4 transition-colors duration-300 ${plantState === 'dead' ? 'border-red-500 bg-red-50' : 'border-[#10B981] bg-neutral-50'}`}>
                      <span className="text-7xl animate-in zoom-in duration-300">{getPlantEmoji()}</span>
                    </div>
                    <div className="text-5xl font-light tracking-tighter text-neutral-900 font-mono">
                      {formatFocusTime(timeLeft)}
                    </div>
                    {isActive && (
                      <p className="text-sm font-medium text-neutral-500 mt-3 animate-pulse">
                        Sekmeyi değiştirirsen bitkin kurur!
                      </p>
                    )}
                  </div>

                  {/* Duration Selectors */}
                  <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {FOCUS_DURATIONS.map((duration) => (
                      <button
                        key={duration}
                        disabled={isActive}
                        onClick={() => {
                          setSelectedTime(duration);
                          setTimeLeft(duration * 60);
                        }}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                          selectedTime === duration
                            ? 'bg-[#10B981]/10 text-[#10B981] ring-1 ring-[#10B981]'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        } ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {duration} dk
                      </button>
                    ))}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={isActive ? handleFailure : handleStartFocus}
                    className={`w-full py-4 rounded-2xl text-lg font-semibold text-white transition-all active:scale-[0.98] ${
                      isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-neutral-900 hover:bg-neutral-800'
                    }`}
                  >
                    {isActive ? 'Pes Et' : 'Başla'}
                  </button>
                </div>
              </div>
            ) : (
              /* MARKET SCREEN */
              <div className="animate-in fade-in duration-300 h-full flex flex-col">
                <div className="pt-12 pb-6 px-6 bg-white shrink-0">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Market</h1>
                    <div className="flex items-center space-x-1.5 bg-[#10B981]/10 px-3 py-1.5 rounded-full">
                      <Trophy className="w-4 h-4 text-[#10B981]" />
                      <span className="text-sm font-semibold text-[#10B981]">{score} Puan</span>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-500 mt-2">Odaklanarak kazandığın puanlarla yeni bitkiler aç.</p>
                </div>

                <div className="flex-1 px-6 pb-12 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    {STORE_ITEMS.map((item) => {
                      const isUnlocked = unlockedPlants.includes(item.id);
                      const isSelected = activePlant === item.id;
                      const canAfford = score >= item.cost;

                      return (
                        <div 
                          key={item.id} 
                          className={`bg-white rounded-2xl p-4 border-2 transition-all flex flex-col items-center text-center ${
                            isSelected ? 'border-[#10B981] shadow-md' : 'border-neutral-100 shadow-sm'
                          }`}
                        >
                          <div className="text-5xl mb-3">{item.icon}</div>
                          <h3 className="font-semibold text-neutral-900 mb-1">{item.name}</h3>
                          
                          {!isUnlocked && (
                            <div className="flex items-center space-x-1 text-sm font-medium text-neutral-500 mb-3">
                              <Trophy className="w-3.5 h-3.5" />
                              <span>{item.cost}</span>
                            </div>
                          )}

                          {isSelected ? (
                            <div className="mt-auto flex items-center space-x-1 text-[#10B981] text-sm font-semibold">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Seçildi</span>
                            </div>
                          ) : isUnlocked ? (
                            <button
                              onClick={() => handleSelectPlant(item.id)}
                              className="mt-auto w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-xl text-sm font-semibold transition-colors"
                            >
                              Seç
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBuyPlant(item.id, item.cost)}
                              disabled={!canAfford}
                              className={`mt-auto w-full py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center space-x-1 ${
                                canAfford 
                                  ? 'bg-neutral-900 text-white hover:bg-neutral-800' 
                                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                              }`}
                            >
                              {!canAfford && <Lock className="w-3.5 h-3.5" />}
                              <span>{canAfford ? 'Satın Al' : 'Kilitli'}</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="shrink-0 bg-white border-t border-neutral-100 flex items-center justify-around pb-6 pt-3 px-6">
            <button 
              onClick={() => !isActive && setActiveNavTab('dashboard')}
              className={`flex flex-col items-center space-y-1 p-2 ${activeNavTab === 'dashboard' ? 'text-[#10B981]' : 'text-neutral-400 hover:text-neutral-600'} ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <LayoutDashboard className="w-6 h-6" />
              <span className="text-[10px] font-medium">Aktivite</span>
            </button>
            <button 
              onClick={() => setActiveNavTab('focus')}
              className={`flex flex-col items-center space-y-1 p-2 ${activeNavTab === 'focus' ? 'text-[#10B981]' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              <Timer className="w-6 h-6" />
              <span className="text-[10px] font-medium">Odaklanma</span>
            </button>
            <button 
              onClick={() => !isActive && setActiveNavTab('market')}
              className={`flex flex-col items-center space-y-1 p-2 ${activeNavTab === 'market' ? 'text-[#10B981]' : 'text-neutral-400 hover:text-neutral-600'} ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Store className="w-6 h-6" />
              <span className="text-[10px] font-medium">Market</span>
            </button>
          </div>

          {/* Modals */}
          {modalVisible !== 'none' && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in duration-200">
              <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-300">
                {modalVisible === 'success' ? (
                  <>
                    <span className="text-6xl mb-4">🌳</span>
                    <h3 className="text-2xl font-bold text-neutral-900 mb-2">Tebrikler!</h3>
                    <p className="text-neutral-500 mb-6">
                      {selectedTime} dakika boyunca başarıyla odaklandın ve fidanını büyüttün.
                    </p>
                    <div className="flex items-center space-x-2 bg-[#10B981]/10 px-4 py-2 rounded-full mb-8">
                      <Trophy className="w-5 h-5 text-[#10B981]" />
                      <span className="text-lg font-bold text-[#10B981]">+{selectedTime} Puan</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-6xl mb-4">🥀</span>
                    <h3 className="text-2xl font-bold text-neutral-900 mb-2">Odaklanman Bozuldu</h3>
                    <p className="text-neutral-500 mb-8">
                      Uygulamadan çıktığın veya pes ettiğin için fidanın kurudu. Bir dahaki sefere daha iyi odaklanabilirsin!
                    </p>
                  </>
                )}
                <button
                  onClick={resetFocus}
                  className="w-full py-4 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors"
                >
                  Tamam
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Widget Önizleme Ekranı */
        <div className="w-full max-w-md flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
          <p className="text-neutral-500 mb-8 text-center text-sm">
            iOS ve Android ana ekranlarında görünecek olan<br/>Native Widget tasarımı.
          </p>
          
          <div className="w-[320px] h-[160px] bg-white rounded-[28px] shadow-xl border border-neutral-100 p-6 flex flex-col justify-center relative overflow-hidden">
            {loading ? (
              <div className="animate-pulse flex flex-col items-center space-y-3">
                <div className="w-24 h-4 bg-neutral-100 rounded"></div>
                <div className="w-48 h-12 bg-neutral-100 rounded"></div>
                <div className="w-32 h-4 bg-neutral-100 rounded"></div>
              </div>
            ) : (
              <>
                <div className="absolute top-4 left-5 flex items-center space-x-1.5 opacity-60">
                  <Smartphone className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Ekran Süresi</span>
                </div>

                <div className="flex flex-col items-center mt-2">
                  <div className="flex items-baseline justify-center space-x-1 mb-2">
                    <span className="text-[44px] leading-none font-light tracking-tighter text-neutral-900">
                      {formatTime(usageData.totalMinutes).hours}
                    </span>
                    <span className="text-lg font-medium text-neutral-400">sa</span>
                    <span className="text-[44px] leading-none font-light tracking-tighter text-neutral-900 ml-1">
                      {formatTime(usageData.totalMinutes).minutes}
                    </span>
                    <span className="text-lg font-medium text-neutral-400">dk</span>
                  </div>

                  <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full ${getComparison().isLess ? 'bg-[#10B981]/10' : 'bg-red-500/10'}`}>
                    {getComparison().isLess ? (
                      <ArrowDownRight className="w-4 h-4 text-[#10B981]" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-xs font-medium ${getComparison().isLess ? 'text-[#10B981]' : 'text-red-500'}`}>
                      {getComparison().text}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
