/**
 * Unified Arabic Embed Builder for جعفر Bot
 */

import { EmbedBuilder } from 'discord.js';
import config from '../config/index.js';

export const embeds = {
  /**
   * Embed for لعبة اعكس (Reverse Game)
   */
  reverseGame: (wordObj, timerSeconds) => {
    return new EmbedBuilder()
      .setColor(config.colors.gameReverse)
      .setTitle('🎮 لعبة اعكس — أسرع إجابة تفوز!')
      .setDescription(
        `المطلوب: قم بكتابة الكلمة التالية **بالعكس (حرفاً بحرف)** بأسرع ما يمكن!\n\n` +
        `🔤 الكلمة: **\`${wordObj.word}\`**\n` +
        `📂 التصنيف: **${wordObj.category || 'عام'}** • الصعوبة: **${wordObj.difficulty || 'متوسط'}**\n\n` +
        `⏱️ لديك **${timerSeconds}** ثانية للإجابة!\n` +
        `💡 اكتب إجابتك في الشات مباشرة.`
      )
      .setFooter({ text: `بوت جعفر • لعبة اعكس • اكتب الكلمة المعكوسة في الشات` })
      .setTimestamp();
  },

  /**
   * Embed for لعبة أعلام (Flags Game)
   */
  /**
   * Embed for لعبة أعلام (Flags Game) - Real image, no emojis, no region, no country code
   */
  flagsGame: (countryObj, timerSeconds) => {
    const flagUrl = countryObj.flagImageUrl || `https://flagcdn.com/w640/${countryObj.code.toLowerCase()}.png`;
    return new EmbedBuilder()
      .setColor(config.colors.gameFlags)
      .setTitle('خمن العلم!')
      .setDescription(
        `⏱️ الوقت: **${timerSeconds} ثانية**\n` +
        `💡 اكتب اسم الدولة في الشات مباشرة!`
      )
      .setImage(flagUrl)
      .setFooter({ text: `بوت جعفر • لعبة خمن العلم` })
      .setTimestamp();
  },

  /**
   * Embed for لعبة XO (Tic-Tac-Toe Lobby)
   */
  xoLobby: (hostUser, challengedUser = null) => {
    const embed = new EmbedBuilder()
      .setColor(config.colors.gameXO)
      .setTitle('🎮 تحدي لعبة XO (تيك تاك تو)!')
      .setDescription(
        challengedUser
          ? `⚔️ تحدى <@${hostUser.id}> اللاعب <@${challengedUser.id}> لمباراة XO!\n\n` +
            `❌ **اللاعب الأول (X):** <@${hostUser.id}>\n` +
            `⭕ **اللاعب الثاني (O):** <@${challengedUser.id}>\n\n` +
            `اضغط على الزر بالأسفل لبدء المباراة!`
          : `📢 فتح <@${hostUser.id}> غرفة مباراة XO ويبحث عن منافس!\n\n` +
            `❌ **اللاعب الأول (X):** <@${hostUser.id}>\n` +
            `⭕ **اللاعب الثاني (O):** في انتظار انضمام لاعب...\n\n` +
            `اضغط على زر **انضمام للمباراة 🎮** لتلعب ضده!`
      )
      .setFooter({ text: 'بوت جعفر • لعبة XO ثنائية اللاعبين' })
      .setTimestamp();
    return embed;
  },

  /**
   * Embed for active لعبة XO Board
   */
  xoBoard: (player1, player2, currentTurnUserId, boardState) => {
    const isPlayer1Turn = currentTurnUserId === player1.id;
    const turnEmoji = isPlayer1Turn ? '❌' : '⭕';
    const turnPlayerMention = `<@${currentTurnUserId}>`;

    return new EmbedBuilder()
      .setColor(config.colors.gameXO)
      .setTitle('🎮 مباراة XO (Tic-Tac-Toe)')
      .setDescription(
        `❌ **اللاعب 1 (X):** <@${player1.id}>\n` +
        `⭕ **اللاعب 2 (O):** <@${player2.id}>\n\n` +
        `⏳ **الدور الحالي:** ${turnEmoji} ${turnPlayerMention}\n` +
        `💡 اضغط على الزر المناسب في اللوحة بالأسفل لتضع حركتك.`
      )
      .setFooter({ text: 'بوت جعفر • اختر خانة غير مستخدمة في دورك' })
      .setTimestamp();
  },

  /**
   * Winner Celebration Embed
   */
  winner: (gameTitle, winnerUser, correctAnswer, pointsEarned, timeTakenSec) => {
    return new EmbedBuilder()
      .setColor(config.colors.gold)
      .setTitle(`🏆 فائز رائع في ${gameTitle}!`)
      .setDescription(
        `🎉 كفو يا بطل <@${winnerUser.id}>!\n\n` +
        `✅ الإجابة الصحيحة: **\`${correctAnswer}\`**\n` +
        `⚡ سرعة الإجابة: **${timeTakenSec.toFixed(1)}** ثانية\n` +
        `⭐ النقاط المكتسبة: **+${pointsEarned}** نقطة\n\n` +
        `اكتب \`/leaderboard\` أو \`!نقاط\` لمشاهدة لوحة الشرف!`
      )
      .setThumbnail(winnerUser.displayAvatarURL ? winnerUser.displayAvatarURL({ dynamic: true }) : null)
      .setFooter({ text: `بوت جعفر للألعاب • مبروك الفوز!` })
      .setTimestamp();
  },

  /**
   * Timeout / No Winner Embed
   */
  timeout: (gameTitle, correctAnswer) => {
    return new EmbedBuilder()
      .setColor(config.colors.error)
      .setTitle(`⌛ انتهى الوقت في ${gameTitle}!`)
      .setDescription(
        `للأسف، انتهى الوقت ولم يتمكن أحد من الإجابة الصحيحة.\n\n` +
        `💡 الإجابة الصحيحة كانت: **\`${correctAnswer}\`**\n\n` +
        `جرّب حظك في الجولة القادمة!`
      )
      .setFooter({ text: `بوت جعفر للألعاب` })
      .setTimestamp();
  },

  /**
   * Server Leaderboard Embed
   */
  leaderboard: (guildName, topPlayers) => {
    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    
    let description = '';
    if (!topPlayers || topPlayers.length === 0) {
      description = 'لا توجد نقاط مسجلة في هذا السيرفر حتى الآن!\nابدأ بلعب `/reverse` أو `/flags` أو `/xo` لتتصدر القائمة!';
    } else {
      description = topPlayers
        .map((p, idx) => {
          const medal = medals[idx] || `${idx + 1}.`;
          return `${medal} **${p.username}** — **${p.points}** نقطة \`(${p.totalWins} فوز: 🔄 ${p.games?.reverse || 0} | 🚩 ${p.games?.flags || 0} | 🎮 ${p.games?.xo || 0})\``;
        })
        .join('\n\n');
    }

    return new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`📊 لوحة الشرف ونقاط السيرفر — ${guildName}`)
      .setDescription(description)
      .setFooter({ text: `بوت جعفر • الترتيب يتحدث تلقائياً مع كل فوز` })
      .setTimestamp();
  },

  /**
   * Ping / Status Embed
   */
  ping: (wsPing, botLatency, uptimeStr) => {
    return new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('🏓 بونق! بوت جعفر متصل وجاهز للعب')
      .addFields(
        { name: '⚡ استجابة البوت (Latency)', value: `\`${botLatency}ms\``, inline: true },
        { name: '🌐 سرعة اتصال ديسكورد (WebSocket)', value: `\`${wsPing}ms\``, inline: true },
        { name: '⏱️ مدة التشغيل (Uptime)', value: `\`${uptimeStr}\``, inline: false },
        { name: '🎮 الألعاب المتاحة حالياً', value: '• `/reverse` أو `!اعكس` — لعبة عكس الكلمات\n• `/flags` أو `!اعلام` — لعبة تخمين الأعلام\n• `/leaderboard` أو `!نقاط` — لوحة المتصدرين', inline: false }
      )
      .setFooter({ text: `جعفر • الإصدار ${config.bot.version}` })
      .setTimestamp();
  },

  /**
   * General Error Embed
   */
  error: (msg) => {
    return new EmbedBuilder()
      .setColor(config.colors.error)
      .setTitle('⚠️ تنبيه')
      .setDescription(msg)
      .setTimestamp();
  },
};

export default embeds;
