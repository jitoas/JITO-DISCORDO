/**
 * Hybrid Persistent Database / Scoring System for جعفر (Ja'far) Discord Bot
 * Supports PostgreSQL (Supabase / Render / Neon / Cloud PostgreSQL) via DATABASE_URL
 * with high-performance in-memory cache and local JSON safety fallback.
 * 
 * Features:
 * - Persistent across Render / cloud restarts, deploys, and container sleep cycles.
 * - Automatic schema creation (`jafar_scores` table and indexes).
 * - Automatic migration from local JSON database to PostgreSQL on startup.
 * - Zero-downtime resilient error handling (database network drops never crash the Discord bot).
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import config from '../config/index.js';
import logger from '../utils/logger.js';

const { Pool } = pg;

class DatabaseManager {
  constructor() {
    this.dataDir = path.resolve(process.cwd(), config.storage.dataPath);
    this.filePath = path.resolve(process.cwd(), config.storage.scoresFile);
    
    // In-memory cache for sub-millisecond query responses
    this.data = {
      guilds: {}, // { [guildId]: { [userId]: { userId, username, points, totalWins, games: { reverse: 0, flags: 0, xo: 0 }, firstSeen, lastWon } } }
      global: {
        totalGamesPlayed: 0,
        totalPointsAwarded: 0,
        createdAt: new Date().toISOString(),
      },
    };

    this.pool = null;
    this.isPostgresConnected = false;
    this.isInitialized = false;

    // 1. Load local fallback data first
    this._loadLocalBackup();

    // 2. Initialize PostgreSQL if DATABASE_URL is configured
    this.init();
  }

  /**
   * Loads cached scores from local disk if available
   */
  _loadLocalBackup() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (parsed && typeof parsed === 'object') {
          this.data = {
            guilds: parsed.guilds || {},
            global: parsed.global || {
              totalGamesPlayed: 0,
              totalPointsAwarded: 0,
              createdAt: new Date().toISOString(),
            },
          };
        }
      }
    } catch (err) {
      logger.warn('تعذر قراءة النسخة المحلية لملف النقاط، تم استخدام الذاكرة المؤقتة', err.message);
    }
  }

  /**
   * Saves in-memory cache to local JSON file as backup
   */
  _saveLocalBackup() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      // Non-critical local save failure warning
    }
  }

  /**
   * Initializes PostgreSQL connection, ensures table schema, and migrates data
   */
  async init() {
    const databaseUrl = config.storage.databaseUrl || process.env.DATABASE_URL;

    if (!databaseUrl || databaseUrl.trim() === '') {
      logger.info('📦 لم يتم تحديد DATABASE_URL. يعمل نظام النقاط بوضع الذاكرة والتخزين المحلي.');
      return;
    }

    try {
      const isLocalhost = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

      this.pool = new Pool({
        connectionString: databaseUrl,
        ssl: isLocalhost ? false : { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000,
        allowExitOnIdle: false,
      });

      // Handle background pool client errors without crashing
      this.pool.on('error', (err) => {
        logger.warn(
          `PostgreSQL Pool background client warning ➔ [${err.name || 'Error'}] ${err.message}${err.code ? ` (Code: ${err.code})` : ''}`,
          err
        );
      });

      // Verify connection
      const client = await this.pool.connect();
      try {
        // 1. Create table schema if not exists
        await client.query(`
          CREATE TABLE IF NOT EXISTS jafar_scores (
            guild_id VARCHAR(64) NOT NULL,
            user_id VARCHAR(64) NOT NULL,
            username VARCHAR(255) DEFAULT 'لاعب ديسكورد',
            points INTEGER DEFAULT 0,
            total_wins INTEGER DEFAULT 0,
            reverse_wins INTEGER DEFAULT 0,
            flags_wins INTEGER DEFAULT 0,
            harf_wins INTEGER DEFAULT 0,
            xo_wins INTEGER DEFAULT 0,
            first_seen TIMESTAMPTZ DEFAULT NOW(),
            last_won TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (guild_id, user_id)
          );

          ALTER TABLE jafar_scores ADD COLUMN IF NOT EXISTS harf_wins INTEGER DEFAULT 0;

          CREATE INDEX IF NOT EXISTS idx_jafar_scores_guild_pts 
          ON jafar_scores (guild_id, points DESC, total_wins DESC);
        `);

        this.isPostgresConnected = true;
        logger.success('🐘 تم الاتصال بنجاح بقاعدة بيانات PostgreSQL الدائمة (Supabase / Render / Cloud)!');

        // 2. Auto-migrate local JSON data to PostgreSQL if DB is empty or has missing players
        await this._migrateLocalDataToPostgres(client);

        // 3. Populate in-memory cache with all persistent records from PostgreSQL
        await this._syncCacheFromPostgres(client);

      } finally {
        client.release();
      }

      this.isInitialized = true;
    } catch (err) {
      this.isPostgresConnected = false;
      const errorDetails = [
        err.name ? `Type: ${err.name}` : null,
        err.code ? `Code: ${err.code}` : null,
        err.message ? `Message: ${err.message}` : null,
        err.detail ? `Detail: ${err.detail}` : null,
        err.hint ? `Hint: ${err.hint}` : null,
      ].filter(Boolean).join(' | ');

      logger.error(
        `⚠️ تعذر الاتصال بـ PostgreSQL (سيستمر البوت بالعمل باستخدام التخزين المحلي) ➔ ${errorDetails}`,
        err
      );
    }
  }

  /**
   * Migrates existing local JSON scores to PostgreSQL without overwriting higher database points
   */
  async _migrateLocalDataToPostgres(client) {
    try {
      let migratedCount = 0;
      for (const guildId in this.data.guilds) {
        const guildUsers = this.data.guilds[guildId];
        for (const userId in guildUsers) {
          const user = guildUsers[userId];
          const reverseWins = user.games?.reverse || 0;
          const flagsWins = user.games?.flags || 0;
          const harfWins = user.games?.harf || 0;
          const xoWins = user.games?.xo || 0;
          const totalWins = user.totalWins || (reverseWins + flagsWins + harfWins + xoWins);

          await client.query(`
            INSERT INTO jafar_scores (
              guild_id, user_id, username, points, total_wins,
              reverse_wins, flags_wins, harf_wins, xo_wins, first_seen, last_won, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), NOW())
            ON CONFLICT (guild_id, user_id) DO UPDATE SET
              username = EXCLUDED.username,
              points = GREATEST(jafar_scores.points, EXCLUDED.points),
              total_wins = GREATEST(jafar_scores.total_wins, EXCLUDED.total_wins),
              reverse_wins = GREATEST(jafar_scores.reverse_wins, EXCLUDED.reverse_wins),
              flags_wins = GREATEST(jafar_scores.flags_wins, EXCLUDED.flags_wins),
              harf_wins = GREATEST(jafar_scores.harf_wins, EXCLUDED.harf_wins),
              xo_wins = GREATEST(jafar_scores.xo_wins, EXCLUDED.xo_wins);
          `, [
            guildId,
            userId,
            user.username || 'لاعب ديسكورد',
            user.points || 0,
            totalWins,
            reverseWins,
            flagsWins,
            harfWins,
            xoWins
          ]);
          migratedCount++;
        }
      }

      if (migratedCount > 0) {
        logger.info(`✨ تم ترحيل ومزامنة ${migratedCount} لاعب بنجاح إلى PostgreSQL.`);
      }
    } catch (err) {
      logger.warn('تنبيه أثناء ترحيل البيانات المحلية إلى PostgreSQL:', err.message);
    }
  }

  /**
   * Pulls all scores from PostgreSQL into memory cache
   */
  async _syncCacheFromPostgres(client = null) {
    try {
      const runner = client || this.pool;
      if (!runner) return;

      const res = await runner.query(`
        SELECT 
          guild_id, user_id, username, points, total_wins,
          reverse_wins, flags_wins, harf_wins, xo_wins, first_seen, last_won
        FROM jafar_scores;
      `);

      let totalPoints = 0;
      let totalWins = 0;

      // Reset cache guilds
      const newGuilds = {};

      for (const row of res.rows) {
        if (!newGuilds[row.guild_id]) {
          newGuilds[row.guild_id] = {};
        }

        const points = Number(row.points) || 0;
        const total = Number(row.total_wins) || 0;

        newGuilds[row.guild_id][row.user_id] = {
          userId: row.user_id,
          username: row.username || 'لاعب ديسكورد',
          points,
          totalWins: total,
          games: {
            reverse: Number(row.reverse_wins) || 0,
            flags: Number(row.flags_wins) || 0,
            harf: Number(row.harf_wins) || 0,
            xo: Number(row.xo_wins) || 0,
          },
          firstSeen: row.first_seen ? new Date(row.first_seen).toISOString() : new Date().toISOString(),
          lastWon: row.last_won ? new Date(row.last_won).toISOString() : null,
        };

        totalPoints += points;
        totalWins += total;
      }

      this.data.guilds = newGuilds;
      this.data.global.totalPointsAwarded = totalPoints;
      this.data.global.totalGamesPlayed = totalWins;

      this._saveLocalBackup();
    } catch (err) {
      logger.warn('خطأ أثناء مزامنة الذاكرة من PostgreSQL:', err.message);
    }
  }

  /**
   * Ensures guild and user structures exist in memory cache
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
          harf: 0,
          xo: 0,
        },
        firstSeen: new Date().toISOString(),
        lastWon: null,
      };
    } else if (username && username !== 'لاعب ديسكورد' && this.data.guilds[guildId][userId].username !== username) {
      this.data.guilds[guildId][userId].username = username;
    }
    return this.data.guilds[guildId][userId];
  }

  /**
   * Records a game win for a player in a specific guild
   * @param {string} guildId 
   * @param {string} userId 
   * @param {string} username 
   * @param {'reverse' | 'flags' | 'harf' | 'xo'} gameType 
   * @param {number} points 
   * @returns {object} Updated user stats
   */
  addWin(guildId, userId, username, gameType = 'reverse', points = 10) {
    const user = this._ensureUser(guildId, userId, username);
    
    // 1. Immediate in-memory update
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

    // Save local backup file
    this._saveLocalBackup();

    // 2. Asynchronous write-through to PostgreSQL (non-blocking)
    if (this.pool && this.isPostgresConnected) {
      const reverseWin = gameType === 'reverse' ? 1 : 0;
      const flagsWin = gameType === 'flags' ? 1 : 0;
      const harfWin = gameType === 'harf' ? 1 : 0;
      const xoWin = gameType === 'xo' ? 1 : 0;

      this.pool.query(`
        INSERT INTO jafar_scores (
          guild_id, user_id, username, points, total_wins,
          reverse_wins, flags_wins, harf_wins, xo_wins,
          first_seen, last_won, updated_at
        )
        VALUES ($1, $2, $3, $4, 1, $5, $6, $7, $8, NOW(), NOW(), NOW())
        ON CONFLICT (guild_id, user_id) DO UPDATE SET
          username = EXCLUDED.username,
          points = jafar_scores.points + EXCLUDED.points,
          total_wins = jafar_scores.total_wins + 1,
          reverse_wins = jafar_scores.reverse_wins + EXCLUDED.reverse_wins,
          flags_wins = jafar_scores.flags_wins + EXCLUDED.flags_wins,
          harf_wins = jafar_scores.harf_wins + EXCLUDED.harf_wins,
          xo_wins = jafar_scores.xo_wins + EXCLUDED.xo_wins,
          last_won = NOW(),
          updated_at = NOW()
        RETURNING *;
      `, [
        guildId,
        userId,
        username || 'لاعب ديسكورد',
        points,
        reverseWin,
        flagsWin,
        harfWin,
        xoWin
      ]).catch((err) => {
        logger.warn(
          `خطأ أثناء حفظ النتيجة في PostgreSQL ➔ [${err.name || 'Error'}] ${err.message}${err.code ? ` (Code: ${err.code})` : ''}`,
          err
        );
      });
    }

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
    list.sort((a, b) => (b.points - a.points) || (b.totalWins - a.totalWins));
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
      this._saveLocalBackup();

      if (this.pool && this.isPostgresConnected) {
        this.pool.query('DELETE FROM jafar_scores WHERE guild_id = $1;', [guildId])
          .catch((err) =>
            logger.warn(
              `خطأ أثناء تصفير النقاط في PostgreSQL ➔ [${err.name || 'Error'}] ${err.message}${err.code ? ` (Code: ${err.code})` : ''}`,
              err
            )
          );
      }
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
      isPostgres: this.isPostgresConnected,
    };
  }

  /**
   * Retrieves database connection status for dashboard / health check
   */
  getStatus() {
    return {
      type: this.isPostgresConnected ? 'postgresql' : 'local_json',
      isPostgresConnected: this.isPostgresConnected,
      hasDatabaseUrl: Boolean(config.storage.databaseUrl || process.env.DATABASE_URL),
    };
  }
}

export const db = new DatabaseManager();
export default db;
