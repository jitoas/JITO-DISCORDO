/**
 * Central Configuration for "جعفر" (Ja'far) Discord Mini-Games Bot
 * All game timers, score settings, and embed colors are configured here.
 */

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Bot metadata
  bot: {
    name: 'جعفر',
    tagline: 'بوت ألعاب وسوالف ديسكورد العربية',
    version: '1.0.0',
    prefix: '!', // Fallback prefix if text commands are used
    defaultLocale: 'ar',
  },

  // Discord Credentials from Environment Variables
  discord: {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.DISCORD_CLIENT_ID || '',
    guildId: process.env.DISCORD_GUILD_ID || '', // Optional guild ID for instant testing
  },

  // Embed Color Theme (Hex numeric format for discord.js)
  colors: {
    primary: 0x5865F2,   // Blurple / Discord Blue
    success: 0x57F287,   // Green
    warning: 0xFEE75C,   // Yellow
    error: 0xED4245,     // Red
    gold: 0xF1C40F,      // Trophy Gold
    gameReverse: 0x9B59B6, // Purple for Reverse game
    gameFlags: 0x3498DB,   // Sky Blue for Flags game
    gameXO: 0xE67E22,      // Warm Orange for XO game
  },

  // Game Settings (Centralized for future dashboard control)
  games: {
    // لعبة اعكس (Reverse text game)
    reverse: {
      name: 'اعكس',
      id: 'reverse',
      description: 'أسرع لاعب يكتب الكلمة المعطاة بالعكس!',
      timerSeconds: 15, // Default countdown: 15 seconds
      pointsPerWin: 10,
      minWordLength: 3,
      maxWordLength: 12,
    },

    // لعبة أعلام (Country flag guessing game)
    flags: {
      name: 'أعلام',
      id: 'flags',
      description: 'خمن اسم الدولة من علم الإيموجي المعروض!',
      timerSeconds: 15, // Default countdown: 15 seconds
      pointsPerWin: 10,
    },

    // لعبة XO (Tic-Tac-Toe game)
    xo: {
      name: 'XO',
      id: 'xo',
      description: 'لعبة إكس أو الشهيرة بين لاعبين (X و O)!',
      moveTimeoutSeconds: 60, // 60 seconds per move or turn
      pointsPerWin: 10,
    },
  },

  // Database / Storage Settings
  storage: {
    dataPath: './data',
    scoresFile: './data/scores.json',
    settingsFile: './data/settings.json',
  },
};

export default config;
