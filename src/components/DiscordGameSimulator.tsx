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
  const [gameMode, setGameMode] = useState<'reverse' | 'flags' | 'harf' | 'guess_number' | 'button' | 'xo'>('reverse');
  const [gameState, setGameState] = useState<'idle' | 'running' | 'won' | 'timeout'>('idle');
  
  // Game Questions
  const [reverseQ, setReverseQ] = useState<ReverseQuestion | null>(null);
  const [flagQ, setFlagQ] = useState<FlagQuestion | null>(null);
  const [harfQ, setHarfQ] = useState<{ letter: string; category: string; timerSeconds: number; points: number; sampleValidAnswers?: string[] } | null>(null);
  const [guessQ, setGuessQ] = useState<{ secretNumber: number; timerSeconds: number; points: number } | null>(null);
  const [guessAttemptsCount, setGuessAttemptsCount] = useState<number>(0);
  const [buttonQ, setButtonQ] = useState<{ targetIndex: number; timerSeconds: number; points: number; startTime: number } | null>(null);

  // XO State
  const [xoBoard, setXOBoard] = useState<Array<string | null>>(Array(9).fill(null));
  const [xoTurn, setXOTurn] = useState<'X' | 'O'>('X');
  const [player2Name, setPlayer2Name] = useState('المنافس (O)');
  const [xoWinner, setXOWinner] = useState<'X' | 'O' | null>(null);
  const [xoWinningCombo, setXOWinningCombo] = useState<number[] | null>(null);
  const [isXODraw, setIsXODraw] = useState(false);

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
  const [chatLog, setChatLog] = useState<Array<{ sender: 'bot' | 'user' | 'system'; text?: string; embed?: any; time: string; isXO?: boolean; isButtonGame?: boolean }>>([]);

  // Clear timer helper
  const clearActiveTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800">
          <button
            id="sim-mode-reverse-btn"
            onClick={() => {
              setGameMode('reverse');
              setGameState('idle');
              setFeedback(null);
            }}
            className={`p-3.5 rounded-xl border text-right transition-all flex items-center justify-between ${
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
            className={`p-3.5 rounded-xl border text-right transition-all flex items-center justify-between ${
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
            className={`p-3.5 rounded-xl border text-right transition-all flex items-center justify-between ${
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
            className={`p-3.5 rounded-xl border text-right transition-all flex items-center justify-between ${
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
            id="sim-mode-button-btn"
            onClick={() => {
              setGameMode('button');
              setGameState('idle');
              setFeedback(null);
            }}
            className={`p-3.5 rounded-xl border text-right transition-all flex items-center justify-between ${
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
            className={`p-4 rounded-xl border text-right transition-all flex items-center justify-between ${
              gameMode === 'xo'
                ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-900/20 ring-1 ring-amber-500'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">❌⭕</span>
                <span className="font-bold text-base text-white">لعبة XO</span>
              </div>
              <p className="text-xs text-slate-400">
                <code className="text-amber-400 font-mono">/xo</code> • <code className="text-amber-400 font-mono">!xo</code>
              </p>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              gameMode === 'xo' ? 'border-amber-400 bg-amber-500' : 'border-slate-600'
            }`}>
              {gameMode === 'xo' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
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
                    {gameMode === 'reverse' ? 'لعبة اعكس' : gameMode === 'flags' ? 'لعبة أعلام' : gameMode === 'harf' ? 'لعبة حرف' : 'لعبة XO'}
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

            {gameMode === 'xo' || gameMode === 'button' ? (
              <div className="flex items-center justify-between bg-[#383A40] p-3 rounded-xl text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 font-bold">🔘 لعبة {gameMode === 'button' ? 'زر' : 'XO'}:</span>
                  <span>العب بالضغط السريع مباشرة على الأزرار الملونة في الشات بالأعلى!</span>
                </div>
                {gameState === 'running' && (
                  <span className="bg-slate-800 px-3 py-1 rounded-lg font-bold text-amber-300 animate-pulse">
                    ⏱️ المؤقت جارٍ: {timeLeft} ث
                  </span>
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
              قواعد لعبة {gameMode === 'reverse' ? 'اعكس (Reverse)' : gameMode === 'flags' ? 'أعلام (Flags)' : gameMode === 'harf' ? 'حرف (Letter)' : gameMode === 'button' ? 'زر (Button)' : 'XO (Tic-Tac-Toe)'}
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
