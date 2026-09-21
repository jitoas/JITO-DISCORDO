/**
 * Modular Local Database / Scoring System for جعفر Bot
 * Stores server-specific scores, player wins, and game statistics.
 * Designed with a clean interface for easy swapping with SQLite/PostgreSQL later.
 */

import fs from 'fs';
import path from 'path';
import config from '../config/index.js';
import logger from '../utils/logger.js';

class JSONDatabase {
  constructor() {
    this.dataDir = path.resolve(process.cwd(), config.storage.dataPath);
    this.filePath = path.resolve(process.cwd(), config.storage.scoresFile);
    this.data = {
      guilds: {}, // { [guildId]: { [userId]: { username, points, totalWins, games: { reverse: 0, flags: 0 }, lastWon: timestamp } } }
      global: {
        totalGamesPlayed: 0,
        totalPointsAwarded: 0,
        createdAt: new Date().toISOString(),
      },
    };
    this.init();
  }

  /**
   * Initializes data directory and loads data
   */
  init() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.save();
      }
    } catch (err) {
      logger.error('فشل في تحميل قاعدة البيانات المحلية، تم التهيئة الافتراضية', err);
    }
  }

  /**
   * Saves current data to disk
   */
  save() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      logger.error('فشل في حفظ بيانات النقاط إلى القرص', err);
    }
  }

  /**
   * Ensures guild and user structures exist in data
   */
  _ensureUser(guildId, userId, username = 'لاعب ديسكورد') {
    if (!this.data.guilds[guildId]) {
      this.data.guilds[guildId] = {};
    }
    if (!this.data.guilds[guildId][userId]) {
      this.data.guilds[guildId][userId] = {
        userId,
        username: username || 'لاعب ديسكورد',
        points: 0,
        totalWins: 0,
        games: {
          reverse: 0,
          flags: 0,
          xo: 0,
        },
        firstSeen: new Date().toISOString(),
        lastWon: null,
      };
    } else if (username && this.data.guilds[guildId][userId].username !== username) {
      this.data.guilds[guildId][userId].username = username;
    }
    return this.data.guilds[guildId][userId];
  }

  /**
   * Records a game win for a player in a specific guild
   * @param {string} guildId 
   * @param {string} userId 
   * @param {string} username 
   * @param {'reverse' | 'flags' | 'xo'} gameType 
   * @param {number} points 
   * @returns {object} Updated user stats
   */
  addWin(guildId, userId, username, gameType = 'reverse', points = 10) {
    const user = this._ensureUser(guildId, userId, username);
    
    user.points += points;
    user.totalWins += 1;
    if (!user.games[gameType]) {
      user.games[gameType] = 0;
    }
    user.games[gameType] += 1;
    user.lastWon = new Date().toISOString();

    // Global stats update
    this.data.global.totalGamesPlayed = (this.data.global.totalGamesPlayed || 0) + 1;
    this.data.global.totalPointsAwarded = (this.data.global.totalPointsAwarded || 0) + points;

    this.save();
    return user;
  }

  /**
   * Retrieves player's score and stats for a guild
   * @param {string} guildId 
   * @param {string} userId 
   * @returns {object|null}
   */
  getUserScore(guildId, userId) {
    if (!this.data.guilds[guildId] || !this.data.guilds[guildId][userId]) {
      return null;
    }
    return this.data.guilds[guildId][userId];
  }

  /**
   * Retrieves server leaderboard sorted by points
   * @param {string} guildId 
   * @param {number} limit 
   * @returns {Array<object>}
   */
  getGuildLeaderboard(guildId, limit = 10) {
    const guildUsers = this.data.guilds[guildId];
    if (!guildUsers) return [];

    const list = Object.values(guildUsers);
    list.sort((a, b) => b.points - a.points || b.totalWins - a.totalWins);
    return list.slice(0, limit);
  }

  /**
   * Retrieves all guild scores or global stats
   */
  getAllData() {
    return this.data;
  }

  /**
   * Resets scores for a specific guild
   * @param {string} guildId 
   */
  resetGuildScores(guildId) {
    if (this.data.guilds[guildId]) {
      this.data.guilds[guildId] = {};
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Get overall stats across all servers
   */
  getGlobalStats() {
    const totalGuilds = Object.keys(this.data.guilds).length;
    let totalPlayers = 0;
    for (const guildId in this.data.guilds) {
      totalPlayers += Object.keys(this.data.guilds[guildId]).length;
    }
    return {
      totalGuilds,
      totalPlayers,
      totalGamesPlayed: this.data.global.totalGamesPlayed || 0,
      totalPointsAwarded: this.data.global.totalPointsAwarded || 0,
    };
  }
}

export const db = new JSONDatabase();
export default db;
