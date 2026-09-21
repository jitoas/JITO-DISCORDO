/**
 * Slash Command: /help
 * Prefix Command: !مساعدة
 * Guides and information about available mini-games.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import config from '../config/index.js';

export const helpCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('دليل استخدام بوت جعفر وقائمة الألعاب المتاحة')
    .setDescriptionLocalizations({
      'en-US': 'Show Ja\'far bot guide and available mini-games',
      'en-GB': 'Show Ja\'far bot guide and available mini-games',
    }),

  primaryPrefix: '!مساعدة',
  aliases: ['مساعدة', 'اوامر', 'أوامر', 'help', 'دليل'],

  /**
   * Unified executor for both Slash command (/help) and Prefix command (!مساعدة)
   * @param {import('discord.js').ChatInputCommandInteraction | import('discord.js').Message} context 
   */
  async execute(context) {
    const helpEmbed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('🎮 مرحباً بك في بوت جعفر — بوت ألعاب ديسكورد العربية')
      .setDescription(
        `بوت خفيف وسريع مخصص للمنافسة والفعاليات في سيرفرك!\n\n` +
        `**الأوامر والألعاب المتاحة:**\n\n` +
        `🔄 **\`/reverse\`** أو **\`!اعكس\`**\n` +
        `← لعبة عكس الكلمات: يعطيك البوت كلمة عربية والمطلوب كتابتها معكوسة بأسرع وقت (المؤقت: ${config.games.reverse.timerSeconds} ثانية).\n\n` +
        `🚩 **\`/flags\`** أو **\`!اعلام\`**\n` +
        `← لعبة الأعلام: يعطيك البوت صورة علم دولة والمطلوب تخمين اسم الدولة (المؤقت: ${config.games.flags.timerSeconds} ثانية).\n\n` +
        `🔤 **\`/harf\`** أو **\`!حرف\`** أو **\`حرف\`**\n` +
        `← لعبة حرف: يعطيك البوت حرفاً وتصنيفاً والمطلوب كتابة كلمة صحيحة تبدأ بالحرف وضمن التصنيف (المؤقت: ${config.games.harf.timerSeconds} ثانية).\n\n` +
        `❌⭕ **\`/xo\`** أو **\`!xo\`**\n` +
        `← لعبة XO (تيك تاك تو): مباراة تفاعلية بين لاعبين (X و O) بالأزرار.\n\n` +
        `📊 **\`/leaderboard\`** أو **\`!نقاط\`**\n` +
        `← عرض لوحة المتصدرين ونقاط اللاعبين في هذا السيرفر.\n\n` +
        `🎮 **\`/games\`** أو **\`!العاب\`**\n` +
        `← استعراض قائمة الألعاب المتاحة وأوامر تشغيلها.\n\n` +
        `🏓 **\`/ping\`** أو **\`!ping\`**\n` +
        `← فحص سرعة استجابة البوت وحالة الاتصال بالسيرفر.\n\n` +
        `*ملاحظة: يمكنك استخدام الأوامر المائلة (Slash Commands) أو كتابة البادئة \`!\` مع اسم الأمر العربي.*`
      )
      .setFooter({ text: `بوت جعفر • الإصدار ${config.bot.version}` })
      .setTimestamp();

    if (context.isCommand && context.isCommand()) {
      await context.reply({ embeds: [helpEmbed] });
    } else if (context.channel) {
      await context.channel.send({ embeds: [helpEmbed] });
    }
  },
};

export default helpCommand;
