import React, { useState, useEffect, useRef } from 'react';
import { ReverseQuestion, FlagQuestion } from '../types.js';
import { 
  Gamepad2, 
  RotateCcw, 
  Send, 
  Timer, 
  Award, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Sparkles,
  Bot,
  Flame,
} from 'lucide-react';

interface SimulatorProps {
  onWinRecorded?: () => void;
}

export const DiscordGameSimulator: React.FC<SimulatorProps> = ({ onWinRecorded }) => {
  const [gameMode, setGameMode] = useState<'reverse' | 'flags' | 'harf' | 'guess_number' | 'button' | 'fastest' | 'disassemble' | 'xo' | 'mafia' | 'hide_and_seek' | 'chairs'>('reverse');
  const [gameState, setGameState] = useState<'idle' | 'running' | 'won' | 'timeout'>('idle');
  
  // Game Questions
  const [reverseQ, setReverseQ] = useState<ReverseQuestion | null>(null);
  const [flagQ, setFlagQ] = useState<FlagQuestion | null>(null);
  const [harfQ, setHarfQ] = useState<{ letter: string; category: string; timerSeconds: number; points: number; sampleValidAnswers?: string[] } | null>(null);
  const [guessQ, setGuessQ] = useState<{ secretNumber: number; timerSeconds: number; points: number } | null>(null);
  const [guessAttemptsCount, setGuessAttemptsCount] = useState<number>(0);
  const [buttonQ, setButtonQ] = useState<{ targetIndex: number; timerSeconds: number; points: number; startTime: number } | null>(null);
  const [fastestQ, setFastestQ] = useState<{ phrase: string; timerSeconds: number; points: number; startTime: number } | null>(null);
  const [disassembleQ, setDisassembleQ] = useState<{ word: string; expectedAnswer: string; timerSeconds: number; points: number; startTime: number } | null>(null);

  // XO State
  const [xoBoard, setXOBoard] = useState<Array<string | null>>(Array(9).fill(null));
  const [xoTurn, setXOTurn] = useState<'X' | 'O'>('X');
  const [player2Name, setPlayer2Name] = useState('المنافس (O)');
  const [xoWinner, setXOWinner] = useState<'X' | 'O' | null>(null);
  const [xoWinningCombo, setXOWinningCombo] = useState<number[] | null>(null);
  const [isXODraw, setIsXODraw] = useState(false);

  // Mafia State
  const [mafiaPhase, setMafiaPhase] = useState<'idle' | 'lobby' | 'night' | 'day_announcement' | 'day_discussion' | 'day_vote' | 'ended'>('idle');
  const [mafiaPlayers, setMafiaPlayers] = useState<Array<{ name: string; role: 'mafia' | 'detective' | 'doctor' | 'civilian'; isAlive: boolean }>>([]);
  const [mafiaCycle, setMafiaCycle] = useState<number>(1);
  const [mafiaVotes, setMafiaVotes] = useState<Record<string, string>>({}); // voterName -> targetName
  const [mafiaMyRole, setMafiaMyRole] = useState<'mafia' | 'detective' | 'doctor' | 'civilian' | null>(null);
  const [mafiaDMs, setMafiaDMs] = useState<Array<{ text: string; time: string }>>([]);
  const [mafiaDoctorChoice, setMafiaDoctorChoice] = useState<string | null>(null);

  // Hide & Seek State
  const [hasPhase, setHasPhase] = useState<'idle' | 'lobby' | 'hiding' | 'seeking' | 'ended'>('idle');
  const [hasPlayers, setHasPlayers] = useState<Array<{ name: string; role: 'seeker' | 'hider'; location: string | null; found: boolean }>>([]);
  const [hasAttempts, setHasAttempts] = useState<number>(0);
  const [hasMaxAttempts, setHasMaxAttempts] = useState<number>(0);
  const [hasSeeker, setHasSeeker] = useState<string>('');
  const [hasMyRole, setHasMyRole] = useState<'seeker' | 'hider' | null>(null);
  const [hasMyHiddenSpot, setHasMyHiddenSpot] = useState<string | null>(null);

  // Musical Chairs State
  const [chairsPhase, setChairsPhase] = useState<'idle' | 'lobby' | 'music' | 'sitting' | 'round_end' | 'ended'>('idle');
  const [chairsPlayers, setChairsPlayers] = useState<string[]>([]);
  const [chairsRound, setChairsRound] = useState<number>(1);
  const [chairsCount, setChairsCount] = useState<number>(0);
  const [chairsOccupied, setChairsOccupied] = useState<Record<number, string>>({});
  const [chairsUserSeat, setChairsUserSeat] = useState<number | null>(null);
  const chairsBotTimersRef = useRef<NodeJS.Timeout[]>([]);
  const chairsPhaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chairsActivePlayersRef = useRef<string[]>([]);
  const chairsOccupiedRef = useRef<Record<number, string>>({});
  const chairsRoundRef = useRef<number>(1);

  // Player State
  const [playerName, setPlayerName] = useState('البطل المغامر');
  const [userInput, setUserInput] = useState('');
  const [lockedPlayers, setLockedPlayers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string; details?: string } | null>(null);
  
  // Timers & Life-cycle Refs
  const [timeLeft, setTimeLeft] = useState(15);
  const [initialTime, setInitialTime] = useState(15);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRoundEndedRef = useRef<boolean>(true);

  // Stats in session
  const [sessionPoints, setSessionPoints] = useState(0);
  const [sessionWins, setSessionWins] = useState(0);
  const [streak, setStreak] = useState(0);

  // Chat message log simulation
  const [chatLog, setChatLog] = useState<Array<{ sender: 'bot' | 'user' | 'system'; text?: string; embed?: any; time: string; isXO?: boolean; isButtonGame?: boolean; isMafiaLobby?: boolean; isMafiaNight?: boolean; isMafiaVote?: boolean; isChairsLobby?: boolean; isChairsSitting?: boolean }>>([]);

  const clearAllChairsTimers = () => {
    if (chairsPhaseTimerRef.current) {
      clearTimeout(chairsPhaseTimerRef.current);
      chairsPhaseTimerRef.current = null;
    }
    chairsBotTimersRef.current.forEach(t => clearTimeout(t));
    chairsBotTimersRef.current = [];
  };

  // Clear timer helper
  const clearActiveTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    clearAllChairsTimers();
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      clearActiveTimer();
    };
  }, []);

  // Timer Tick Handler
  useEffect(() => {
    if (gameState === 'running') {
      clearActiveTimer();
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearActiveTimer();
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearActiveTimer();
    }
    return () => {
      clearActiveTimer();
    };
  }, [gameState]);

  // Start a new Reverse Game Round
  const startReverseRound = async () => {
    try {
      clearActiveTimer();
      isRoundEndedRef.current = false;
      setGameState('idle');
      setUserInput('');
      setLockedPlayers([]);
      setFeedback(null);

      const res = await fetch('/api/simulate/reverse/random');
      const data: ReverseQuestion = await res.json();
      
      setReverseQ(data);
      const timerSec = data.timerSeconds || 15;
      setInitialTime(timerSec);
      setTimeLeft(timerSec);
      setGameState('running');

      const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'bot',
          embed: {
            title: '🎮 لعبة اعكس — أسرع إجابة تفوز!',
            description: `المطلوب: قم بكتابة الكلمة التالية **بالعكس (حرفاً بحرف)** بأسرع ما يمكن!\n\n🔤 الكلمة: **\`${data.word}\`**\n⏱️ الوقت: ${timerSec} ثانية | التصنيف: ${data.category}`,
            color: 'border-purple-500 bg-purple-950/20 text-purple-200',
          },
          time: now,
        },
      ]);
    } catch (err) {
      console.error('Error starting reverse round:', err);
    }
  };

  // Start a new Flags Game Round
  const startFlagsRound = async () => {
    try {
      clearActiveTimer();
      isRoundEndedRef.current = false;
      setGameState('idle');
      setUserInput('');
      setLockedPlayers([]);
      setFeedback(null);

      const res = await fetch('/api/simulate/flags/random');
      const data: FlagQuestion = await res.json();

      setFlagQ(data);
      const timerSec = data.timerSeconds || 15;
      setInitialTime(timerSec);
      setTimeLeft(timerSec);
      setGameState('running');

      const flagUrl = data.flagImageUrl || `https://flagcdn.com/w640/${data.code.toLowerCase()}.png`;

      const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'bot',
          embed: {
            title: 'خمن العلم!',
            imageUrl: flagUrl,
            description: `⏱️ الوقت: **${timerSec} ثانية**\n💡 اكتب اسم الدولة في الشات مباشرة! (يمكنك المحاولة عدة مرات)`,
            color: 'border-sky-500 bg-sky-950/20 text-sky-200',
          },
          time: now,
        },
      ]);
    } catch (err) {
      console.error('Error starting flags round:', err);
    }
  };

  // Start a new Harf Game Round
  const startHarfRound = async () => {
    try {
      clearActiveTimer();
      isRoundEndedRef.current = false;
      setGameState('idle');
      setUserInput('');
      setLockedPlayers([]);
      setFeedback(null);

      const res = await fetch('/api/simulate/harf/random');
      const data = await res.json();

      setHarfQ(data);
      const timerSec = data.timerSeconds || 15;
      setInitialTime(timerSec);
      setTimeLeft(timerSec);
      setGameState('running');

      const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'bot',
          embed: {
            title: '🔤 لعبة حرف — أسرع إجابة تفوز!',
            description: `المطلوب: اذكر **${data.category}** يبدأ بحرف **\`${data.letter}\`** بأسرع ما يمكن!\n\n🔤 الحرف: **\`${data.letter}\`**\n📂 التصنيف: **${data.category}**\n⏱️ الوقت: ${timerSec} ثانية | النقاط: ${data.points || 10}`,
            color: 'border-emerald-500 bg-emerald-950/20 text-emerald-200',
          },
          time: now,
        },
      ]);
    } catch (err) {
      console.error('Error starting harf round:', err);
    }
  };

  // Start a new Hide & Seek Round
  const startHideAndSeekRound = () => {
    clearActiveTimer();
    isRoundEndedRef.current = false;
    setGameState('running');
    setUserInput('');
    setFeedback(null);
    setHasPhase('lobby');
    setHasMyRole(null);
    setHasMyHiddenSpot(null);

    // Pre-create 4 players (User + 3 bots)
    const playersInit = [
      { name: playerName, role: 'hider' as const, location: null as string | null, found: false },
      { name: 'أحمد', role: 'hider' as const, location: null as string | null, found: false },
      { name: 'خالد', role: 'hider' as const, location: null as string | null, found: false },
      { name: 'سارة', role: 'hider' as const, location: null as string | null, found: false },
    ];

    setHasPlayers(playersInit);

    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    setChatLog((prev) => [
      ...prev,
      {
        sender: 'bot',
        isButtonGame: true,
        isMafiaLobby: true, // reuse visual container style
        embed: {
          title: '🙈 لعبة غميضة — Hide & Seek',
          description: `🏃 **"اهرب واختبئ قبل أن يمسك بك الباحث!"**\n\n` +
            `👥 **اللاعبون المنضمون (4/12):**\n` +
            `1. @${playerName} (منشئ اللعبة 👑)\n` +
            `2. @أحمد\n` +
            `3. @خالد\n` +
            `4. @سارة\n\n` +
            `💡 اضغط على زر **بدء اللعبة** لبدء مرحلة توزيع الأدوار والاختباء!`,
          color: 'border-blue-500 bg-blue-950/20 text-blue-200',
        },
        time: now,
      },
    ]);
  };

  const handleHasStart = () => {
    if (hasPhase !== 'lobby') return;
    setHasPhase('hiding');

    // Assign roles: 1 random seeker, rest hiders
    const seekerIndex = Math.floor(Math.random() * 4);
    const updatedPlayers = hasPlayers.map((p, idx) => {
      const isSeeker = idx === seekerIndex;
      return {
        ...p,
        role: (isSeeker ? 'seeker' : 'hider') as 'seeker' | 'hider',
      };
    });

    setHasPlayers(updatedPlayers);
    const myPlayer = updatedPlayers.find(p => p.name === playerName);
    const isUserSeeker = myPlayer?.role === 'seeker';
    setHasMyRole(isUserSeeker ? 'seeker' : 'hider');
    
    const seekerName = updatedPlayers.find(p => p.role === 'seeker')?.name || '';
    setHasSeeker(seekerName);

    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    setChatLog((prev) => [
      ...prev,
      {
        sender: 'system',
        text: `📢 تم توزيع الأدوار!\n${isUserSeeker ? '🙈 دورك السري: **الباحث**!' : '🫣 دورك السري: **مختبئ**! اهرب واختبئ بسرعة.'}`,
        time: now,
      },
      {
        sender: 'bot',
        embed: {
          title: '🙈 تم اختيار الباحث سراً!',
          description: `🫣 **وقت الاختباء بدأ (15 ثانية)!**\n` +
            `يرجى من جميع المختبئين اختيار مكانهم من الأزرار بالأسفل.`,
          color: 'border-amber-500 bg-amber-950/20 text-amber-200',
        },
        time: now,
      }
    ]);
  };

  const handleHasHide = (spotId: string, spotName: string) => {
    if (hasPhase !== 'hiding') return;
    setHasMyHiddenSpot(spotId);

    // Update player location for user
    const updatedPlayers = hasPlayers.map(p => {
      if (p.name === playerName) {
        return { ...p, location: spotId };
      }
      return p;
    });

    // Make computer players (hiders) hide randomly
    const locations = ['sofa', 'door', 'box', 'plant', 'table', 'closet'];
    const finalPlayers = updatedPlayers.map(p => {
      if (p.role === 'hider' && p.name !== playerName) {
        const randomLoc = locations[Math.floor(Math.random() * locations.length)];
        return { ...p, location: randomLoc };
      }
      return p;
    });

    setHasPlayers(finalPlayers);

    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    setChatLog((prev) => [
      ...prev,
      {
        sender: 'system',
        text: `✅ اختبأت بنجاح في: **${spotName}**!`,
        time: now,
      }
    ]);

    // Fast-forward to seeking phase
    handleHasStartSeeking(finalPlayers);
  };

  const handleHasStartSeeking = (playersList: typeof hasPlayers) => {
    setHasPhase('seeking');
    const hidersCount = playersList.filter(p => p.role === 'hider').length;
    const maxAtt = hidersCount + 2;
    setHasMaxAttempts(maxAtt);
    setHasAttempts(maxAtt);

    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    setChatLog((prev) => [
      ...prev,
      {
        sender: 'bot',
        text: `🔎 **بدأ البحث!** لقد تم الإعلان عن الباحث وهو: @${hasSeeker || playersList.find(p => p.role === 'seeker')?.name}`,
        time: now,
      }
    ]);

    // If user is hider, simulate Seeker searching locations automatically
    if (hasMyRole === 'hider') {
      simulateBotSearching(playersList, maxAtt);
    }
  };

  const simulateBotSearching = async (currentPlayers: typeof hasPlayers, initialAtt: number) => {
    let tempPlayers = [...currentPlayers];
    let attemptsLeft = initialAtt;
    const locations = [
      { id: 'sofa', name: '🛋️ الكنبة' },
      { id: 'door', name: '🚪 خلف الباب' },
      { id: 'box', name: '📦 داخل الصندوق' },
      { id: 'plant', name: '🪴 خلف النبتة' },
      { id: 'table', name: '🪑 تحت الطاولة' },
      { id: 'closet', name: '🧥 داخل الخزانة' }
    ];

    const seekerName = hasSeeker || currentPlayers.find(p => p.role === 'seeker')?.name || 'الباحث';

    for (let step = 0; step < initialAtt; step++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (isRoundEndedRef.current) break;

      const randomSpot = locations[Math.floor(Math.random() * locations.length)];
      const foundInSpot = tempPlayers.filter(p => p.role === 'hider' && p.location === randomSpot.id && !p.found);

      const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

      if (foundInSpot.length > 0) {
        tempPlayers = tempPlayers.map(p => {
          if (p.location === randomSpot.id) {
            return { ...p, found: true };
          }
          return p;
        });
        setHasPlayers(tempPlayers);

        const foundNames = foundInSpot.map(p => `@${p.name}`).join(', ');
        setChatLog((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: `🎯 **تم العثور على لاعب!** وجد @${seekerName} ${foundNames} في **${randomSpot.name}**!`,
            time: now,
          }
        ]);
      } else {
        setChatLog((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: `❌ **ما لقيت أحد!** بحث @${seekerName} في **${randomSpot.name}** ولم يجد أحداً هناك.`,
            time: now,
          }
        ]);
      }

      attemptsLeft--;
      setHasAttempts(attemptsLeft);

      const remainingHiders = tempPlayers.filter(p => p.role === 'hider' && !p.found);
      if (remainingHiders.length === 0) {
        handleHasEndGame('seeker', tempPlayers);
        break;
      }

      if (attemptsLeft <= 0) {
        handleHasEndGame('hiders', tempPlayers);
        break;
      }
    }
  };

  const handleHasSeekClick = (spotId: string, spotName: string) => {
    if (hasPhase !== 'seeking' || hasMyRole !== 'seeker' || hasAttempts <= 0) return;

    let tempPlayers = [...hasPlayers];
    const foundInSpot = tempPlayers.filter(p => p.role === 'hider' && p.location === spotId && !p.found);
    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    if (foundInSpot.length > 0) {
      tempPlayers = tempPlayers.map(p => {
        if (p.location === spotId) {
          return { ...p, found: true };
        }
        return p;
      });
      setHasPlayers(tempPlayers);

      const foundNames = foundInSpot.map(p => `@${p.name}`).join(', ');
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `🎯 **تم العثور على لاعب!** وجد @${playerName} ${foundNames} في **${spotName}**!`,
          time: now,
        }
      ]);
    } else {
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `❌ **ما لقيت أحد!** بحث @${playerName} في **${spotName}** ولم يجد أحداً هناك.`,
          time: now,
        }
      ]);
    }

    const nextAttempts = hasAttempts - 1;
    setHasAttempts(nextAttempts);

    const remainingHiders = tempPlayers.filter(p => p.role === 'hider' && !p.found);
    if (remainingHiders.length === 0) {
      handleHasEndGame('seeker', tempPlayers);
    } else if (nextAttempts <= 0) {
      handleHasEndGame('hiders', tempPlayers);
    }
  };

  const handleHasEndGame = (winner: 'seeker' | 'hiders', finalPlayers: typeof hasPlayers) => {
    setHasPhase('ended');
    setGameState('idle');
    isRoundEndedRef.current = true;

    const isUserWin = (winner === 'seeker' && hasMyRole === 'seeker') || (winner === 'hiders' && hasMyRole === 'hider' && !finalPlayers.find(p => p.name === playerName)?.found);

    const pointsToAward = 10;
    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    const foundList = finalPlayers.filter(p => p.role === 'hider' && p.found);
    const survivorList = finalPlayers.filter(p => p.role === 'hider' && !p.found);

    const locationsMap: Record<string, string> = {
      sofa: '🛋️ الكنبة',
      door: '🚪 خلف الباب',
      box: '📦 داخل الصندوق',
      plant: '🪴 خلف النبتة',
      table: '🪑 تحت الطاولة',
      closet: '🧥 داخل الخزانة'
    };

    setChatLog((prev) => [
      ...prev,
      {
        sender: 'bot',
        embed: {
          title: '🙈 انتهت لعبة غميضة!',
          description: `🏆 **الفائزون:** ${winner === 'seeker' ? 'الباحث 🕵️' : 'المختبئون الناجون 🫣'}\n\n` +
            `🔎 **الباحث:** @${hasSeeker || finalPlayers.find(p => p.role === 'seeker')?.name}\n\n` +
            `🎯 **الذين تم العثور عليهم (${foundList.length}):**\n${foundList.map(p => `• @${p.name} (${locationsMap[p.location || '']})`).join('\n') || '• لا أحد'}\n\n` +
            `🫣 **الناجون (${survivorList.length}):**\n${survivorList.map(p => `• @${p.name} (${locationsMap[p.location || '']})`).join('\n') || '• لا أحد'}\n\n` +
            `⭐ **النقاط المكتسبة:** ${isUserWin ? `@${playerName} (**+${pointsToAward}**)` : 'لا أحد من اللاعبين الفعليين'}`,
          color: winner === 'seeker' ? 'border-red-500 bg-red-950/20 text-red-200' : 'border-green-500 bg-green-950/20 text-green-200',
        },
        time: now,
      }
    ]);

    if (isUserWin) {
      setSessionPoints(prev => prev + pointsToAward);
      setSessionWins(prev => prev + 1);
      setStreak(prev => prev + 1);
      if (onWinRecorded) {
        fetch('/api/simulate/hide-and-seek/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerName, points: pointsToAward })
        }).then(() => onWinRecorded()).catch(err => console.error(err));
      }
    } else {
      setStreak(0);
    }
  };

  // Musical Chairs Simulator Handlers
  const startChairsRound = () => {
    clearActiveTimer();
    isRoundEndedRef.current = false;
    setGameState('running');
    setUserInput('');
    setFeedback(null);
    setChairsPhase('lobby');
    setChairsRound(1);
    chairsRoundRef.current = 1;
    setChairsUserSeat(null);
    setChairsOccupied({});
    chairsOccupiedRef.current = {};

    const initialPlayers = [playerName, 'خالد', 'سارة', 'عمر'];
    setChairsPlayers(initialPlayers);
    chairsActivePlayersRef.current = initialPlayers;

    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    setChatLog((prev) => [
      ...prev,
      {
        sender: 'bot',
        isButtonGame: true,
        isChairsLobby: true,
        embed: {
          title: '🪑 كراسي — Musical Chairs',
          description: `🎵 **"استعد... الموسيقى بتوقف بأي لحظة!"**\n\n` +
            `👥 **اللاعبون المنضمون (${initialPlayers.length}/12):**\n` +
            initialPlayers.map((p, idx) => `${idx + 1}. @${p} ${p === playerName ? '(صاحب اللعبة 👑)' : ''}`).join('\n') +
            `\n\n💡 الحد الأدنى: **4 لاعبين** | الحد الأقصى: **12 لاعباً**\n` +
            `اضغط على **🟢 انضمام** لإضافة لاعب، أو **▶️ بدء اللعبة** للانطلاق!`,
          color: 'border-amber-500 bg-amber-950/20 text-amber-200',
        },
        time: now,
      },
    ]);
  };

  const handleChairsAddBot = () => {
    if (chairsPhase !== 'lobby') return;
    const pool = ['فهد', 'نورة', 'سعد', 'ريم', 'عبدالله', 'هند', 'يوسف', 'لمى'];
    const current = chairsPlayers;
    if (current.length >= 12) return;
    const available = pool.filter(n => !current.includes(n));
    if (available.length === 0) return;
    const nextPlayer = available[0];
    const updated = [...current, nextPlayer];
    setChairsPlayers(updated);
    chairsActivePlayersRef.current = updated;

    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    setChatLog((prev) => [
      ...prev,
      {
        sender: 'system',
        text: `✅ انضم @${nextPlayer} إلى غرفة كراسي! (${updated.length}/12)`,
        time: now,
      }
    ]);
  };

  const handleChairsStart = () => {
    if (chairsPhase !== 'lobby') return;
    if (chairsPlayers.length < 4) {
      setFeedback({ isCorrect: false, text: '❌ تحتاج 4 لاعبين على الأقل لبدء لعبة كراسي.' });
      return;
    }
    const active = [...chairsPlayers];
    chairsActivePlayersRef.current = active;
    startChairsMusicPhase(active, 1);
  };

  const startChairsMusicPhase = (active: string[], roundNum: number) => {
    clearAllChairsTimers();
    setChairsPhase('music');
    setChairsRound(roundNum);
    chairsRoundRef.current = roundNum;
    const cCount = active.length - 1;
    setChairsCount(cCount);
    setChairsOccupied({});
    chairsOccupiedRef.current = {};
    setChairsUserSeat(null);

    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    setChatLog((prev) => [
      ...prev,
      {
        sender: 'bot',
        embed: {
          title: `🎵 كراسي — الجولة ${roundNum}`,
          description: `🎵 **الموسيقى شغالة...**\n\n` +
            `👥 **اللاعبون (${active.length}):**\n` +
            active.map(p => `• @${p}`).join('\n') + `\n\n` +
            `🪑 **الكراسي المتاحة:** ${cCount}\n\n` +
            `*خلي أصابعك جاهزة... الكراسي بتنزل بأي لحظة!*`,
          color: 'border-yellow-500 bg-yellow-950/20 text-yellow-200',
        },
        time: now,
      }
    ]);

    // Random music delay: 3500ms - 5000ms
    const musicMs = Math.floor(Math.random() * 1500) + 3500;
    chairsPhaseTimerRef.current = setTimeout(() => {
      revealChairsPhase(active, roundNum, cCount);
    }, musicMs);
  };

  const revealChairsPhase = (active: string[], roundNum: number, cCount: number) => {
    setChairsPhase('sitting');
    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    setChatLog((prev) => [
      ...prev,
      {
        sender: 'bot',
        isButtonGame: true,
        isChairsSitting: true,
        embed: {
          title: '🚨 اجلس الآن!',
          description: `🪑 **اجلس بسرعة!**\n\n` +
            `👥 **اللاعبون:** ${active.length}\n` +
            `🪑 **الكراسي المتاحة:** ${cCount}\n\n` +
            `⏱️ أمامكم **5 ثوانٍ** فقط لحجز كرسي! اضغط على أي كرسي متاح!`,
          color: 'border-red-500 bg-red-950/20 text-red-200',
        },
        time: now,
      }
    ]);

    // Bot players attempt to sit after randomized human-like delays
    const bots = active.filter(p => p !== playerName);
    bots.forEach(bot => {
      const botDelay = Math.floor(Math.random() * 2200) + 800; // 800ms - 3000ms
      const t = setTimeout(() => {
        const currentOcc = chairsOccupiedRef.current;
        const availableChairs: number[] = [];
        for (let i = 1; i <= cCount; i++) {
          if (!currentOcc[i]) availableChairs.push(i);
        }
        if (availableChairs.length > 0) {
          const chosenChair = availableChairs[Math.floor(Math.random() * availableChairs.length)];
          const newOcc = { ...chairsOccupiedRef.current, [chosenChair]: bot };
          chairsOccupiedRef.current = newOcc;
          setChairsOccupied(newOcc);

          if (Object.keys(newOcc).length >= cCount) {
            clearAllChairsTimers();
            concludeChairsRound(active, roundNum, newOcc);
          }
        }
      }, botDelay);
      chairsBotTimersRef.current.push(t);
    });

    // 5 seconds window timeout
    chairsPhaseTimerRef.current = setTimeout(() => {
      concludeChairsRound(active, roundNum, chairsOccupiedRef.current);
    }, 5000);
  };

  const handleChairsSeatClick = (chairNum: number) => {
    if (chairsPhase !== 'sitting') return;
    if (chairsUserSeat !== null) {
      setFeedback({ isCorrect: false, text: `❌ أنت جالس بالفعل على الكرسي رقم ${chairsUserSeat}!` });
      return;
    }
    if (chairsOccupiedRef.current[chairNum]) {
      setFeedback({ isCorrect: false, text: '❌ هذا الكرسي انحجز قبلك!' });
      return;
    }

    // Atomic seat assignment
    const newOcc = { ...chairsOccupiedRef.current, [chairNum]: playerName };
    chairsOccupiedRef.current = newOcc;
    setChairsOccupied(newOcc);
    setChairsUserSeat(chairNum);
    setFeedback({ isCorrect: true, text: `🪑 جلست بنجاح على الكرسي ${chairNum}!` });

    // If all chairs filled, conclude immediately
    if (Object.keys(newOcc).length >= chairsCount) {
      clearAllChairsTimers();
      concludeChairsRound(chairsActivePlayersRef.current, chairsRoundRef.current, newOcc);
    }
  };

  const concludeChairsRound = (active: string[], roundNum: number, finalOcc: Record<number, string>) => {
    clearAllChairsTimers();
    setChairsPhase('round_end');

    const seated = Object.values(finalOcc);
    const nonSeated = active.filter(p => !seated.includes(p));

    let eliminated = '';
    if (nonSeated.length > 0) {
      eliminated = nonSeated[Math.floor(Math.random() * nonSeated.length)];
    } else {
      eliminated = active[Math.floor(Math.random() * active.length)];
    }

    const survivors = active.filter(p => p !== eliminated);
    chairsActivePlayersRef.current = survivors;

    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    setChatLog((prev) => [
      ...prev,
      {
        sender: 'bot',
        embed: {
          title: `⏱️ انتهت الجولة ${roundNum}!`,
          description: `❌ **خرج من اللعبة:**\n@${eliminated} ${nonSeated.length > 1 ? '(لم يجلس في الوقت المحدد)' : '(ما لحق كرسي)'}\n\n` +
            `🪑 **الجالسين:**\n${seated.map(p => `@${p}`).join('، ') || 'لا أحد'}\n\n` +
            `👥 **المتبقون (${survivors.length}):**\n` +
            survivors.map(p => `• @${p}`).join('\n'),
          color: 'border-rose-500 bg-rose-950/20 text-rose-200',
        },
        time: now,
      }
    ]);

    if (survivors.length === 1) {
      const winner = survivors[0];
      const isUserWinner = winner === playerName;
      const pointsToAward = 10;

      setTimeout(() => {
        setChairsPhase('ended');
        setGameState('won');

        setChatLog((prev) => [
          ...prev,
          {
            sender: 'bot',
            embed: {
              title: '🏆 انتهت اللعبة!',
              description: `🎉 **ألف مبروك للفائز بالمركز الأول!**\n\n` +
                `👑 **الفائز:** @${winner}\n` +
                `⭐ **النقاط المكتسبة:** +${pointsToAward} نقطة!\n\n` +
                `*أثبت سرعة ردة فعله وحسم آخر كرسي ببراعة!* 🪑✨`,
              color: 'border-emerald-500 bg-emerald-950/20 text-emerald-200',
            },
            time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
          }
        ]);

        if (isUserWinner) {
          setSessionPoints(prev => prev + pointsToAward);
          setSessionWins(prev => prev + 1);
          setStreak(prev => prev + 1);
          if (onWinRecorded) {
            fetch('/api/simulate/chairs/record', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ playerName, points: pointsToAward })
            }).then(() => onWinRecorded()).catch(err => console.error(err));
          }
        }
      }, 1500);
    } else if (survivors.length > 1) {
      chairsPhaseTimerRef.current = setTimeout(() => {
        startChairsMusicPhase(survivors, roundNum + 1);
      }, 2500);
    }
  };

  // Start a new XO Match
  const startXORound = () => {
    clearActiveTimer();
    isRoundEndedRef.current = false;
    setXOBoard(Array(9).fill(null));
    setXOTurn('X');
    setXOWinner(null);
    setXOWinningCombo(null);
    setIsXODraw(false);
    setUserInput('');
    setFeedback(null);

    const timerSec = 60;
    setInitialTime(timerSec);
    setTimeLeft(timerSec);
    setGameState('running');

    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    setChatLog((prev) => [
      ...prev,
      {
        sender: 'bot',
        isXO: true,
        embed: {
          title: '🎮 مباراة XO (Tic-Tac-Toe)',
          description: `❌ **اللاعب 1 (X):** @${playerName}\n⭕ **اللاعب 2 (O):** @${player2Name}\n\n⏳ **الدور الحالي:** ❌ @${playerName}\n💡 اضغط على الخانة الفارغة في اللوحة بالأسفل للعب دورك!`,
          color: 'border-amber-500 bg-amber-950/20 text-amber-200',
        },
        time: now,
      },
    ]);
  };

  // Start "خمن الرقم" round
  const startGuessNumberRound = async () => {
    try {
      clearActiveTimer();
      isRoundEndedRef.current = false;
      setGameState('idle');
      setUserInput('');
      setLockedPlayers([]);
      setFeedback(null);
      setGuessAttemptsCount(0);

      const res = await fetch('/api/simulate/guess-number/random');
      const data = await res.json();

      setGuessQ(data);
      const timerSec = data.timerSeconds || 60;
      setInitialTime(timerSec);
      setTimeLeft(timerSec);
      setGameState('running');

      const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'bot',
          embed: {
            title: '🎯 خمن الرقم',
            description: `حاول تخمين الرقم السري!\nالنطاق: **1 - 100**\n\n⏱️ لديك **${timerSec}** ثانية.`,
            color: 'border-rose-500 bg-rose-950/20 text-rose-200',
          },
          time: now,
        },
      ]);
    } catch (err) {
      console.error('Error starting guess number round:', err);
    }
  };

  // Start a new Button Game Round
  const startButtonRound = async () => {
    try {
      clearActiveTimer();
      isRoundEndedRef.current = false;
      setGameState('idle');
      setUserInput('');
      setLockedPlayers([]);
      setFeedback(null);

      const res = await fetch('/api/simulate/button/start');
      const data = await res.json();

      const startTime = Date.now();
      setButtonQ({ ...data, startTime });
      const timerSec = data.timerSeconds || 10;
      setInitialTime(timerSec);
      setTimeLeft(timerSec);
      setGameState('running');

      const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'bot',
          isButtonGame: true,
          embed: {
            title: '🔘 اضغط الزر الصحيح!',
            description: `اضغط على الزر الصحيح بأسرع وقت.\n\n[ 🔵 ]  [ 🟢 ]  [ 🟡 ]  [ 🔴 ]\n\nزر واحد فقط هو الصحيح.\n⏱️ لديك **${timerSec}** ثوانٍ.\n👤 المسموح له باللعب: <@${playerName}>`,
            color: 'border-blue-500 bg-blue-950/20 text-blue-200',
          },
          time: now,
        },
      ]);
    } catch (err) {
      console.error('Error starting button round:', err);
    }
  };

  // Start a new Fastest Game Round
  const startFastestRound = async () => {
    try {
      clearActiveTimer();
      isRoundEndedRef.current = false;
      setGameState('idle');
      setUserInput('');
      setLockedPlayers([]);
      setFeedback(null);

      const res = await fetch('/api/simulate/fastest/start');
      const data = await res.json();

      const startTime = Date.now();
      setFastestQ({ ...data, startTime });
      const timerSec = data.timerSeconds || 15;
      setInitialTime(timerSec);
      setTimeLeft(timerSec);
      setGameState('running');

      const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'bot',
          embed: {
            title: '⚡ لعبة أسرع — أسرع كتابة تفوز!',
            description: `المطلوب: قم بكتابة النص التالي **كما هو تماماً** بأسرع ما يمكن!\n\n📝 النص المطلوب:\n\`\`\`\n${data.phrase}\n\`\`\`\n⏱️ لديك **${timerSec}** ثانية للإجابة!\n💡 اكتب إجابتك في الشات مباشرة (أول إجابة مطابقة تفوز).`,
            color: 'border-amber-500 bg-amber-950/20 text-amber-200',
          },
          time: now,
        },
      ]);
    } catch (err) {
      console.error('Error starting fastest round:', err);
    }
  };

  // Simulator Button Click Handler
  const handleSimButtonClick = async (clickedIndex: number) => {
    if (gameState !== 'running' || isRoundEndedRef.current || !buttonQ) return;
    isRoundEndedRef.current = true;
    clearActiveTimer();

    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    try {
      const res = await fetch('/api/simulate/button/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clickedIndex,
          targetIndex: buttonQ.targetIndex,
          startTime: buttonQ.startTime,
          playerName,
        }),
      });

      const data = await res.json();

      if (data.correct) {
        setGameState('won');
        setSessionPoints((p) => p + data.points);
        setSessionWins((w) => w + 1);
        setStreak((s) => s + 1);
        setFeedback({
          isCorrect: true,
          text: `🔘 أحسنت! ضغطت الزر الصحيح في ${data.timeTakenSec} ثانية (+${data.points} نقاط)`,
        });

        if (onWinRecorded) onWinRecorded();

        setChatLog((prev) => [
          ...prev,
          {
            sender: 'bot',
            embed: {
              title: '🔘 أحسنت!',
              description: `🏆 <@${playerName}>\n\nضغطت الزر الصحيح!\n\n⚡ الوقت: **${data.timeTakenSec} ثانية**\n⭐ **+${data.points} نقاط**`,
              color: 'border-amber-500 bg-amber-950/20 text-amber-200',
            },
            time: now,
          },
        ]);
      } else {
        setGameState('timeout');
        setStreak(0);
        setFeedback({
          isCorrect: false,
          text: `❌ خطأ! ضغطت الزر الخاطئ. تنتهي الجولة مباشرة.`,
        });

        setChatLog((prev) => [
          ...prev,
          {
            sender: 'bot',
            embed: {
              title: '❌ خطأ!',
              description: `ضغطت الزر الخاطئ.\n\nتنتهي الجولة مباشرة.`,
              color: 'border-rose-500 bg-rose-950/20 text-rose-200',
            },
            time: now,
          },
        ]);
      }
    } catch (err) {
      console.error('Error handling button click:', err);
    }
  };

  // Start a new Disassemble Game Round
  const startDisassembleRound = async () => {
    try {
      clearActiveTimer();
      isRoundEndedRef.current = false;
      setGameState('idle');
      setUserInput('');
      setLockedPlayers([]);
      setFeedback(null);

      const res = await fetch('/api/simulate/disassemble/start', { method: 'POST' });
      const data = await res.json();

      const startTime = Date.now();
      setDisassembleQ({ ...data, startTime });
      const timerSec = data.timerSeconds || 15;
      setInitialTime(timerSec);
      setTimeLeft(timerSec);
      setGameState('running');

      const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'bot',
          embed: {
            title: '🔄 لعبة فكك — أسرع إجابة تفوز!',
            description: `المطلوب: قم بتفكيك الكلمة التالية إلى **حروف مفصولة بمسافات**!\n\n🔤 الكلمة المطلوب تفكيكها:\n\`\`\`\n${data.word}\n\`\`\`\n💡 مثال توضيحي: إذا كانت الكلمة \`مكتبة\` فالإجابة الصحيحة هي: \`م ك ت ب ة\`\n\n⏱️ لديك **${timerSec}** ثانية للإجابة!\n💡 اكتب الحروف مفصولة بمسافات في الشات مباشرة.`,
            color: 'border-teal-500 bg-teal-950/20 text-teal-200',
          },
          time: now,
        },
      ]);
    } catch (err) {
      console.error('Error starting disassemble round:', err);
    }
  };

  // Start a new Mafia Game Round
  const startMafiaRound = () => {
    clearActiveTimer();
    isRoundEndedRef.current = false;
    setGameState('running');
    setUserInput('');
    setFeedback(null);
    setMafiaPhase('lobby');
    setMafiaCycle(1);
    setMafiaVotes({});
    setMafiaDMs([]);
    setMafiaDoctorChoice(null);

    // Pre-create 6 players (User + 5 bots) to represent a complete game with all special roles
    const playersInit = [
      { name: playerName, role: 'civilian' as const, isAlive: true },
      { name: 'أحمد', role: 'civilian' as const, isAlive: true },
      { name: 'خالد', role: 'civilian' as const, isAlive: true },
      { name: 'سارة', role: 'civilian' as const, isAlive: true },
      { name: 'ريم', role: 'civilian' as const, isAlive: true },
      { name: 'نور', role: 'civilian' as const, isAlive: true },
    ];

    // Distribute roles dynamically based on count
    const count = playersInit.length;
    let mafiaCount = 1;
    let detectiveCount = 0;
    let doctorCount = 0;

    if (count <= 5) {
      mafiaCount = 1;
      if (Math.random() > 0.5) {
        detectiveCount = 1;
      } else {
        doctorCount = 1;
      }
    } else if (count >= 6 && count <= 8) {
      mafiaCount = 2;
      detectiveCount = 1;
      doctorCount = 1;
    } else if (count >= 9 && count <= 12) {
      mafiaCount = count >= 11 ? 3 : 2;
      detectiveCount = 1;
      doctorCount = 1;
    } else {
      mafiaCount = 3;
      detectiveCount = 1;
      doctorCount = 1;
    }

    const roles: Array<'mafia' | 'detective' | 'doctor' | 'civilian'> = [];
    for (let i = 0; i < mafiaCount; i++) roles.push('mafia');
    for (let i = 0; i < detectiveCount; i++) roles.push('detective');
    for (let i = 0; i < doctorCount; i++) roles.push('doctor');
    while (roles.length < count) roles.push('civilian');

    // Shuffle roles
    const shuffledRoles = [...roles];
    for (let i = shuffledRoles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledRoles[i], shuffledRoles[j]] = [shuffledRoles[j], shuffledRoles[i]];
    }

    const assignedPlayers = playersInit.map((p, idx) => ({
      ...p,
      role: shuffledRoles[idx],
    }));

    setMafiaPlayers(assignedPlayers);

    const userObj = assignedPlayers.find(p => p.name === playerName);
    const userRole = userObj ? userObj.role : 'civilian';
    setMafiaMyRole(userRole);

    const timerSec = 120; // 2 minutes lobby time
    setInitialTime(timerSec);
    setTimeLeft(timerSec);

    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    setChatLog((prev) => [
      ...prev,
      {
        sender: 'bot',
        time: now,
        isMafiaLobby: true,
        embed: {
          title: '🪓 غرفة لعبة مافيا — Mafia',
          description: `انضموا للعبة قبل أن تبدأ!\n\n👥 **اللاعبون المنضمون (6):**\n1. @${playerName} (منشئ اللعبة)\n2. @أحمد\n3. @خالد\n4. @سارة\n5. @ريم\n6. @نور\n\n💡 اضغط على زر **بدء اللعبة 🎮** بالأسفل للبدء وتوزيع الأدوار!`,
          color: 'border-slate-500 bg-slate-900/40 text-slate-200',
        }
      }
    ]);
  };

  const handleStartMafiaGame = () => {
    setMafiaPhase('night');
    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    // Send role DM to player
    let roleText = '';
    let roleEmoji = '';
    if (mafiaMyRole === 'mafia') {
      roleText = 'أنت هو المافيا 🔪! هدفك التخلص من الجميع!';
      roleEmoji = '🔪';
    } else if (mafiaMyRole === 'detective') {
      roleText = 'أنت هو المحقق 🕵️! هدفك فحص هوية لاعب كل ليلة لكشف المافيا!';
      roleEmoji = '🕵️';
    } else if (mafiaMyRole === 'doctor') {
      roleText = 'أنت هو الطبيب 🩺! هدفك حماية سكان المدينة. اختر لاعباً واحداً لحمايته من التصفية في كل ليلة!';
      roleEmoji = '🩺';
    } else {
      roleText = 'أنت هو المدني 👨‍🌾! هدفك نقاش المدينة لكشف المافيا والتصويت لنفيهم!';
      roleEmoji = '👨‍🌾';
    }

    setMafiaDMs([
      {
        text: `📬 رسالة النظام:\nدورك السري في هذه الجولة هو: **${roleEmoji} ${mafiaMyRole === 'mafia' ? 'مافيا' : mafiaMyRole === 'detective' ? 'محقق' : mafiaMyRole === 'doctor' ? 'طبيب' : 'مدني'}**.\n${roleText}`,
        time: now,
      }
    ]);

    // Send game started message in channel
    setChatLog((prev) => [
      ...prev,
      {
        sender: 'bot',
        time: now,
        embed: {
          title: '🎮 بدأت لعبة مافيا!',
          description: `تم إرسال الأدوار السرية لجميع اللاعبين في الرسائل الخاصة (DMs) 🤫\n\n👥 **اللاعبون المشاركون (6):**\n• @${playerName}\n• @أحمد\n• @خالد\n• @سارة\n• @ريم\n• @نور\n\n🌃 سيهبط الليل على المدينة بعد قليل لتنفيذ الأدوار الخاصة...`,
          color: 'border-slate-700 bg-slate-900/30 text-slate-200',
        }
      }
    ]);

    // Set a tiny timeout then trigger Night Phase
    setTimeout(() => {
      triggerMafiaNight();
    }, 3000);
  };

  const triggerMafiaNight = () => {
    setMafiaPhase('night');
    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    setChatLog((prev) => [
      ...prev,
      {
        sender: 'bot',
        time: now,
        isMafiaNight: true,
        embed: {
          title: `🌃 الليل يهبط على المدينة (الجولة ${mafiaCycle})`,
          description: `خيم الصمت المطبق على المدينة... 🤫\nنام الجميع بسلام، بينما استيقظت المافيا لتنفيذ الجريمة، واستيقظ المحقق لتقصي الحقائق، واستيقظ الطبيب لحماية الضحايا.`,
          color: 'border-blue-950 bg-blue-950/20 text-blue-200',
        }
      }
    ]);

    // If user is civilian or dead, make computer play automatically and transition to Day after 5s
    const myPlayer = mafiaPlayers.find(p => p.name === playerName);
    const userRoleCanAct = mafiaMyRole === 'mafia' || mafiaMyRole === 'detective' || mafiaMyRole === 'doctor';
    if (!myPlayer || !myPlayer.isAlive || !userRoleCanAct) {
      setTimeout(() => {
        handleMafiaNightOutcome(null);
      }, 5000);
    }
  };

  const handleMafiaNightOutcome = (playerTargetId: string | null, doctorChoiceParam: string | null = null) => {
    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    let killedName = '';

    const aliveNonMafia = mafiaPlayers.filter(p => p.isAlive && p.role !== 'mafia');

    if (mafiaMyRole === 'mafia' && playerTargetId) {
      // User killed someone
      killedName = playerTargetId;
    } else {
      // Computer Mafia kills someone among non-mafia
      const possibleTargets = aliveNonMafia.filter(p => p.name !== playerName);
      if (possibleTargets.length > 0) {
        const randTarget = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
        killedName = randTarget.name;
      } else {
        // Fallback
        const userObj = mafiaPlayers.find(p => p.name === playerName);
        if (userObj && userObj.isAlive) {
          killedName = playerName;
        }
      }
    }

    // Determine Doctor's protection choice
    let finalDoctorChoice = doctorChoiceParam;
    if (mafiaMyRole !== 'doctor') {
      const aliveDoc = mafiaPlayers.find(p => p.isAlive && p.role === 'doctor');
      if (aliveDoc) {
        // AI doctor protects a random alive player
        const alivePlayers = mafiaPlayers.filter(p => p.isAlive);
        if (alivePlayers.length > 0) {
          finalDoctorChoice = alivePlayers[Math.floor(Math.random() * alivePlayers.length)].name;
        }
      }
    }

    // Apply protection
    let isProtected = false;
    if (finalDoctorChoice && killedName === finalDoctorChoice) {
      isProtected = true;
      killedName = ''; // Nobody dies!
    }

    // Kill the target if not protected
    let updatedPlayers = [...mafiaPlayers];
    if (killedName) {
      updatedPlayers = mafiaPlayers.map(p => {
        if (p.name === killedName) {
          return { ...p, isAlive: false };
        }
        return p;
      });
    }

    setMafiaPlayers(updatedPlayers);
    setMafiaPhase('day_announcement');

    // Announce death in chat
    const victim = mafiaPlayers.find(p => p.name === killedName);
    const victimRoleText = victim ? (victim.role === 'mafia' ? 'مافيا 🔪' : victim.role === 'detective' ? 'محقق 🕵️' : victim.role === 'doctor' ? 'طبيب 🩺' : 'مدني 👨‍🌾') : 'مدني 👨‍🌾';

    setChatLog((prev) => [
      ...prev,
      {
        sender: 'bot',
        time: now,
        embed: {
          title: `☀️ أشرقت شمس النهار (الجولة ${mafiaCycle})`,
          description: killedName 
            ? `🚨 **أشرقت الشمس ☀️... واستيقظت المدينة على خبر مفجع!**\n\nلقد تسللت المافيا ليلاً واغتالت اللاعب: @${killedName} 💀\n(كان دوره السري: **${victimRoleText}**)`
            : `🎉 **أشرقت الشمس ☀️... واستيقظت المدينة بسلام!**\n\nلم يمت أحد هذه الليلة.`,
          color: 'border-yellow-600 bg-yellow-950/20 text-yellow-200',
        }
      }
    ]);

    // Check Win/Loss conditions
    const isOver = checkMafiaGameEnd(updatedPlayers);
    if (isOver) return;

    // Proceed to discussion then vote phase
    setTimeout(() => {
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'bot',
          time: now,
          text: `🗳️ **بدأت فترة النقاش والمحاورة لكشف الأشرار!** (اضغط على زر **بدء التصويت** بالأسفل للذهاب للتصويت ونفي المتهمين)`
        }
      ]);
      setMafiaPhase('day_discussion');
    }, 3000);
  };

  const checkMafiaGameEnd = (playersList: typeof mafiaPlayers) => {
    const aliveMafia = playersList.filter(p => p.isAlive && p.role === 'mafia').length;
    const aliveOthers = playersList.filter(p => p.isAlive && p.role !== 'mafia').length;
    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    if (aliveMafia === 0) {
      // Civilians win!
      setGameState('won');
      setMafiaPhase('ended');
      setSessionPoints(p => p + 20); // Award 20 points!
      setSessionWins(w => w + 1);

      setChatLog((prev) => [
        ...prev,
        {
          sender: 'bot',
          time: now,
          embed: {
            title: '🏆 فاز المدنيون والمحقق والطبيب باللعبة! 👨‍🌾🩺',
            description: `🎉 مبروك للفائزين! لقد تم نفي جميع المافيا بنجاح وإنقاذ المدينة!\n\n⭐ حصلت على **+20 نقاط**!\n\n👥 **الأدوار النهائية:**\n${playersList.map(p => `• @${p.name} ← **${p.role === 'mafia' ? 'مافيا 🔪' : p.role === 'detective' ? 'محقق 🕵️' : p.role === 'doctor' ? 'طبيب 🩺' : 'مدني 👨‍🌾'}** (${p.isAlive ? 'حي ✅' : 'ميت 💀'})`).join('\n')}`,
            color: 'border-green-600 bg-green-950/20 text-green-200',
          }
        }
      ]);
      if (onWinRecorded) onWinRecorded();
      return true;
    }

    if (aliveMafia >= aliveOthers) {
      // Mafia wins!
      setGameState('won'); // Technically a game end, let's mark as ended
      setMafiaPhase('ended');

      // If user was Mafia, award points
      const isUserWin = playersList.find(p => p.name === playerName)?.role === 'mafia';
      if (isUserWin) {
        setSessionPoints(p => p + 20);
        setSessionWins(w => w + 1);
        if (onWinRecorded) onWinRecorded();
      }

      setChatLog((prev) => [
        ...prev,
        {
          sender: 'bot',
          time: now,
          embed: {
            title: '🏆 فازت المافيا باللعبة! 🔪',
            description: `💀 لقد سيطرت المافيا على المدينة بالكامل وقضت على الجميع!\n\n👥 **الأدوار النهائية:**\n${playersList.map(p => `• @${p.name} ← **${p.role === 'mafia' ? 'مافيا 🔪' : p.role === 'detective' ? 'محقق 🕵️' : p.role === 'doctor' ? 'طبيب 🩺' : 'مدني 👨‍🌾'}** (${p.isAlive ? 'حي ✅' : 'ميت 💀'})`).join('\n')}`,
            color: 'border-red-600 bg-red-950/20 text-red-200',
          }
        }
      ]);
      return true;
    }

    return false;
  };

  const startMafiaVotingPhase = () => {
    setMafiaPhase('day_vote');
    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    setChatLog((prev) => [
      ...prev,
      {
        sender: 'bot',
        time: now,
        isMafiaVote: true,
        embed: {
          title: '🗳️ بدء مرحلة التصويت والمحاكمة!',
          description: `صوّت الآن لنفي من تشتبه به من المدينة أو اختر تخطي التصويت.\nأمامكم 30 ثانية للإدلاء بأصواتكم!`,
          color: 'border-orange-600 bg-orange-950/20 text-orange-200',
        }
      }
    ]);
  };

  const handleMafiaVoteSubmit = (selectedTargetName: string) => {
    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    const alivePlayers = mafiaPlayers.filter(p => p.isAlive);

    // Bot players cast votes
    const votesTally: Record<string, number> = {};
    const botVotesList: Array<{ voter: string; choice: string }> = [];

    // Player's vote
    if (selectedTargetName !== 'skip') {
      votesTally[selectedTargetName] = (votesTally[selectedTargetName] || 0) + 1;
    }

    // Bots vote
    alivePlayers.forEach(p => {
      if (p.name === playerName) return; // Skip user

      // Simple AI voting logic:
      // Mafia try to vote for civilians
      // Civilians vote randomly
      let choice = 'skip';
      const possibleTargets = alivePlayers.filter(target => target.name !== p.name);
      
      if (Math.random() > 0.3 && possibleTargets.length > 0) {
        // Vote for someone
        const choiceObj = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
        choice = choiceObj.name;
        votesTally[choice] = (votesTally[choice] || 0) + 1;
      }
      botVotesList.push({ voter: p.name, choice });
    });

    // Display votes in chat
    const voteLogs = [
      `🗳️ **تفاصيل تصويت المدينة:**`,
      `• أنت صوّتّ لـ: **${selectedTargetName === 'skip' ? 'تخطي التصويت 🏳️' : `@${selectedTargetName}`}**`,
      ...botVotesList.map(b => `• @${b.voter} صوّت لـ: **${b.choice === 'skip' ? 'تخطي التصويت 🏳️' : `@${b.choice}`}**`)
    ];

    setChatLog((prev) => [
      ...prev,
      {
        sender: 'bot',
        time: now,
        text: voteLogs.join('\n')
      }
    ]);

    // Find highest voted target
    let executedName = '';
    let maxVotes = 0;
    let isTie = false;

    Object.keys(votesTally).forEach(name => {
      if (votesTally[name] > maxVotes) {
        maxVotes = votesTally[name];
        executedName = name;
        isTie = false;
      } else if (votesTally[name] === maxVotes) {
        isTie = true;
      }
    });

    let executionText = '';
    let updatedPlayers = [...mafiaPlayers];

    if (isTie || maxVotes === 0) {
      executionText = `🏳️ **قرار المحكمة: تعادل الأصوات! لم يتم نفي أحد هذه الجولة.**`;
    } else {
      updatedPlayers = mafiaPlayers.map(p => {
        if (p.name === executedName) {
          return { ...p, isAlive: false };
        }
        return p;
      });
      setMafiaPlayers(updatedPlayers);

      const targetPlayerObj = mafiaPlayers.find(p => p.name === executedName);
      const roleText = targetPlayerObj ? (targetPlayerObj.role === 'mafia' ? 'مافيا 🔪' : targetPlayerObj.role === 'detective' ? 'محقق 🕵️' : targetPlayerObj.role === 'doctor' ? 'طبيب 🩺' : 'مدني 👨‍🌾') : 'مدني';
      executionText = `⚖️ **قرار المحكمة: تم نفي اللاعب @${executedName} بموجب تصويت الأغلبية!**\nدور السري كان: **[ ${roleText} ]**`;
    }

    setChatLog((prev) => [
      ...prev,
      {
        sender: 'bot',
        time: now,
        embed: {
          title: '⚖️ محكمة المدينة صدرت حكمها!',
          description: executionText,
          color: 'border-amber-600 bg-amber-950/20 text-amber-200',
        }
      }
    ]);

    // Check game end after hanging
    const isOver = checkMafiaGameEnd(updatedPlayers);
    if (isOver) return;

    // Go to next Night
    setMafiaCycle(c => c + 1);
    setTimeout(() => {
      triggerMafiaNight();
    }, 4000);
  };

  const handleMafiaInspect = (targetName: string) => {
    const targetObj = mafiaPlayers.find(p => p.name === targetName);
    const isMafia = targetObj?.role === 'mafia';
    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    setMafiaDMs(prev => [
      ...prev,
      {
        text: `🕵️ نتيجة التحقيق السري:\nاللاعب @${targetName} هو **[ ${isMafia ? 'مافيا 🔪' : 'بريء 👨‍🌾'} ]**!`,
        time: now
      }
    ]);

    // Trigger Day transition
    handleMafiaNightOutcome(null);
  };

  // Start whichever game is selected
  const startCurrentGame = () => {
    if (gameMode === 'reverse') {
      startReverseRound();
    } else if (gameMode === 'flags') {
      startFlagsRound();
    } else if (gameMode === 'harf') {
      startHarfRound();
    } else if (gameMode === 'guess_number') {
      startGuessNumberRound();
    } else if (gameMode === 'button') {
      startButtonRound();
    } else if (gameMode === 'fastest') {
      startFastestRound();
    } else if (gameMode === 'disassemble') {
      startDisassembleRound();
    } else if (gameMode === 'mafia') {
      startMafiaRound();
    } else if (gameMode === 'hide_and_seek') {
      startHideAndSeekRound();
    } else if (gameMode === 'chairs') {
      startChairsRound();
    } else {
      startXORound();
    }
  };

  // Winning combinations for XO
  const XO_WINNING_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  const checkLocalWinner = (board: Array<string | null>) => {
    for (const combo of XO_WINNING_COMBOS) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a] as 'X' | 'O', combo };
      }
    }
    return null;
  };

  // XO Cell Click Handler
  const handleXOCellClick = async (cellIndex: number) => {
    if (gameState !== 'running' || isRoundEndedRef.current || xoBoard[cellIndex] !== null) {
      return;
    }

    const currentSymbol = xoTurn;
    const currentActivePlayer = currentSymbol === 'X' ? playerName : player2Name;
    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    // 1. Update Board State Immediately
    const nextBoard = [...xoBoard];
    nextBoard[cellIndex] = currentSymbol;
    setXOBoard(nextBoard);

    // 2. Check Win / Draw condition locally
    const winResult = checkLocalWinner(nextBoard);
    const isDraw = !winResult && nextBoard.every((cell) => cell !== null);

    if (winResult) {
      if (isRoundEndedRef.current) return;
      isRoundEndedRef.current = true;
      clearActiveTimer();

      setGameState('won');
      setXOWinner(winResult.winner);
      setXOWinningCombo(winResult.combo);
      setSessionPoints((p) => p + 10);
      setSessionWins((w) => w + 1);
      setStreak((s) => s + 1);
      setFeedback({
        isCorrect: true,
        text: `👑 فاز باللعبة! (${currentActivePlayer}) (+10 نقاط)`,
      });

      // Exact requested win format: 🏆 **فاز باللعبة! 👑** @الفائز
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `🏆 **فاز باللعبة! 👑** @${currentActivePlayer}`,
          time: now,
        },
      ]);

      if (onWinRecorded) onWinRecorded();
    } else if (isDraw) {
      if (isRoundEndedRef.current) return;
      isRoundEndedRef.current = true;
      clearActiveTimer();

      setGameState('won');
      setIsXODraw(true);
      setFeedback({
        isCorrect: true,
        text: '🤝 تعادل! امتلأت جميع الخانات بدون فائز.',
      });

      // Exact requested draw format: 🤝 **تعادل!**
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: '🤝 **تعادل!**',
          time: now,
        },
      ]);
    } else {
      // Toggle turn
      setXOTurn((prev) => (prev === 'X' ? 'O' : 'X'));
      setTimeLeft(60); // Reset move timer
    }

    // 3. Sync with Backend in Background safely
    try {
      const res = await fetch('/api/simulate/xo/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board: xoBoard,
          cellIndex,
          playerSymbol: currentSymbol,
          playerName: currentActivePlayer,
        }),
      });

      if (res.ok) {
        const text = await res.text();
        if (text) {
          try {
            const data = JSON.parse(text);
            if (data?.user && onWinRecorded) {
              onWinRecorded();
            }
          } catch {
            // Ignored safe parsing
          }
        }
      }
    } catch (err) {
      console.warn('Backend XO sync notice:', err);
    }
  };

  // Timeout handler - guaranteed to run strictly ONCE per round
  const handleTimeout = () => {
    if (isRoundEndedRef.current) return;
    isRoundEndedRef.current = true;
    clearActiveTimer();

    setGameState('timeout');
    setStreak(0);
    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    let correctText = '';
    let gameTitle = '';
    if (gameMode === 'guess_number' && guessQ) {
      setFeedback({
        isCorrect: false,
        text: '⏰ انتهى الوقت!',
        details: `الرقم الصحيح كان: ${guessQ.secretNumber}`,
      });

      setChatLog((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `⏰ **انتهى الوقت!**\n\nلم يتمكن أحد من تخمين الرقم.\n\nالرقم الصحيح كان: **${guessQ.secretNumber}**`,
          time: now,
        },
      ]);
      return;
    } else if (gameMode === 'reverse' && reverseQ) {
      correctText = reverseQ.reversed;
      gameTitle = 'لعبة اعكس 🔄';
    } else if (gameMode === 'flags' && flagQ) {
      correctText = flagQ.name;
      gameTitle = 'لعبة خمن العلم 🚩';
    } else if (gameMode === 'harf' && harfQ) {
      correctText = harfQ.sampleValidAnswers?.join(' أو ') || `كلمة تبدأ بحرف ${harfQ.letter}`;
      gameTitle = 'لعبة حرف 🔤';
    } else if (gameMode === 'fastest' && fastestQ) {
      correctText = fastestQ.phrase;
      gameTitle = 'لعبة أسرع ⚡';
    } else if (gameMode === 'disassemble' && disassembleQ) {
      correctText = `${disassembleQ.word} ← (${disassembleQ.expectedAnswer})`;
      gameTitle = 'لعبة فكك 🔄';
    }

    setFeedback({
      isCorrect: false,
      text: '⌛ انتهى الوقت!',
      details: `الإجابة الصحيحة كانت: ${correctText}`,
    });

    setChatLog((prev) => [
      ...prev,
      {
        sender: 'bot',
        embed: {
          title: `⌛ انتهى الوقت في ${gameTitle}!`,
          description: `للأسف، انتهى الوقت ولم يتمكن أحد من الإجابة الصحيحة.\n\n💡 الإجابة الصحيحة كانت: **\`${correctText}\`**`,
          color: 'border-rose-500 bg-rose-950/20 text-rose-200',
        },
        time: now,
      },
    ]);
  };

  // Submit Answer handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const trimmed = userInput.trim();
    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    // Allow instant info/registry commands anytime
    if (['!العاب', '!ألعاب', 'العاب', 'ألعاب', '/games', '/العاب', '!games'].includes(trimmed)) {
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'user',
          text: `${playerName}: ${trimmed}`,
          time: now,
        },
        {
          sender: 'bot',
          embed: {
            title: '🎮 ألعاب جعفر',
            description: `### 🎯 ألعاب فردية\n\n* 🚩 **أعلام** — \`!اعلام\`\n* 🔃 **اعكس** — \`!اعكس\`\n* 🔤 **حرف** — \`!حرف\`\n\n### 🎮 ألعاب جماعية\n\n* ❌⭕ **XO** — \`!xo\``,
            color: 'border-indigo-500 bg-indigo-950/20 text-indigo-200',
          },
          time: now,
        },
      ]);
      setUserInput('');
      return;
    }

    if (gameState !== 'running' || isRoundEndedRef.current) return;

    const isCurrentPlayerLocked = gameMode === 'reverse' && lockedPlayers.includes(playerName);
    if (isCurrentPlayerLocked) return;

    // Append user message to simulated chat
    setChatLog((prev) => [
      ...prev,
      {
        sender: 'user',
        text: `${playerName}: ${trimmed}`,
        time: now,
      },
    ]);

    if (gameMode === 'reverse' && reverseQ) {
      try {
        const res = await fetch('/api/simulate/reverse/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: trimmed,
            originalWord: reverseQ.word,
            playerName,
          }),
        });
        const result = await res.json();

        if (result.correct) {
          if (isRoundEndedRef.current) return;
          isRoundEndedRef.current = true;
          clearActiveTimer();

          setGameState('won');
          setSessionPoints((p) => p + result.points);
          setSessionWins((w) => w + 1);
          setStreak((s) => s + 1);
          setFeedback({
            isCorrect: true,
            text: `👑 فاز باللعبة! (+${result.points} نقطة)`,
          });

          // Send simplified winner message: 🏆 **فاز باللعبة! 👑** @playerName
          setChatLog((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: `🏆 **فاز باللعبة! 👑** @${playerName}`,
              time: now,
            },
          ]);

          if (onWinRecorded) onWinRecorded();
        } else {
          // Lock ONLY this player from further attempts this round
          setLockedPlayers((prev) => [...prev, playerName]);
          setUserInput('');
          setStreak(0);
          setFeedback({
            isCorrect: false,
            text: `❌ إجابة خاطئة للاعب "${playerName}"!`,
            details: `تم قفل محاولاتك لهذه الجولة. يستطيع باقي اللاعبين المحاولة حتى انتهاء الوقت (${timeLeft} ثانية)!`,
          });
        }
      } catch (err) {
        console.error(err);
      }
    } else if (gameMode === 'flags' && flagQ) {
      try {
        const res = await fetch('/api/simulate/flags/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: trimmed,
            countryName: flagQ.name,
            aliases: flagQ.aliases,
            playerName,
          }),
        });
        const result = await res.json();

        if (result.correct) {
          if (isRoundEndedRef.current) return;
          isRoundEndedRef.current = true;
          clearActiveTimer();

          setGameState('won');
          setSessionPoints((p) => p + result.points);
          setSessionWins((w) => w + 1);
          setStreak((s) => s + 1);
          setFeedback({
            isCorrect: true,
            text: `👑 فاز باللعبة! (+${result.points} نقطة)`,
          });

          // Send simplified winner message: 🏆 **فاز باللعبة! 👑** @playerName
          setChatLog((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: `🏆 **فاز باللعبة! 👑** @${playerName}`,
              time: now,
            },
          ]);

          if (onWinRecorded) onWinRecorded();
        } else {
          // WRONG ANSWER IN FLAGS GAME:
          // Do NOT end round, DO NOT block player from guessing again.
          setUserInput('');
          setFeedback({
            isCorrect: false,
            text: '❌ إجابة غير مطابقة! حاول مرة أخرى...',
            details: `أنت كتبت "${trimmed}". لم تنتهِ الجولة، خمن مرة أخرى قبل انتهاء الـ 15 ثانية!`,
          });
        }
      } catch (err) {
        console.error(err);
      }
    } else if (gameMode === 'harf' && harfQ) {
      try {
        const res = await fetch('/api/simulate/harf/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: trimmed,
            letter: harfQ.letter,
            playerName,
          }),
        });
        const result = await res.json();

        if (result.correct) {
          if (isRoundEndedRef.current) return;
          isRoundEndedRef.current = true;
          clearActiveTimer();

          setGameState('won');
          setSessionPoints((p) => p + result.points);
          setSessionWins((w) => w + 1);
          setStreak((s) => s + 1);
          setFeedback({
            isCorrect: true,
            text: `👑 فاز باللعبة! (+${result.points} نقطة)`,
          });

          // Send simplified winner message: 🏆 **فاز باللعبة! 👑** @playerName
          setChatLog((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: `🏆 **فاز باللعبة! 👑** @${playerName}`,
              time: now,
            },
          ]);

          if (onWinRecorded) onWinRecorded();
        } else {
          // WRONG ANSWER IN HARF GAME:
          // Multiple attempts allowed until timeout
          setUserInput('');
          setFeedback({
            isCorrect: false,
            text: '❌ إجابة غير صحيحة أو لا تبدأ بالحرف المطلوب! حاول مجدداً...',
            details: `أنت كتبت "${trimmed}". لم تنتهِ الجولة، اذكر ${harfQ.category} يبدأ بحرف (${harfQ.letter}) قبل انتهاء الوقت!`,
          });
        }
      } catch (err) {
        console.error(err);
      }
    } else if (gameMode === 'guess_number' && guessQ) {
      try {
        const guess = parseInt(trimmed, 10);
        if (isNaN(guess) || guess < 1 || guess > 100) {
          setUserInput('');
          setFeedback({
            isCorrect: false,
            text: '⚠️ يرجى إدخال رقم بين 1 و 100!',
          });
          return;
        }

        const nextAttempts = guessAttemptsCount + 1;
        setGuessAttemptsCount(nextAttempts);

        const res = await fetch('/api/simulate/guess-number/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: guess,
            secretNumber: guessQ.secretNumber,
            playerName,
          }),
        });
        const result = await res.json();

        if (result.correct) {
          if (isRoundEndedRef.current) return;
          isRoundEndedRef.current = true;
          clearActiveTimer();

          setGameState('won');
          setSessionPoints((p) => p + result.points);
          setSessionWins((w) => w + 1);
          setStreak((s) => s + 1);
          setFeedback({
            isCorrect: true,
            text: `👑 فاز باللعبة! (+${result.points} نقطة)`,
          });

          // Send exact winner message:
          setChatLog((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: `🏆 **فاز @${playerName}!**\n\nلقد خمنت الرقم الصحيح بعد **${nextAttempts} محاولة**.\n\nالرقم كان: **${guessQ.secretNumber}**`,
              time: now,
            },
          ]);

          if (onWinRecorded) onWinRecorded();
        } else {
          setUserInput('');
          const hintText = result.result === 'larger' ? '> 🔼 الرقم أكبر!' : '> 🔽 الرقم أصغر!';
          setFeedback({
            isCorrect: false,
            text: hintText,
            details: `تخمينك كان ${guess}. استمر بالتخمين!`,
          });
          setChatLog((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: hintText,
              time: now,
            },
          ]);
        }
      } catch (err) {
        console.error(err);
      }
    } else if (gameMode === 'fastest' && fastestQ) {
      try {
        const res = await fetch('/api/simulate/fastest/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answer: trimmed,
            targetPhrase: fastestQ.phrase,
            startTime: fastestQ.startTime,
            playerName,
          }),
        });
        const result = await res.json();

        if (result.correct) {
          if (isRoundEndedRef.current) return;
          isRoundEndedRef.current = true;
          clearActiveTimer();

          setGameState('won');
          setSessionPoints((p) => p + result.points);
          setSessionWins((w) => w + 1);
          setStreak((s) => s + 1);
          setFeedback({
            isCorrect: true,
            text: `👑 فاز باللعبة! (+${result.points} نقطة)`,
            details: `السرعة: ${result.timeTakenSec} ثانية`,
          });

          setChatLog((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: `🏆 **فاز باللعبة! 👑** @${playerName}`,
              time: now,
            },
          ]);

          if (onWinRecorded) onWinRecorded();
        } else {
          setUserInput('');
          setFeedback({
            isCorrect: false,
            text: '❌ النص غير مطابق تماماً! حاول مرة أخرى...',
            details: `أنت كتبت "${trimmed}". المطلوب مطابقة النص المعروض تماماً قبل انتهاء الوقت!`,
          });
        }
      } catch (err) {
        console.error(err);
      }
    } else if (gameMode === 'disassemble' && disassembleQ) {
      try {
        const res = await fetch('/api/simulate/disassemble/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answer: trimmed,
            targetWord: disassembleQ.word,
            expectedAnswer: disassembleQ.expectedAnswer,
            startTime: disassembleQ.startTime,
            playerName,
          }),
        });
        const result = await res.json();

        if (result.correct) {
          if (isRoundEndedRef.current) return;
          isRoundEndedRef.current = true;
          clearActiveTimer();

          setGameState('won');
          setSessionPoints((p) => p + result.points);
          setSessionWins((w) => w + 1);
          setStreak((s) => s + 1);
          setFeedback({
            isCorrect: true,
            text: `👑 فاز باللعبة! (+${result.points} نقطة)`,
            details: `التفكيك الصحيح: ${result.expectedAnswer}`,
          });

          setChatLog((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: `🏆 **فاز باللعبة! 👑** @${playerName}`,
              time: now,
            },
          ]);

          if (onWinRecorded) onWinRecorded();
        } else {
          setUserInput('');
          setFeedback({
            isCorrect: false,
            text: '❌ التفكيك غير صحيح! أعد المحاولة بالحروف مرتبة ومفصولة بمسافات...',
            details: `أنت كتبت "${trimmed}". أرسل الحروف مفصولة بمسافات مثل: (${disassembleQ.expectedAnswer})`,
          });
        }
      } catch (err) {
        console.error(err);
      }
    } else if (gameMode === 'mafia') {
      setUserInput('');
    }
  };

  const progressPercent = initialTime > 0 ? (timeLeft / initialTime) * 100 : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                محاكي الألعاب المحلي (Discord Simulator)
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white">
              جرب ألعاب جعفر التفاعلية مباشرة!
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              قم بتجربة منطق الألعاب، سرعة الاستجابة، ونظام المعالجة اللغوية العربية الدقيقة
            </p>
          </div>

          {/* Stats Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400">نقاط الجلسة</p>
                <p className="text-lg font-bold text-amber-300">{sessionPoints} <span className="text-xs">نقطة</span></p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400">سلسلة الانتصارات</p>
                <p className="text-lg font-bold text-emerald-300">{streak} <span className="text-xs">فوز متتالي</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Game Mode Switcher Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-3 mt-6 pt-6 border-t border-slate-800">
          <button
            id="sim-mode-reverse-btn"
            onClick={() => {
              setGameMode('reverse');
              setGameState('idle');
              setFeedback(null);
            }}
            className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
              gameMode === 'reverse'
                ? 'bg-purple-950/40 border-purple-500 text-white shadow-lg shadow-purple-900/20 ring-1 ring-purple-500'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg">🔄</span>
                <span className="font-bold text-sm text-white">اعكس</span>
              </div>
              <p className="text-[11px] text-slate-400">
                <code className="text-purple-400 font-mono">!اعكس</code>
              </p>
            </div>
            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
              gameMode === 'reverse' ? 'border-purple-400 bg-purple-500' : 'border-slate-600'
            }`}>
              {gameMode === 'reverse' && <div className="w-1 h-1 bg-white rounded-full" />}
            </div>
          </button>

          <button
            id="sim-mode-flags-btn"
            onClick={() => {
              setGameMode('flags');
              setGameState('idle');
              setFeedback(null);
            }}
            className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
              gameMode === 'flags'
                ? 'bg-sky-950/40 border-sky-500 text-white shadow-lg shadow-sky-900/20 ring-1 ring-sky-500'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg">🚩</span>
                <span className="font-bold text-sm text-white">أعلام</span>
              </div>
              <p className="text-[11px] text-slate-400">
                <code className="text-sky-400 font-mono">!اعلام</code>
              </p>
            </div>
            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
              gameMode === 'flags' ? 'border-sky-400 bg-sky-500' : 'border-slate-600'
            }`}>
              {gameMode === 'flags' && <div className="w-1 h-1 bg-white rounded-full" />}
            </div>
          </button>

          <button
            id="sim-mode-harf-btn"
            onClick={() => {
              setGameMode('harf');
              setGameState('idle');
              setFeedback(null);
            }}
            className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
              gameMode === 'harf'
                ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-900/20 ring-1 ring-emerald-500'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg">🔤</span>
                <span className="font-bold text-sm text-white">حرف</span>
              </div>
              <p className="text-[11px] text-slate-400">
                <code className="text-emerald-400 font-mono">!حرف</code>
              </p>
            </div>
            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
              gameMode === 'harf' ? 'border-emerald-400 bg-emerald-500' : 'border-slate-600'
            }`}>
              {gameMode === 'harf' && <div className="w-1 h-1 bg-white rounded-full" />}
            </div>
          </button>

          <button
            id="sim-mode-guess-btn"
            onClick={() => {
              setGameMode('guess_number');
              setGameState('idle');
              setFeedback(null);
            }}
            className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
              gameMode === 'guess_number'
                ? 'bg-rose-950/40 border-rose-500 text-white shadow-lg shadow-rose-900/20 ring-1 ring-rose-500'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg">🎯</span>
                <span className="font-bold text-sm text-white">خمن الرقم</span>
              </div>
              <p className="text-[11px] text-slate-400">
                <code className="text-rose-400 font-mono">!خمن</code>
              </p>
            </div>
            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
              gameMode === 'guess_number' ? 'border-rose-400 bg-rose-500' : 'border-slate-600'
            }`}>
              {gameMode === 'guess_number' && <div className="w-1 h-1 bg-white rounded-full" />}
            </div>
          </button>

          <button
            id="sim-mode-fastest-btn"
            onClick={() => {
              setGameMode('fastest');
              setGameState('idle');
              setFeedback(null);
            }}
            className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
              gameMode === 'fastest'
                ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-900/20 ring-1 ring-amber-500'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg">⚡</span>
                <span className="font-bold text-sm text-white">أسرع</span>
              </div>
              <p className="text-[11px] text-slate-400">
                <code className="text-amber-400 font-mono">!اسرع</code>
              </p>
            </div>
            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
              gameMode === 'fastest' ? 'border-amber-400 bg-amber-500' : 'border-slate-600'
            }`}>
              {gameMode === 'fastest' && <div className="w-1 h-1 bg-white rounded-full" />}
            </div>
          </button>

          <button
            id="sim-mode-disassemble-btn"
            onClick={() => {
              setGameMode('disassemble');
              setGameState('idle');
              setFeedback(null);
            }}
            className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
              gameMode === 'disassemble'
                ? 'bg-teal-950/40 border-teal-500 text-white shadow-lg shadow-teal-900/20 ring-1 ring-teal-500'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg">🔄</span>
                <span className="font-bold text-sm text-white">فكك</span>
              </div>
              <p className="text-[11px] text-slate-400">
                <code className="text-teal-400 font-mono">!فكك</code>
              </p>
            </div>
            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
              gameMode === 'disassemble' ? 'border-teal-400 bg-teal-500' : 'border-slate-600'
            }`}>
              {gameMode === 'disassemble' && <div className="w-1 h-1 bg-white rounded-full" />}
            </div>
          </button>

          <button
            id="sim-mode-button-btn"
            onClick={() => {
              setGameMode('button');
              setGameState('idle');
              setFeedback(null);
            }}
            className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
              gameMode === 'button'
                ? 'bg-blue-950/40 border-blue-500 text-white shadow-lg shadow-blue-900/20 ring-1 ring-blue-500'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg">🔘</span>
                <span className="font-bold text-sm text-white">زر</span>
              </div>
              <p className="text-[11px] text-slate-400">
                <code className="text-blue-400 font-mono">!زر</code>
              </p>
            </div>
            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
              gameMode === 'button' ? 'border-blue-400 bg-blue-500' : 'border-slate-600'
            }`}>
              {gameMode === 'button' && <div className="w-1 h-1 bg-white rounded-full" />}
            </div>
          </button>

          <button
            id="sim-mode-xo-btn"
            onClick={() => {
              setGameMode('xo');
              setGameState('idle');
              setFeedback(null);
            }}
            className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
              gameMode === 'xo'
                ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-900/20 ring-1 ring-amber-500'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg">❌⭕</span>
                <span className="font-bold text-sm text-white">XO</span>
              </div>
              <p className="text-[11px] text-slate-400">
                <code className="text-amber-400 font-mono">!xo</code>
              </p>
            </div>
            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
              gameMode === 'xo' ? 'border-amber-400 bg-amber-500' : 'border-slate-600'
            }`}>
              {gameMode === 'xo' && <div className="w-1 h-1 bg-white rounded-full" />}
            </div>
          </button>

          <button
            id="sim-mode-mafia-btn"
            onClick={() => {
              setGameMode('mafia');
              setGameState('idle');
              setFeedback(null);
            }}
            className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
              gameMode === 'mafia'
                ? 'bg-rose-950/40 border-rose-500 text-white shadow-lg shadow-rose-900/20 ring-1 ring-rose-500'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg">🔪</span>
                <span className="font-bold text-sm text-white">مافيا</span>
              </div>
              <p className="text-[11px] text-slate-400">
                <code className="text-rose-400 font-mono">!مافيا</code>
              </p>
            </div>
            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
              gameMode === 'mafia' ? 'border-rose-400 bg-rose-500' : 'border-slate-600'
            }`}>
              {gameMode === 'mafia' && <div className="w-1 h-1 bg-white rounded-full" />}
            </div>
          </button>

          <button
            id="sim-mode-hide-and-seek-btn"
            onClick={() => {
              setGameMode('hide_and_seek');
              setGameState('idle');
              setFeedback(null);
            }}
            className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
              gameMode === 'hide_and_seek'
                ? 'bg-blue-950/40 border-blue-500 text-white shadow-lg shadow-blue-900/20 ring-1 ring-blue-500'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg">🙈</span>
                <span className="font-bold text-sm text-white">غميضة</span>
              </div>
              <p className="text-[11px] text-slate-400">
                <code className="text-blue-400 font-mono">!غميضة</code>
              </p>
            </div>
            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
              gameMode === 'hide_and_seek' ? 'border-blue-400 bg-blue-500' : 'border-slate-600'
            }`}>
              {gameMode === 'hide_and_seek' && <div className="w-1 h-1 bg-white rounded-full" />}
            </div>
          </button>

          <button
            id="sim-mode-chairs-btn"
            onClick={() => {
              setGameMode('chairs');
              setGameState('idle');
              setFeedback(null);
            }}
            className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
              gameMode === 'chairs'
                ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-900/20 ring-1 ring-amber-500'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg">🪑</span>
                <span className="font-bold text-sm text-white">كراسي</span>
              </div>
              <p className="text-[11px] text-slate-400">
                <code className="text-amber-400 font-mono">!كراسي</code>
              </p>
            </div>
            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
              gameMode === 'chairs' ? 'border-amber-400 bg-amber-500' : 'border-slate-600'
            }`}>
              {gameMode === 'chairs' && <div className="w-1 h-1 bg-white rounded-full" />}
            </div>
          </button>
        </div>
      </div>

      {/* Simulator Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Discord Chat Mock UI (8 cols) */}
        <div className="lg:col-span-8 bg-[#313338] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[670px]">
          
          {/* Discord Channel Header */}
          <div className="bg-[#2B2D31] px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-xl font-bold">#</span>
              <div>
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <span>فعاليات-وألعاب</span>
                  <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-normal">
                    {gameMode === 'reverse' ? 'لعبة اعكس' : gameMode === 'flags' ? 'لعبة أعلام' : gameMode === 'harf' ? 'لعبة حرف' : gameMode === 'disassemble' ? 'لعبة فكك' : gameMode === 'fastest' ? 'لعبة أسرع' : gameMode === 'button' ? 'لعبة زر' : gameMode === 'mafia' ? 'لعبة مافيا' : gameMode === 'hide_and_seek' ? 'لعبة غميضة' : 'لعبة XO'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  قناة ألعاب ديسكورد التفاعلية لبوت جعفر
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                id="simulator-start-btn"
                onClick={startCurrentGame}
                disabled={gameState === 'running'}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Gamepad2 className="w-4 h-4" />
                {gameState === 'running' ? 'المباراة جارية...' : 'بدء جولة جديدة'}
              </button>

              <button
                id="simulator-clear-chat-btn"
                onClick={() => {
                  setChatLog([]);
                  setFeedback(null);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-xl transition-all"
                title="مسح سجل الشات"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-header: Current Game Status & Timer */}
          <div className="bg-[#232428] px-5 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-slate-400">❌ اللاعب 1:</span>
              <input
                id="simulator-player-name-input"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-slate-800 text-blue-300 px-2.5 py-1 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 border border-slate-700 w-28"
                placeholder="اللاعب 1"
              />

              {gameMode === 'xo' && (
                <>
                  <span className="text-slate-400 mr-2">⭕ اللاعب 2:</span>
                  <input
                    id="simulator-player2-name-input"
                    type="text"
                    value={player2Name}
                    onChange={(e) => setPlayer2Name(e.target.value)}
                    className="bg-slate-800 text-purple-300 px-2.5 py-1 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-700 w-28"
                    placeholder="اللاعب 2"
                  />
                </>
              )}

              <span className="text-slate-500">|</span>
              <span className="text-slate-400">
                الحالة:{' '}
                <strong className={
                  gameState === 'running' ? 'text-emerald-400' :
                  gameState === 'won' ? 'text-amber-400' :
                  gameState === 'timeout' ? 'text-rose-400' : 'text-slate-400'
                }>
                  {gameState === 'running' ? '🟡 جارية' : gameState === 'won' ? '🟢 فوز' : gameState === 'timeout' ? '🔴 انتهى الوقت' : '⚪ بانتظار البدء'}
                </strong>
              </span>
            </div>

            {gameState === 'running' && (
              <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-500/30 px-3 py-1 rounded-full text-xs text-indigo-300 animate-pulse">
                <Timer className="w-3.5 h-3.5 text-indigo-400" />
                <span>المؤقت: <strong className="text-white font-mono text-sm">{timeLeft}</strong> ث</span>
              </div>
            )}
          </div>

          {/* Countdown Progress Bar */}
          {gameState === 'running' && (
            <div className="w-full bg-slate-950 h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  timeLeft <= 5 
                    ? 'bg-rose-500' 
                    : gameMode === 'reverse' 
                    ? 'bg-purple-500' 
                    : gameMode === 'flags' 
                    ? 'bg-sky-500' 
                    : gameMode === 'harf'
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          {/* Chat Messages Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-[#313338]/90">
            {chatLog.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mb-4 text-indigo-400 shadow-inner">
                  <Gamepad2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">الشات جاهز للعب!</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  اضغط على زر <strong className="text-indigo-400">"بدء جولة جديدة"</strong> بالأعلى لبدء لعبة اعكس أو أعلام أو حرف أو XO كما في ديسكورد تماماً.
                </p>
              </div>
            ) : (
              chatLog.map((msg, index) => (
                <div key={index} className="flex items-start gap-3.5 text-slate-200 text-sm">
                  {msg.sender === 'bot' ? (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center shadow-md">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center font-bold text-amber-300 shadow-md text-xs">
                      {playerName.slice(0, 2)}
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {msg.sender === 'bot' ? 'جعفر' : playerName}
                      </span>
                      {msg.sender === 'bot' && (
                        <span className="bg-[#5865F2] text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                          BOT
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-mono">{msg.time}</span>
                    </div>

                    {msg.text && (
                      <p className="text-slate-100 bg-slate-800/60 p-2.5 rounded-lg inline-block border border-slate-700/50">
                        {msg.text}
                      </p>
                    )}

                    {/* Discord Embed Card Representation */}
                    {msg.embed && (
                      <div className={`p-4 rounded-xl border-r-4 ${msg.embed.color} shadow-lg space-y-3 max-w-lg mt-1`}>
                        <h4 className="font-bold text-base flex items-center gap-2">
                          {msg.embed.title}
                        </h4>

                        {msg.embed.imageUrl && (
                          <div className="my-2 bg-slate-950/70 p-3 rounded-xl border border-slate-700/60 flex flex-col items-center justify-center">
                            <img
                              src={msg.embed.imageUrl}
                              alt="علم الدولة"
                              className="max-h-48 w-auto rounded-lg object-contain shadow-md border border-slate-800"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        <p className="text-xs leading-relaxed whitespace-pre-line text-slate-200">
                          {msg.embed.description}
                        </p>

                        {/* Interactive Discord Components (Buttons) for Button Game */}
                        {msg.isButtonGame && (
                          <div className="pt-2 border-t border-slate-700/40">
                            <div className="text-xs text-slate-300 font-semibold mb-2">
                              أزرار التفاعل (Discord ActionRow):
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[
                                { idx: 0, label: 'أزرق', emoji: '🔵', bg: 'bg-blue-600 hover:bg-blue-500' },
                                { idx: 1, label: 'أخضر', emoji: '🟢', bg: 'bg-emerald-600 hover:bg-emerald-500' },
                                { idx: 2, label: 'أصفر', emoji: '🟡', bg: 'bg-slate-700 hover:bg-slate-600' },
                                { idx: 3, label: 'أحمر', emoji: '🔴', bg: 'bg-rose-600 hover:bg-rose-500' },
                              ].map((btn) => (
                                <button
                                  key={btn.idx}
                                  id={`sim-button-game-btn-${btn.idx}`}
                                  onClick={() => handleSimButtonClick(btn.idx)}
                                  disabled={gameState !== 'running'}
                                  className={`px-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md text-white transition-all ${btn.bg} disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  <span>{btn.emoji}</span>
                                  <span>{btn.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {msg.isXO && (
                          <div className="pt-2 border-t border-slate-700/40">
                            <div className="text-xs text-slate-300 font-semibold mb-2 flex items-center justify-between">
                              <span>لوحة الأزرار التفاعلية (Discord Buttons):</span>
                              {gameState === 'running' && (
                                <span className="text-amber-300 text-[11px] animate-pulse">
                                  الدور: {xoTurn === 'X' ? `❌ ${playerName}` : `⭕ ${player2Name}`}
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 max-w-[280px]">
                              {xoBoard.map((cell, idx) => {
                                const isWinningCell = xoWinningCombo?.includes(idx);
                                return (
                                  <button
                                    key={idx}
                                    id={`sim-xo-btn-${idx}`}
                                    onClick={() => handleXOCellClick(idx)}
                                    disabled={gameState !== 'running' || cell !== null}
                                    className={`h-16 rounded-xl font-bold text-2xl flex items-center justify-center shadow-md ${
                                      cell === 'X'
                                        ? isWinningCell
                                          ? 'bg-blue-600 text-white ring-4 ring-amber-300'
                                          : 'bg-blue-600 hover:bg-blue-600 text-white cursor-not-allowed'
                                        : cell === 'O'
                                        ? isWinningCell
                                          ? 'bg-purple-600 text-white ring-4 ring-amber-300'
                                          : 'bg-purple-600 hover:bg-purple-600 text-white cursor-not-allowed'
                                        : gameState === 'running'
                                        ? 'bg-[#4E5058] hover:bg-[#6D6F78] active:scale-95 text-slate-300 cursor-pointer'
                                        : 'bg-[#383A40] text-slate-500 cursor-not-allowed'
                                    }`}
                                  >
                                    {cell === 'X' ? '❌' : cell === 'O' ? '⭕' : '➖'}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {msg.isMafiaLobby && mafiaPhase === 'lobby' && (
                          <div className="pt-2 border-t border-slate-700/40">
                            <div className="text-xs text-slate-300 font-semibold mb-2">
                              خيارات غرفة اللعبة (Discord Buttons):
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <button
                                key="mafia-start-btn"
                                onClick={handleStartMafiaGame}
                                className="px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md text-white transition-all bg-indigo-600 hover:bg-indigo-500 active:scale-95 cursor-pointer"
                              >
                                <span>🎮</span>
                                <span>بدء اللعبة</span>
                              </button>
                              <button
                                key="mafia-cancel-btn"
                                onClick={() => {
                                  setGameState('idle');
                                  setMafiaPhase('idle');
                                  setChatLog(prev => [
                                    ...prev,
                                    {
                                      sender: 'bot',
                                      text: '❌ تم إلغاء غرفة لعبة مافيا.',
                                      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
                                    }
                                  ]);
                                }}
                                className="px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md text-white transition-all bg-slate-700 hover:bg-slate-600 active:scale-95 cursor-pointer"
                              >
                                <span>❌</span>
                                <span>إلغاء</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {msg.isMafiaNight && mafiaPhase === 'night' && (
                          <div className="pt-2 border-t border-slate-700/40">
                            <div className="text-xs text-slate-300 font-semibold mb-2">
                              القرار السري (Night Action):
                            </div>
                            {/* Check if user is alive */}
                            {mafiaPlayers.find(p => p.name === playerName)?.isAlive ? (
                              mafiaMyRole === 'mafia' ? (
                                <div className="space-y-2">
                                  <p className="text-[11px] text-rose-400">اختر لاعبًا لتصفيته ليلاً:</p>
                                  <div className="grid grid-cols-2 gap-2 max-w-[280px]">
                                    {mafiaPlayers.filter(p => p.isAlive && p.name !== playerName).map(p => (
                                      <button
                                        key={p.name}
                                        onClick={() => handleMafiaNightOutcome(p.name)}
                                        className="px-3 py-2 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
                                      >
                                        🔪 تصفية {p.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : mafiaMyRole === 'detective' ? (
                                <div className="space-y-2">
                                  <p className="text-[11px] text-sky-400">اختر لاعبًا للكشف عن هويته:</p>
                                  <div className="grid grid-cols-2 gap-2 max-w-[280px]">
                                    {mafiaPlayers.filter(p => p.isAlive && p.name !== playerName).map(p => (
                                      <button
                                        key={p.name}
                                        onClick={() => handleMafiaInspect(p.name)}
                                        className="px-3 py-2 rounded-lg bg-sky-950/60 hover:bg-sky-900 border border-sky-800 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
                                      >
                                        🕵️ فحص {p.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : mafiaMyRole === 'doctor' ? (
                                <div className="space-y-2">
                                  <p className="text-[11px] text-emerald-400">اختر لاعبًا لحمايته من المافيا الليلة:</p>
                                  <div className="grid grid-cols-2 gap-2 max-w-[280px]">
                                    {mafiaPlayers.filter(p => p.isAlive).map(p => (
                                      <button
                                        key={p.name}
                                        onClick={() => {
                                          setMafiaDoctorChoice(p.name);
                                          const nowStr = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
                                          setMafiaDMs(prev => [
                                            ...prev,
                                            {
                                              text: `🩺 نتيجة الحماية:\nلقد اخترت حماية اللاعب @${p.name} هذه الليلة! ستبقى هذه الحماية سرية لإنقاذ الأرواح.`,
                                              time: nowStr
                                            }
                                          ]);
                                          handleMafiaNightOutcome(null, p.name);
                                        }}
                                        className="px-3 py-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
                                      >
                                        🩺 حماية {p.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic">👨‍🌾 أنت مدني صالح، تنام الآن بسلام وتتأمل النجوم في انتظار الصباح...</p>
                              )
                            ) : (
                              <p className="text-xs text-rose-400 italic">👻 لقد تصفيت من اللعبة. راقب الأحداث بصمت!</p>
                            )}
                          </div>
                        )}

                        {msg.isMafiaVote && mafiaPhase === 'day_vote' && (
                          <div className="pt-2 border-t border-slate-700/40">
                            <div className="text-xs text-slate-300 font-semibold mb-2">
                              الإدلاء بصوتك (Submit Vote):
                            </div>
                            {mafiaPlayers.find(p => p.name === playerName)?.isAlive ? (
                              <div className="grid grid-cols-2 gap-2 max-w-[280px]">
                                {mafiaPlayers.filter(p => p.isAlive).map(p => (
                                  <button
                                    key={p.name}
                                    onClick={() => handleMafiaVoteSubmit(p.name)}
                                    className="px-3 py-2 rounded-lg bg-orange-950/60 hover:bg-orange-900 border border-orange-800 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
                                  >
                                    🗳️ نفي @{p.name} {p.name === playerName ? '(أنت)' : ''}
                                  </button>
                                ))}
                                <button
                                  key="mafia-vote-skip-btn"
                                  onClick={() => handleMafiaVoteSubmit('skip')}
                                  className="col-span-2 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
                                >
                                  🏳️ تخطي التصويت
                                </button>
                              </div>
                            ) : (
                              <p className="text-xs text-rose-400 italic">👻 أنت ميت، لا يحق لك التصويت!</p>
                            )}
                          </div>
                        )}

                        {gameMode === 'hide_and_seek' && hasPhase === 'lobby' && msg.isMafiaLobby && (
                          <div className="pt-2 border-t border-slate-700/40">
                            <div className="text-xs text-slate-300 font-semibold mb-2">
                              خيارات لعبة الغميضة (Discord Buttons):
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={handleHasStart}
                                className="px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md text-white transition-all bg-emerald-600 hover:bg-emerald-500 active:scale-95 cursor-pointer"
                              >
                                <span>▶️</span>
                                <span>بدء اللعبة</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {gameMode === 'hide_and_seek' && hasPhase === 'hiding' && msg.isMafiaLobby && (
                          <div className="pt-2 border-t border-slate-700/40">
                            <div className="text-xs text-slate-300 font-semibold mb-2">
                              اختر مكان اختبائك سراً (Hide Button):
                            </div>
                            {hasMyRole === 'hider' ? (
                              !hasMyHiddenSpot ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-[400px]">
                                  <button onClick={() => handleHasHide('sofa', '🛋️ الكنبة')} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer">🛋️ الكنبة</button>
                                  <button onClick={() => handleHasHide('door', '🚪 خلف الباب')} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer">🚪 خلف الباب</button>
                                  <button onClick={() => handleHasHide('box', '📦 داخل الصندوق')} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer">📦 داخل الصندوق</button>
                                  <button onClick={() => handleHasHide('plant', '🪴 خلف النبتة')} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer">🪴 خلف النبتة</button>
                                  <button onClick={() => handleHasHide('table', '🪑 تحت الطاولة')} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer">🪑 تحت الطاولة</button>
                                  <button onClick={() => handleHasHide('closet', '🧥 داخل الخزانة')} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer">🧥 داخل الخزانة</button>
                                </div>
                              ) : (
                                <p className="text-xs text-emerald-400 font-medium">✅ لقد اختبأت بنجاح! انتظر الباحث ليبدأ اللعب.</p>
                              )
                            ) : (
                              <p className="text-xs text-amber-400 italic">🙈 أنت الباحث! انتظر حتى يختبئ جميع اللاعبين الآخرين...</p>
                            )}
                          </div>
                        )}

                        {gameMode === 'hide_and_seek' && hasPhase === 'seeking' && msg.isMafiaLobby && (
                          <div className="pt-2 border-t border-slate-700/40">
                            <div className="text-xs text-slate-300 font-semibold mb-2">
                              أماكن البحث المتاحة للباحث (Search Spot):
                            </div>
                            {hasMyRole === 'seeker' ? (
                              <div className="space-y-2">
                                <p className="text-[11px] text-orange-400">المحاولات المتبقية: {hasAttempts} / {hasMaxAttempts}</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-[400px]">
                                  <button onClick={() => handleHasSeekClick('sofa', '🛋️ الكنبة')} className="px-3 py-2 rounded-lg bg-blue-900/60 hover:bg-blue-800 border border-blue-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer">🛋️ الكنبة</button>
                                  <button onClick={() => handleHasSeekClick('door', '🚪 خلف الباب')} className="px-3 py-2 rounded-lg bg-blue-900/60 hover:bg-blue-800 border border-blue-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer">🚪 خلف الباب</button>
                                  <button onClick={() => handleHasSeekClick('box', '📦 داخل الصندوق')} className="px-3 py-2 rounded-lg bg-blue-900/60 hover:bg-blue-800 border border-blue-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer">📦 داخل الصندوق</button>
                                  <button onClick={() => handleHasSeekClick('plant', '🪴 خلف النبتة')} className="px-3 py-2 rounded-lg bg-blue-900/60 hover:bg-blue-800 border border-blue-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer">🪴 خلف النبتة</button>
                                  <button onClick={() => handleHasSeekClick('table', '🪑 تحت الطاولة')} className="px-3 py-2 rounded-lg bg-blue-900/60 hover:bg-blue-800 border border-blue-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer">🪑 تحت الطاولة</button>
                                  <button onClick={() => handleHasSeekClick('closet', '🧥 داخل الخزانة')} className="px-3 py-2 rounded-lg bg-blue-900/60 hover:bg-blue-800 border border-blue-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer">🧥 داخل الخزانة</button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <p className="text-xs text-amber-400 italic">🔎 الباحث يفتش في الأنحاء حالياً...</p>
                                <p className="text-[11px] text-slate-400 font-medium">حالتك: {hasPlayers.find(p => p.name === playerName)?.found ? '💀 تم العثور عليك!' : '💚 لم يتم العثور عليك بعد (مختبئ)'}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {gameMode === 'chairs' && chairsPhase === 'lobby' && msg.isChairsLobby && (
                          <div className="pt-2 border-t border-slate-700/40">
                            <div className="text-xs text-slate-300 font-semibold mb-2">
                              خيارات ردهة لعبة كراسي (Discord Buttons):
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={handleChairsAddBot}
                                disabled={chairsPlayers.length >= 12}
                                className="px-3.5 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md text-white transition-all bg-emerald-600 hover:bg-emerald-500 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span>🟢</span>
                                <span>انضمام لاعب ({chairsPlayers.length}/12)</span>
                              </button>
                              <button
                                onClick={handleChairsStart}
                                disabled={chairsPlayers.length < 4}
                                className="px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md text-white transition-all bg-blue-600 hover:bg-blue-500 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span>▶️</span>
                                <span>بدء اللعبة</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {gameMode === 'chairs' && chairsPhase === 'sitting' && msg.isChairsSitting && (
                          <div className="pt-2 border-t border-slate-700/40">
                            <div className="text-xs text-slate-300 font-semibold mb-2">
                              🪑 الكراسي المتاحة (اضغط على كرسي شاغر فوراً):
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-w-[500px]">
                              {Array.from({ length: chairsCount }, (_, idx) => idx + 1).map((chairNum) => {
                                const occupant = chairsOccupied[chairNum];
                                const isMySeat = chairsUserSeat === chairNum;
                                const isTaken = !!occupant;

                                return (
                                  <button
                                    key={`chair-btn-${chairNum}`}
                                    onClick={() => handleChairsSeatClick(chairNum)}
                                    disabled={isTaken}
                                    className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
                                      isMySeat
                                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                                        : isTaken
                                        ? 'bg-slate-800/80 border border-slate-700 text-slate-400 cursor-not-allowed line-through'
                                        : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-950/40 hover:scale-[1.02]'
                                    }`}
                                  >
                                    <span>🪑</span>
                                    <span>{chairNum}</span>
                                    {occupant && <span className="text-[10px] opacity-90 truncate max-w-[60px]">({occupant})</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Chat Input Box */}
          <div className="bg-[#2B2D31] p-4 border-t border-slate-800">
            {feedback && (
              <div className={`mb-3 p-3 rounded-xl flex items-center gap-3 text-xs ${
                feedback.isCorrect 
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200' 
                  : 'bg-rose-950/60 border border-rose-500/40 text-rose-200'
              }`}>
                {feedback.isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
                <div>
                  <p className="font-bold text-sm">{feedback.text}</p>
                  {feedback.details && <p className="text-slate-300 text-[11px] mt-0.5">{feedback.details}</p>}
                </div>
              </div>
            )}

            {gameMode === 'xo' || gameMode === 'button' || gameMode === 'mafia' || gameMode === 'hide_and_seek' || gameMode === 'chairs' ? (
              <div className="flex flex-col bg-[#383A40] p-3 rounded-xl text-xs text-slate-300 gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">
                      {gameMode === 'mafia' ? '🪓 لعبة مافيا:' : gameMode === 'chairs' ? '🪑 لعبة كراسي:' : gameMode === 'hide_and_seek' ? '🙈 لعبة غميضة:' : `🔘 لعبة ${gameMode === 'button' ? 'زر' : 'XO'}:`}
                    </span>
                    <span>
                      {gameMode === 'mafia'
                        ? 'تفاعل باستخدام الأزرار التي تظهر في الشات والرسائل الخاصة في القائمة الجانبية!'
                        : gameMode === 'chairs'
                        ? 'تفاعل بالضغط المباشر على أزرار الكراسي في الشات فور انتهاء الموسيقى!'
                        : gameMode === 'hide_and_seek'
                        ? 'اختر أماكن الاختباء والتفتيش عبر الأزرار التفاعلية في الشات!'
                        : 'العب بالضغط السريع مباشرة على الأزرار الملونة في الشات بالأعلى!'}
                    </span>
                  </div>
                  {gameState === 'running' && gameMode !== 'mafia' && gameMode !== 'chairs' && (
                    <span className="bg-slate-800 px-3 py-1 rounded-lg font-bold text-amber-300 animate-pulse">
                      ⏱️ المؤقت جارٍ: {timeLeft} ث
                    </span>
                  )}
                  {gameMode === 'chairs' && chairsPhase === 'music' && (
                    <span className="bg-yellow-950/80 border border-yellow-500/40 px-3 py-1 rounded-lg font-bold text-yellow-300 animate-pulse">
                      🎵 الموسيقى شغالة... استعد!
                    </span>
                  )}
                  {gameMode === 'chairs' && chairsPhase === 'sitting' && (
                    <span className="bg-rose-950/80 border border-rose-500/40 px-3 py-1 rounded-lg font-bold text-rose-300 animate-bounce">
                      🚨 اجلس الآن! (5 ثوانٍ)
                    </span>
                  )}
                </div>

                {/* Direct button for Mafia day discussion override */}
                {gameMode === 'mafia' && mafiaPhase === 'day_discussion' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50">
                    <span className="text-amber-400 font-bold">قرارات النهار:</span>
                    <button
                      type="button"
                      onClick={startMafiaVotingPhase}
                      className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      🗳️ إنهاء النقاش وبدء التصويت
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  id="simulator-chat-input"
                  type="text"
                  placeholder={
                    gameState === 'running'
                      ? gameMode === 'reverse'
                        ? `اكتب معكوس الكلمة هنا (مثلاً: ${reverseQ ? reverseQ.reversed : 'ةكلمم'})...`
                        : gameMode === 'flags'
                        ? `اكتب اسم الدولة هنا (مثلاً: ${flagQ ? flagQ.name : 'السعودية'})...`
                        : gameMode === 'fastest'
                        ? `اكتب النص المطلوب تماماً هنا...`
                        : `اكتب ${harfQ?.category || 'كلمة'} تبدأ بحرف (${harfQ?.letter || 'أ'})...`
                      : 'اضغط على "بدء جولة جديدة" لبدء اللعبة...'
                  }
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={gameState !== 'running' || (gameMode === 'reverse' && lockedPlayers.includes(playerName))}
                  className="flex-1 bg-[#383A40] text-white px-4 py-3 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  dir="auto"
                />

                <button
                  id="simulator-send-btn"
                  type="submit"
                  disabled={gameState !== 'running' || (gameMode === 'reverse' && lockedPlayers.includes(playerName)) || !userInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title="إرسال الإجابة"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            )}

            {gameState === 'running' && gameMode === 'reverse' && lockedPlayers.includes(playerName) && (
              <p className="text-[11px] text-amber-400 mt-2">
                ⚠️ لقد تم قفل محاولات اللاعب "{playerName}" لهذه الجولة (لعبة اعكس تسمح بمحاولة واحدة لكل لاعب). يمكنك تغيير اسم اللاعب بالأعلى لمحاكاة محاولة لاعب آخر، أو الانتظار للجولة القادمة.
              </p>
            )}

            {gameState === 'running' && gameMode === 'flags' && (
              <p className="text-[11px] text-sky-400 mt-2">
                💡 في لعبة أعلام: يمكنك كتابة أي عدد من التخمينات حتى تصل للإجابة الصحيحة أو ينتهي المؤقت!
              </p>
            )}

            {gameState === 'running' && gameMode === 'harf' && (
              <p className="text-[11px] text-emerald-400 mt-2">
                💡 في لعبة حرف: يمكنك كتابة أي عدد من الكلمات حتى تذكر إجابة صحيحة تبدأ بالحرف المطلوب أو ينتهي الوقت!
              </p>
            )}
          </div>
        </div>

        {/* Side Game Guide & Rules (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active Game Info Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              قواعد لعبة {gameMode === 'reverse' ? 'اعكس (Reverse)' : gameMode === 'flags' ? 'أعلام (Flags)' : gameMode === 'harf' ? 'حرف (Letter)' : gameMode === 'disassemble' ? 'فكك (Disassemble)' : gameMode === 'button' ? 'زر (Button)' : gameMode === 'fastest' ? 'أسرع (Fastest)' : 'XO (Tic-Tac-Toe)'}
            </h3>

            {gameMode === 'reverse' ? (
              <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                <p className="bg-purple-950/30 border border-purple-800/40 p-3 rounded-xl text-purple-200">
                  🔄 <strong>فكرة اللعبة:</strong> يرسل البوت كلمة عربية من مئات الكلمات المختارة، والمطلوب كتابة نفس الحروف بالعكس تماماً.
                </p>
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-200">💡 نظام المحاولات:</p>
                  <p className="text-amber-300 font-medium">⚠️ محاولة واحدة لكل لاعب: عند إرسال إجابة خاطئة يتم قفلك من المحاولة لباقي الجولة، بينما يستمر باقي اللاعبين في المحاولة بشكل طبيعي حتى انتهاء الوقت.</p>
                  <p className="font-semibold text-slate-200 mt-2">💡 أمثلة توضيحية:</p>
                  <ul className="list-disc list-inside text-slate-400 space-y-1">
                    <li>كلمة <strong>"قلم"</strong> ← معكوسها <strong>"ملق"</strong></li>
                    <li>كلمة <strong>"برمجة"</strong> ← معكوسها <strong>"ةجمرب"</strong></li>
                    <li>كلمة <strong>"مستقبل"</strong> ← معكوسها <strong>"لبقتسم"</strong></li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  ⏱️ <strong>المؤقت الافتراضي:</strong> 15 ثانية.<br />
                  🏆 <strong>النقاط:</strong> 10 نقاط لكل فوز.
                </div>
              </div>
            ) : gameMode === 'flags' ? (
              <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                <p className="bg-sky-950/30 border border-sky-800/40 p-3 rounded-xl text-sky-200">
                  🚩 <strong>فكرة اللعبة:</strong> يعرض البوت صورة علم الدولة بجودة عالية داخل الـEmbed، والمطلوب معرفة الدولة في أسرع وقت.
                </p>
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-200">✨ التسامح والمحاولات المتعددة:</p>
                  <ul className="list-disc list-inside text-slate-400 space-y-1">
                    <li><strong>محاولات غير محدودة:</strong> الإجابة الخاطئة لا تُخرجك من الجولة، حاول مجدداً فوراً!</li>
                    <li>يقبل <strong>"مصر"</strong> أو <strong>"جمهورية مصر العربية"</strong></li>
                    <li>يقبل <strong>"السعودية"</strong> أو <strong>"سعودية"</strong> أو <strong>"KSA"</strong></li>
                    <li>يقبل <strong>"كوريا الجنوبية"</strong> أو <strong>"كوريا"</strong> أو <strong>"جنوب كوريا"</strong></li>
                    <li>يتسامح تلقائياً مع <strong>(أ / إ / آ / ا)</strong> و <strong>(ة / هـ)</strong></li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  ⏱️ <strong>المؤقت الافتراضي:</strong> 15 ثانية.<br />
                  🏆 <strong>النقاط:</strong> 10 نقاط لكل فوز.
                </div>
              </div>
            ) : gameMode === 'harf' ? (
              <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                <p className="bg-emerald-950/30 border border-emerald-800/40 p-3 rounded-xl text-emerald-200">
                  🔤 <strong>فكرة اللعبة:</strong> يختار البوت حرفاً عربياً وتصنيفاً عشوائياً (بلاد، جماد، نبات، حيوان، مهنة، طعام...)، وأول لاعب يكتب كلمة صحيحة تبدأ بالحرف والتصنيف يفوز!
                </p>
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-200">✨ قواعد اللعبة:</p>
                  <ul className="list-disc list-inside text-slate-400 space-y-1">
                    <li><strong>محاولات غير محدودة:</strong> يمكن لأي لاعب كتابة أكثر من محاولة حتى انتهاء الوقت.</li>
                    <li><strong>أسرع إجابة تفوز:</strong> أول من يرسل كلمة صحيحة يحصل على النقاط فوراً وتنتهي الجولة.</li>
                    <li>يتسامح النظام مع همزات الألف، ال التعريف، والتاء المربوطة.</li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  ⏱️ <strong>المؤقت الافتراضي:</strong> 15 ثانية.<br />
                  🏆 <strong>النقاط:</strong> 10 نقاط لكل فوز.
                </div>
              </div>
            ) : gameMode === 'button' ? (
              <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                <p className="bg-blue-950/30 border border-blue-800/40 p-3 rounded-xl text-blue-200">
                  🔘 <strong>فكرة اللعبة:</strong> يرسل البوت مجموعة من الأزرار الملونة (أزرق، أخضر، أصفر، أحمر)، والمطلوب الضغط على الزر الصحيح بأسرع وقت!
                </p>
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-200">✨ القواعد والتفاعل:</p>
                  <ul className="list-disc list-inside text-slate-400 space-y-1">
                    <li><strong>لعبة فردية:</strong> يحق للاعب الذي شغل الأمر الضغط على الزر فقط.</li>
                    <li><strong>ضغط واحد:</strong> الضغط على الزر الصحيح يمنحك الفوز والنقاط فوراً.</li>
                    <li><strong>الضغط الخاطئ:</strong> ينهي الجولة مباشرة بدون نقاط.</li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  ⏱️ <strong>المؤقت الافتراضي:</strong> 10 ثوانٍ.<br />
                  🏆 <strong>النقاط:</strong> +10 نقاط عند الفوز.
                </div>
              </div>
            ) : gameMode === 'fastest' ? (
              <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                <p className="bg-amber-950/30 border border-amber-800/40 p-3 rounded-xl text-amber-200">
                  ⚡ <strong>فكرة اللعبة:</strong> يرسل البوت نصاً أو جملة عربية، والمطلوب كتابتها بسرعة ودقة متناهية كما هي تماماً!
                </p>
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-200">✨ التسامح والمحاولات:</p>
                  <ul className="list-disc list-inside text-slate-400 space-y-1">
                    <li><strong>لعبة جماعية:</strong> جميع لاعبي القناة يشاركون في نفس الوقت.</li>
                    <li><strong>أول إجابة صحيحة:</strong> من يكتب النص كاملاً بشكل مطابق أولاً يفوز بالجولة.</li>
                    <li><strong>تجاهل الأخطاء:</strong> الإجابة الخاطئة تُجاهَل ولا تنهي الجولة ويمكن الإعادة حتى انتهاء الوقت.</li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  ⏱️ <strong>المؤقت الافتراضي:</strong> 15 ثانية.<br />
                  🏆 <strong>النقاط:</strong> +10 نقاط عند الفوز.
                </div>
              </div>
            ) : gameMode === 'disassemble' ? (
              <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                <p className="bg-teal-950/30 border border-teal-800/40 p-3 rounded-xl text-teal-200">
                  🔄 <strong>فكرة اللعبة:</strong> يرسل البوت كلمة عربية، وعلى اللاعبين تفكيكها إلى حروف منفصلة ومتباعدة بمسافات.
                </p>
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-200">✨ طريقة التفكيك والأمثلة:</p>
                  <ul className="list-disc list-inside text-slate-400 space-y-1">
                    <li>الكلمة: <strong>"مدرسة"</strong> ← الإجابة: <strong>"م د ر س ة"</strong></li>
                    <li>الكلمة: <strong>"برمجة"</strong> ← الإجابة: <strong>"ب ر م ج ة"</strong></li>
                    <li><strong>أسرع إجابة تفوز:</strong> أول لاعب يُرسل الحروف مفككة بمسافات صحيحة يحصل على النقاط.</li>
                    <li>تُتجاهل التشكيلات والمسافات الزائدة في البداية والنهاية.</li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  ⏱️ <strong>المؤقت الافتراضي:</strong> 15 ثانية.<br />
                  🏆 <strong>النقاط:</strong> +10 نقاط عند الفوز.
                </div>
              </div>
            ) : gameMode === 'mafia' ? (
              <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                <p className="bg-rose-950/30 border border-rose-800/40 p-3 rounded-xl text-rose-200">
                  🪓 <strong>فكرة اللعبة:</strong> لعبة غموض وبقاء جماعية سرية. يتم توزيع الأدوار عشوائياً (مافيا 🔪، محقق 🕵️، طبيب 🩺، مدني 👨‍🌾).
                </p>
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-200">✨ الأطوار والأدوار:</p>
                  <ul className="list-disc list-inside text-slate-400 space-y-1">
                    <li><strong>🌃 طور الليل:</strong> تبدأ المافيا بالتصفية سراً، ويقوم المحقق بفحص لاعب, ويقوم الطبيب بحماية لاعب آخر من القتل.</li>
                    <li><strong>☀️ طور النهار:</strong> تستيقظ المدينة وتكتشف الضحية، ثم يبدأ نقاش علني لتبادل الشكوك.</li>
                    <li><strong>🗳️ طور التصويت:</strong> تصوّت المدينة لنفي المشتبه به الأكبر للقضاء على المافيا.</li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  ⏱️ <strong>المؤقت الافتراضي:</strong> 30 ثانية لكل مرحلة.<br />
                  🏆 <strong>النقاط:</strong> +20 نقطة للفريق الفائز.
                </div>
              </div>
            ) : gameMode === 'hide_and_seek' ? (
              <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                <p className="bg-blue-950/30 border border-blue-800/40 p-3 rounded-xl text-blue-200">
                  🙈 <strong>فكرة اللعبة:</strong> لعبة غميضة جماعية ممتعة. يتم اختيار باحث واحد (Seeker) سراً، واللاعبون الباقون هم مختبئون (Hiders).
                </p>
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-200">✨ الأطوار والمراحل:</p>
                  <ul className="list-disc list-inside text-slate-400 space-y-1">
                    <li><strong>🫣 طور الاختباء:</strong> لدى المختبئين 15 ثانية لاختيار مكان اختبائهم من بين 6 خيارات متاحة.</li>
                    <li><strong>🔎 طور البحث:</strong> يبدأ الباحث في فحص الأماكن بحثاً عن اللاعبين بحد أقصى من المحاولات (عدد المختبئين + 2).</li>
                    <li><strong>🏆 الفوز باللعبة:</strong> يفوز الباحث إذا عثر على جميع المختبئين، بينما يفوز المختبئون الناجون إذا لم يكتشفهم الباحث.</li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  ⏱️ <strong>مدة اللعبة كاملة:</strong> 75 ثانية (15ث اختباء، 60ث بحث).<br />
                  🏆 <strong>النقاط المكتسبة:</strong> +10 نقاط لكل فائز بالفريق.
                </div>
              </div>
            ) : gameMode === 'chairs' ? (
              <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                <p className="bg-amber-950/30 border border-amber-800/40 p-3 rounded-xl text-amber-200">
                  🪑 <strong>فكرة اللعبة:</strong> لعبة الكراسي الموسيقية الجماعية! الموسيقى تعمل ثم تتوقف فجأة ويظهر عدد كراسي أقل من اللاعبين بواحد (N - 1)، وأسرع اللاعبين جلوساً ينجون!
                </p>
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-200">✨ القواعد وآلية الجولات:</p>
                  <ul className="list-disc list-inside text-slate-400 space-y-1">
                    <li><strong>عدد اللاعبين:</strong> من 4 إلى 12 لاعباً.</li>
                    <li><strong>أمان التسابق (Race Protection):</strong> فحص ذري لحظي يمنع حجز نفس الكرسي لأكثر من لاعب.</li>
                    <li><strong>قفل المقعد:</strong> لا يمكن للاعب الجالس تغيير كرسيه أو الجلوس على كرسيين.</li>
                    <li><strong>الإقصاء:</strong> اللاعب الذي لا يجد كرسياً يُستبعد من الجولة التالية.</li>
                    <li><strong>الفائز الأخير:</strong> آخر لاعب يحصل على الكرسي الأخير يفوز بالجائزة!</li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <p>⏱️ <strong>وقت الجلوس:</strong> 5 ثوانٍ بعد توقف الموسيقى.</p>
                  <p>⭐ <strong>النقاط:</strong> +10 نقاط للفائز بالمركز الأول.</p>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                <p className="bg-amber-950/30 border border-amber-800/40 p-3 rounded-xl text-amber-200">
                  ❌⭕ <strong>فكرة اللعبة:</strong> مباراة ثنائية تفاعلية بين لاعبين (X و O) على لوحة 3×3 بأزرار ديسكورد التفاعلية.
                </p>
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-200">✨ القواعد ونظام الدور:</p>
                  <ul className="list-disc list-inside text-slate-400 space-y-1">
                    <li><strong>اللاعب 1 (X)</strong> يبدأ أولاً دائماً.</li>
                    <li><strong>اللاعب 2 (O)</strong> ينضم للمباراة عبر الزر أو التحدي المباشر.</li>
                    <li>لا يمكن للاعب اللعب خارج دوره.</li>
                    <li>لا يمكن اختيار خانة مستخدمة بالفعل.</li>
                    <li>تتحدث اللوحة تلقائياً بعد كل حركة.</li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <p>🏆 <strong>رسالة الفوز:</strong> <code>🏆 **فاز باللعبة! 👑** @الفائز</code></p>
                  <p>🤝 <strong>رسالة التعادل:</strong> <code>🤝 **تعادل!**</code></p>
                  <p>⭐ <strong>النقاط:</strong> 10 نقاط للفائز.</p>
                </div>
              </div>
            )}
          </div>

          {/* Mafia Secret DMs Panel */}
          {gameMode === 'mafia' && mafiaPhase !== 'idle' && (
            <div className="bg-slate-900 border border-rose-950/60 rounded-2xl p-5 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-1.5">
                <span>📬 رسائلك الخاصة السرية (DMs)</span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                في ديسكورد الحقيقي، يقوم البوت بإرسال دورك والنتائج في الخاص لمنع تسريب الهويات. يمكنك رؤية رسائلك الخاصة هنا:
              </p>
              
              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 max-h-40 overflow-y-auto space-y-2">
                {mafiaDMs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-2">لا توجد رسائل سرية حتى الآن...</p>
                ) : (
                  mafiaDMs.map((dm, idx) => (
                    <div key={idx} className="text-xs border-b border-slate-800/40 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span>من: جعفر (BOT)</span>
                        <span>{dm.time}</span>
                      </div>
                      <p className="text-slate-200 whitespace-pre-line leading-relaxed font-mono text-[11px] bg-slate-900/60 p-2 rounded border border-slate-800/30">
                        {dm.text}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Secret status badges */}
              {mafiaPhase !== 'lobby' && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] bg-rose-950/60 border border-rose-800/40 text-rose-300 px-2 py-1 rounded-md font-bold">
                    دورك: {mafiaMyRole === 'mafia' ? '🔪 مافيا' : mafiaMyRole === 'detective' ? '🕵️ محقق' : mafiaMyRole === 'doctor' ? 'طبيب 🩺' : '👨‍🌾 مدني'}
                  </span>
                  <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-1 rounded-md font-bold">
                    حالتك: {mafiaPlayers.find(p => p.name === playerName)?.isAlive ? '💚 حي' : '💀 ميت'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Quick Discord Commands Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
              <span>أوامر ديسكورد المباشرة</span>
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              عند إضافة البوت لسيرفرك، استخدم الأوامر التالية:
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-indigo-500/30 flex items-center justify-between">
                <span className="text-indigo-400 font-bold">/games</span>
                <span className="text-slate-400 text-[11px] font-sans">أو !العاب</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-purple-500/30 flex items-center justify-between">
                <span className="text-purple-400 font-bold">/reverse</span>
                <span className="text-slate-400 text-[11px] font-sans">أو !اعكس</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-sky-400 font-bold">/flags</span>
                <span className="text-slate-400 text-[11px] font-sans">أو !اعلام</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-emerald-400 font-bold">/حرف</span>
                <span className="text-slate-400 text-[11px] font-sans">أو !حرف</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-amber-400 font-bold">/اسرع</span>
                <span className="text-slate-400 text-[11px] font-sans">أو !اسرع</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-teal-400 font-bold">/فكك</span>
                <span className="text-slate-400 text-[11px] font-sans">أو !فكك</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-amber-400 font-bold">/xo</span>
                <span className="text-slate-400 text-[11px] font-sans">أو !xo</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-yellow-400 font-bold">/leaderboard</span>
                <span className="text-slate-400 text-[11px] font-sans">أو !نقاط</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-emerald-400 font-bold">/ping</span>
                <span className="text-slate-400 text-[11px] font-sans">فحص البوت</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default DiscordGameSimulator;
