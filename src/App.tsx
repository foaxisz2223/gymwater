import { useState, useEffect } from 'react';
import { Droplet, Plus, Minus, Flame, Calendar, Trophy, Medal, Check } from 'lucide-react';
import { startOfWeek, format, isSameDay, isSameWeek, subDays, parseISO, addDays, differenceInCalendarDays, differenceInCalendarWeeks } from 'date-fns';

const WATER_GOAL = 6;
const GYM_GOAL = 4;
const GYM_PERFECT_MIN = 3;
const WATER_PERFECT_MIN = 5;

interface HistoryItem {
  weekStart: string;
  gymCount: number;
  waterHits: number;
  perfectWeek: boolean;
}

interface AppState {
  waterDate: string;
  waterCount: number;
  gymWeekStart: string;
  gymDays: boolean[];
  waterHitsThisWeek: string[];
  waterStreak: number;
  lastWaterHitDate: string | null;
  gymStreak: number;
  lastGymHitWeek: string | null;
  history: HistoryItem[];
}

const getInitialState = (): AppState => {
  const saved = localStorage.getItem('trackerState');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing state', e);
    }
  }
  
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 0 }).toISOString();
  
  return {
    waterDate: today.toISOString(),
    waterCount: 0,
    gymWeekStart: startOfCurrentWeek,
    gymDays: Array(7).fill(false),
    waterHitsThisWeek: [],
    waterStreak: 0,
    lastWaterHitDate: null,
    gymStreak: 0,
    lastGymHitWeek: null,
    history: []
  };
};

export default function App() {
  const [state, setState] = useState<AppState>(getInitialState);
  const [toasts, setToasts] = useState<{id: number, msg: string}[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const checkRollover = () => {
    setState(currentState => {
      const today = new Date();
      const currentWaterDate = parseISO(currentState.waterDate);
      const currentWeekStart = parseISO(currentState.gymWeekStart);
      const actualWeekStart = startOfWeek(today, { weekStartsOn: 0 });

      let newState = { ...currentState };
      let changed = false;

      // Rollover Day
      if (!isSameDay(today, currentWaterDate)) {
        newState.waterDate = today.toISOString();
        newState.waterCount = 0;
        changed = true;
        
        // Check se a ofensiva de água foi quebrada
        if (newState.lastWaterHitDate) {
          const lastHit = parseISO(newState.lastWaterHitDate);
          if (differenceInCalendarDays(today, lastHit) > 1) {
            newState.waterStreak = 0;
          }
        }
      }

      // Rollover Week
      if (!isSameWeek(today, currentWeekStart, { weekStartsOn: 0 })) {
        const gymCount = newState.gymDays.filter(Boolean).length;
        const waterHits = newState.waterHitsThisWeek.length;
        const perfectWeek = gymCount >= GYM_PERFECT_MIN && waterHits >= WATER_PERFECT_MIN;
        
        const newHistoryItem: HistoryItem = {
          weekStart: newState.gymWeekStart,
          gymCount,
          waterHits,
          perfectWeek
        };

        if (gymCount >= GYM_PERFECT_MIN) {
          if (!newState.lastGymHitWeek || differenceInCalendarWeeks(actualWeekStart, parseISO(newState.lastGymHitWeek), { weekStartsOn: 0 }) === 1) {
            newState.gymStreak += 1;
          }
          newState.lastGymHitWeek = newState.gymWeekStart;
        } else {
          newState.gymStreak = 0;
        }

        newState.history = [newHistoryItem, ...newState.history].slice(0, 8); // Mantém últimas 8 semanas
        newState.gymWeekStart = actualWeekStart.toISOString();
        newState.gymDays = Array(7).fill(false);
        newState.waterHitsThisWeek = [];
        changed = true;
      }

      if (changed) {
        localStorage.setItem('trackerState', JSON.stringify(newState));
        return newState;
      }
      return currentState;
    });
  };

  useEffect(() => {
    checkRollover(); // Verifica no primeiro load
    const interval = setInterval(checkRollover, 60000); // Polling a cada minuto
    
    // Verifica toda vez que a aba ganha foco novamente (ideal para mobile)
    const onFocus = () => checkRollover();
    window.addEventListener('focus', onFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const showToast = (message: string) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg: message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleWaterAdd = () => {
    if (state.waterCount >= 10) return; // arbitrary max
    const newCount = state.waterCount + 1;
    updateWater(newCount);
  };

  const handleWaterRemove = () => {
    if (state.waterCount <= 0) return;
    const newCount = state.waterCount - 1;
    updateWater(newCount);
  };

  const updateWater = (newCount: number) => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    let newHits = [...state.waterHitsThisWeek];
    let newStreak = state.waterStreak;
    let newLastHit = state.lastWaterHitDate;

    const previouslyHit = state.waterCount >= WATER_GOAL;
    const nowHit = newCount >= WATER_GOAL;

    if (!previouslyHit && nowHit) {
      if (!newHits.includes(todayStr)) {
        newHits.push(todayStr);
      }
      // Update streak
      if (!newLastHit || differenceInCalendarDays(today, parseISO(newLastHit)) === 1) {
        newStreak += 1;
      } else if (newLastHit !== todayStr) {
        newStreak = 1;
      }
      newLastHit = todayStr;
      showToast("Meta de água atingida! 💧");
    } else if (previouslyHit && !nowHit) {
      newHits = newHits.filter(d => d !== todayStr);
      // We removed a hit, rollback streak if it was today
      if (newLastHit === todayStr) {
        newStreak = Math.max(0, newStreak - 1);
        newLastHit = newStreak > 0 ? format(subDays(today, 1), 'yyyy-MM-dd') : null;
      }
    }

    const newState = {
      ...state,
      waterCount: newCount,
      waterHitsThisWeek: newHits,
      waterStreak: newStreak,
      lastWaterHitDate: newLastHit
    };
    setState(newState);
    localStorage.setItem('trackerState', JSON.stringify(newState));
  };

  const toggleGymDay = (index: number) => {
    const newGymDays = [...state.gymDays];
    newGymDays[index] = !newGymDays[index];
    
    const count = newGymDays.filter(Boolean).length;
    if (newGymDays[index] && count === GYM_GOAL) {
      showToast("Meta de academia da semana! 🏋️");
    }

    const newState = { ...state, gymDays: newGymDays };
    setState(newState);
    localStorage.setItem('trackerState', JSON.stringify(newState));
  };

  if (!isClient) return null;

  const waterProgress = Math.min((state.waterCount / WATER_GOAL) * 100, 100);
  const isWaterGoalHit = state.waterCount >= WATER_GOAL;
  
  const gymCount = state.gymDays.filter(Boolean).length;
  const gymProgress = Math.min((gymCount / GYM_GOAL) * 100, 100);
  const isGymGoalHit = gymCount >= GYM_GOAL;

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const currentDayIndex = new Date().getDay();

  return (
    <>
      <header>
        <div className="streak-container">
          <div className={`streak-badge ${state.waterStreak > 0 ? 'active' : ''}`}>
            <Flame size={24} />
            <span>{state.waterStreak} {state.waterStreak === 1 ? 'Dia' : 'Dias'}</span>
          </div>
          <div className={`streak-badge ${state.gymStreak > 0 ? 'active' : ''}`}>
            <Flame size={24} />
            <span>{state.gymStreak} {state.gymStreak === 1 ? 'Sem' : 'Semanas'}</span>
          </div>
        </div>
      </header>

      {/* WATER TRACKER */}
      <section className="card">
        <h2>
          <Droplet size={24} className={isWaterGoalHit ? "text-gradient-success" : "text-gradient-water"} />
          Tracker de Água
        </h2>
        <div className="flex-between">
          <p>Meta Diária</p>
          <div className="stat-pill">
            <span className={isWaterGoalHit ? "text-gradient-success" : "text-gradient-water"} style={{ fontSize: '20px' }}>
              {state.waterCount}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>/ {WATER_GOAL}</span>
          </div>
        </div>
        
        <div className="water-grid">
          {Array.from({ length: WATER_GOAL }).map((_, i) => (
            <div key={i} className={`water-bottle ${i < state.waterCount ? 'filled' : ''}`}>
              <Droplet size={20} fill={i < state.waterCount ? 'currentColor' : 'none'} />
            </div>
          ))}
        </div>

        <div className="controls">
          <button className="btn btn-remove" onClick={handleWaterRemove} disabled={state.waterCount === 0}>
            <Minus size={20} />
          </button>
          <button className="btn btn-add" onClick={handleWaterAdd}>
            <Plus size={20} />
            Adicionar
          </button>
        </div>

        <div className="progress-container">
          <div 
            className="progress-bar" 
            style={{ 
              width: `${waterProgress}%`,
              background: isWaterGoalHit ? 'linear-gradient(135deg, var(--success-start), var(--success-end))' : 'linear-gradient(135deg, var(--water-start), var(--water-end))'
            }} 
          />
        </div>
      </section>

      {/* GYM TRACKER */}
      <section className="card">
        <h2>
          <Calendar size={24} className={isGymGoalHit ? "text-gradient-success" : "text-gradient-gym"} />
          Tracker de Academia
        </h2>
        <div className="flex-between">
          <p>Treinos na Semana</p>
          <div className="stat-pill">
            <span className={isGymGoalHit ? "text-gradient-success" : "text-gradient-gym"} style={{ fontSize: '20px' }}>
              {gymCount}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>/ {GYM_GOAL}</span>
          </div>
        </div>

        <div className="gym-grid">
          {weekDays.map((label, i) => {
            const isToday = i === currentDayIndex;
            const isActive = state.gymDays[i];
            return (
              <div key={i} className="gym-day">
                <span className="day-label" style={{ color: isToday ? 'var(--text-main)' : undefined }}>
                  {label}
                </span>
                <div 
                  className={`day-circle ${isActive ? 'active' : ''} ${isToday && !isActive ? 'today' : ''}`}
                  onClick={() => toggleGymDay(i)}
                >
                  {isActive && <Check size={16} strokeWidth={4} />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="progress-container">
          <div 
            className="progress-bar" 
            style={{ 
              width: `${gymProgress}%`,
              background: isGymGoalHit ? 'linear-gradient(135deg, var(--success-start), var(--success-end))' : 'linear-gradient(135deg, var(--gym-start), var(--gym-end))'
            }} 
          />
        </div>
      </section>

      {/* HISTORY */}
      <section className="card">
        <h2>
          <Trophy size={24} style={{ color: '#f6d365' }} />
          Histórico (Últimas 8 semanas)
        </h2>
        
        {state.history.length === 0 ? (
          <p style={{ textAlign: 'center', margin: '24px 0', fontStyle: 'italic' }}>
            O histórico aparecerá na próxima semana.
          </p>
        ) : (
          <div className="history-list">
            {state.history.map((item, i) => {
              const startDate = parseISO(item.weekStart);
              const endDate = addDays(startDate, 6);
              const weekLabel = `${format(startDate, 'dd/MM')} - ${format(endDate, 'dd/MM')}`;
              
              return (
                <div key={i} className="history-item">
                  <div className="history-info">
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{weekLabel}</div>
                      <div className="history-stats">
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: 13 }}>
                          <Droplet size={14} /> {item.waterHits} dias
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: 13 }}>
                          <Calendar size={14} /> {item.gymCount}x
                        </span>
                      </div>
                    </div>
                  </div>
                  {item.perfectWeek && (
                    <div className="perfect-week">
                      <Medal size={14} />
                      Perfeita
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            <Check size={18} style={{ color: 'var(--success-start)' }} />
            {toast.msg}
          </div>
        ))}
      </div>
    </>
  );
}
