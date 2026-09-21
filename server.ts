/**
 * Full-Stack Server for جعفر (Ja'far) Discord Bot & Dashboard
 * Runs Express API + Vite Middleware and initializes Discord Bot process if credentials exist.
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { config } from './src/config/index.js';
import { startBot, getBotStatus } from './src/index.js';
import db from './src/database/index.js';
import { getRandomReverseWord, ARABIC_WORDS } from './src/games/datasets/words.js';
import { getRandomCountry, COUNTRIES } from './src/games/datasets/countries.js';
import { reverseArabicText, checkReverseMatch, matchesArabicAnswer, normalizeArabic } from './src/utils/arabicNormalizer.js';
import { checkXOWinner, isXOBoardFull } from './src/games/xoGame.js';
import { deploySlashCommands } from './src/deploy-commands.js';
import logger from './src/utils/logger.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // 1. Initialize Discord Bot in background if token is configured
  try {
    startBot();
  } catch (err) {
    logger.error('تعذر بدء تشغيل بوت ديسكورد عند إقلاع الخادم', err);
  }

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Bot Status & Info
  app.get('/api/bot/status', (req, res) => {
    const status = getBotStatus();
    res.json({
      ...status,
      database: db.getStatus(),
      hasToken: Boolean(process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN !== 'YOUR_DISCORD_BOT_TOKEN'),
      hasClientId: Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_ID !== 'YOUR_DISCORD_APPLICATION_CLIENT_ID'),
      botName: config.bot.name,
      version: config.bot.version,
    });
  });

  // Restart / Connect Bot
  app.post('/api/bot/connect', (req, res) => {
    try {
      const client = startBot();
      res.json({ success: true, message: 'تم إرسال طلب الاتصال ببوابة ديسكورد', status: getBotStatus() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'فشل الاتصال' });
    }
  });

  // Deploy Slash Commands Trigger
  app.post('/api/bot/deploy-commands', async (req, res) => {
    try {
      const { customGuildId } = req.body || {};
      const result = await deploySlashCommands(undefined, undefined, customGuildId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'فشل نشر الأوامر' });
    }
  });

  // Get Central Config
  app.get('/api/config', (req, res) => {
    res.json(config);
  });

  // Update Game Settings in Central Config
  app.post('/api/config', (req, res) => {
    try {
      const { reverseTimer, flagsTimer, pointsPerWin, prefix } = req.body || {};

      if (reverseTimer && typeof reverseTimer === 'number' && reverseTimer >= 5) {
        config.games.reverse.timerSeconds = reverseTimer;
      }
      if (flagsTimer && typeof flagsTimer === 'number' && flagsTimer >= 5) {
        config.games.flags.timerSeconds = flagsTimer;
      }
      if (pointsPerWin && typeof pointsPerWin === 'number' && pointsPerWin > 0) {
        config.games.reverse.pointsPerWin = pointsPerWin;
        config.games.flags.pointsPerWin = pointsPerWin;
      }
      if (prefix && typeof prefix === 'string') {
        config.bot.prefix = prefix.trim();
      }

      res.json({ success: true, message: 'تم حفظ الإعدادات بنجاح', config });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Database Leaderboards & Stats
  app.get('/api/scores', (req, res) => {
    const guildId = (req.query.guildId as string) || 'dm';
    const limit = parseInt((req.query.limit as string) || '10', 10);
    const leaderboard = db.getGuildLeaderboard(guildId, limit);
    const globalStats = db.getGlobalStats();
    const allData = db.getAllData();

    res.json({
      guildId,
      leaderboard,
      globalStats,
      guildsList: Object.keys(allData.guilds || {}),
    });
  });

  // Simulator Endpoints: Test "اعكس"
  app.get('/api/simulate/reverse/random', (req, res) => {
    const item = getRandomReverseWord();
    res.json({
      word: item.word,
      category: item.category,
      difficulty: item.difficulty,
      reversed: reverseArabicText(item.word),
      timerSeconds: config.games.reverse.timerSeconds,
      points: config.games.reverse.pointsPerWin,
    });
  });

  app.post('/api/simulate/reverse/check', (req, res) => {
    const { input, originalWord, playerName, guildId = 'demo-server' } = req.body || {};
    if (!input || !originalWord) {
      return res.status(400).json({ error: 'Missing input or originalWord' });
    }

    const isCorrect = checkReverseMatch(input, originalWord);
    const expected = reverseArabicText(originalWord);

    if (isCorrect) {
      const points = config.games.reverse.pointsPerWin || 10;
      const user = db.addWin(guildId, playerName || 'مستخدم تجريبي', playerName || 'مستخدم تجريبي', 'reverse', points);
      return res.json({
        correct: true,
        expected,
        points,
        user,
      });
    }

    res.json({
      correct: false,
      expected,
      normalizedInput: normalizeArabic(input),
    });
  });

  // Simulator Endpoints: Test "أعلام"
  app.get('/api/simulate/flags/random', (req, res) => {
    const item = getRandomCountry();
    res.json({
      flag: item.flag,
      flagImageUrl: item.flagImageUrl || `https://flagcdn.com/w640/${item.code.toLowerCase()}.png`,
      name: item.name,
      code: item.code,
      region: item.region,
      aliases: item.aliases,
      timerSeconds: config.games.flags.timerSeconds,
      points: config.games.flags.pointsPerWin,
    });
  });

  app.post('/api/simulate/flags/check', (req, res) => {
    const { input, countryName, aliases = [], playerName, guildId = 'demo-server' } = req.body || {};
    if (!input || !countryName) {
      return res.status(400).json({ error: 'Missing input or countryName' });
    }

    const isCorrect = matchesArabicAnswer(input, countryName, aliases);

    if (isCorrect) {
      const points = config.games.flags.pointsPerWin || 10;
      const user = db.addWin(guildId, playerName || 'مستخدم تجريبي', playerName || 'مستخدم تجريبي', 'flags', points);
      return res.json({
        correct: true,
        countryName,
        points,
        user,
      });
    }

    res.json({
      correct: false,
      countryName,
      normalizedInput: normalizeArabic(input),
    });
  });

  // Simulator Endpoints: Test "XO"
  app.post('/api/simulate/xo/move', (req, res) => {
    try {
      const { board, cellIndex, playerSymbol, playerName, guildId = 'demo-server' } = req.body || {};
      
      if (!Array.isArray(board) || board.length !== 9 || cellIndex < 0 || cellIndex > 8) {
        return res.status(400).json({ success: false, error: 'بيانات اللوحة غير صالحة' });
      }

      if (board[cellIndex] !== null) {
        return res.status(400).json({ success: false, error: 'الخانة مأخوذة بالفعل!' });
      }

      const nextBoard = [...board];
      nextBoard[cellIndex] = playerSymbol === 'O' ? 'O' : 'X';

      const winResult = checkXOWinner(nextBoard);
      const isDraw = !winResult && isXOBoardFull(nextBoard);

      let user = null;
      const points = config.games.xo?.pointsPerWin || 10;

      if (winResult && playerName) {
        user = db.addWin(guildId, playerName, playerName, 'xo', points);
      }

      return res.json({
        success: true,
        board: nextBoard,
        winner: winResult?.winner || null,
        winningCombo: winResult?.combo || null,
        isDraw,
        points: winResult ? points : 0,
        user,
      });
    } catch (err: any) {
      logger.error('Error in /api/simulate/xo/move', err);
      return res.status(500).json({ success: false, error: err?.message || 'خطأ في معالجة الحركة' });
    }
  });

  // Datasets Explorer
  app.get('/api/datasets', (req, res) => {
    res.json({
      wordsCount: ARABIC_WORDS.length,
      sampleWords: ARABIC_WORDS.slice(0, 15),
      countriesCount: COUNTRIES.length,
      sampleCountries: COUNTRIES.slice(0, 15),
    });
  });

  // --- Vite / Static Files Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logger.success(`🚀 خادم الويب ولوحة تحكم جعفر تعمل على http://localhost:${PORT}`);
  });
}

startServer();
