import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import Database from 'better-sqlite3';
import { Canvas, Image } from '@julusian/skia-canvas';
import renderBox, { renderSkin } from '../helper/render.js';
import { abbreviateNumber, doubleDigits, nameToUuid, uuidToName } from '../helper/utils.js';
import { DiscordMember, HypixelGuildMember, StringObject } from '../types/global.d.js';
import config from '../config.json' assert { type: 'json' };
import { fetchStatus } from '../api.js';

const db = new Database('guild.db');

const tagColor: StringObject = {
  '[Slayer]': '§2[Slayer]',
  '[Hero]': '§6[Hero]',
  '[Elite]': '§5[Elite]',
  '[Staff]': '§c[Staff]',
  '[Owner]': '§4[Owner]',
  '[GM]': '§4[GM]'
};

export const data = new SlashCommandBuilder()
  .setName('member')
  .setDescription('View individual guild member stats')
  .addStringOption((option) =>
    option.setName('name').setDescription('Minecraft username').setRequired(true).setAutocomplete(true)
  );
export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const uuid = await nameToUuid(interaction.options.getString('name')!);
  if (!uuid) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle('Error')
      .setDescription(`<a:across:986170696512204820> **${interaction.options.getString('name')}** is an invalid IGN`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  const member = db.prepare('SELECT * FROM guildMembers WHERE uuid = (?)').get(uuid) as HypixelGuildMember;
  if (!member) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle('Error')
      .setDescription(`<a:across:986170696512204820> **${interaction.options.getString('name')}** is not in Dominance`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  const canvas = new Canvas(591, 568);
  const ctx = canvas.getContext('2d');
  const image = new Image();
  image.src = './images/member_bg.png';
  ctx.filter = 'blur(6px)';
  ctx.drawImage(image, 0, 0);
  ctx.filter = 'none';

  renderBox(
    ctx,
    {
      x: 13,
      y: 14,
      width: 125,
      height: 132
    },
    {
      text: '',
      font: '40px Minecraft'
    }
  );

  renderBox(
    ctx,
    {
      x: 146,
      y: 14,
      width: 432,
      height: 52
    },
    {
      text: member.nameColor,
      font: '40px Minecraft'
    }
  );

  renderBox(
    ctx,
    {
      x: 146,
      y: 74,
      width: 432,
      height: 32
    },
    {
      text: `§f${new Date(member.joined).toLocaleDateString('en-GB', {
        timeZone: 'UTC'
      })} ➔ ${new Date().toLocaleDateString('en-GB', { timeZone: 'UTC' })}`,
      font: '20px Minecraft'
    }
  );

  renderBox(
    ctx,
    {
      x: 146,
      y: 114,
      width: 124,
      height: 32
    },
    {
      text: tagColor[member.tag],
      font: '22px Minecraft Bold'
    }
  );

  renderBox(
    ctx,
    {
      x: 278,
      y: 114,
      width: 300,
      height: 32
    },
    {
      text: '§cLifetime §fGuild Stats',
      font: '20px Minecraft Bold'
    }
  );

  let y = 154;
  let x = 13;

  let monthlyGexp = 0;
  const date = new Date();
  for (let i = 0; i < 30; i++) {
    const gexp = member[`${date.getFullYear()}-${doubleDigits(date.getMonth() + 1)}-${doubleDigits(date.getDate())}`];
    if (gexp && gexp) {
      monthlyGexp += gexp;
    }
    date.setDate(date.getDate() - 1);
  }

  let lifetimeGexp = 0;
  for (const i in member) {
    if (/[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(i)) {
      lifetimeGexp += Number(member[i]);
    }
  }

  let dcMessages;
  if (!member.discord!) {
    dcMessages = 0;
  } else {
    dcMessages = (db.prepare('SELECT messages FROM members WHERE discord = ?').get(member.discord) as DiscordMember)
      .messages;
    if (!dcMessages) {
      dcMessages = 0;
    }
  }

  const mainData = [
    ['§aDaily GEXP', `§a${abbreviateNumber(member[Object.keys(member)[Object.keys(member).length - 1]])}`],
    ['§aWeekly GEXP', `§a${abbreviateNumber(member.weeklyGexp)}`],
    ['§aMonthly GEXP', `§a${abbreviateNumber(monthlyGexp)}`],
    ['§cLifetime GEXP', `§c${abbreviateNumber(lifetimeGexp)}`],
    [
      '§cGEXP / Day',
      `§c${abbreviateNumber(
        lifetimeGexp / Number((new Date().getTime() - new Date(member.joined).getTime()) / (1000 * 3600 * 24))
      )}`
    ],
    ['§cGEXP / Playtime', `§c${abbreviateNumber(lifetimeGexp / (member.playtime / 3600))} / H`],
    ['§6Playtime', `§6${(member.playtime / 3600).toFixed(1)}H`],
    ['§6MC Messages', `§6${member.messages}`],
    ['§6DC Messages', `§6${dcMessages}`]
  ];

  for (let i = 0; i < 9; i++) {
    if (i % 3 === 0 && i !== 0) {
      x = 13;
      y += 88;
    }
    renderBox(
      ctx,
      {
        x,
        y,
        width: 183,
        height: 80
      },
      {
        header: mainData[i][0],
        text: mainData[i][1],
        font: '30px Minecraft',
        textY: [10, 36]
      }
    );
    x += 191;
  }

  let totalWeeklyGexp = 0;
  const allWeeklyGexp = db.prepare('SELECT weeklyGexp FROM guildMembers').all() as HypixelGuildMember[];
  for (const i of allWeeklyGexp) {
    totalWeeklyGexp += i.weeklyGexp;
  }

  renderBox(
    ctx,
    {
      x: 13,
      y: 418,
      width: 279,
      height: 54
    },
    {
      header: '§bWeekly Guild Contribution',
      text: `§b${((member.weeklyGexp / totalWeeklyGexp) * 100).toFixed(1)}%`,
      font: '20px Minecraft',
      textY: [3, 30]
    }
  );

  let totalLifetimeGexp = 0;
  const allLifetimeGexp = db.prepare('SELECT * FROM guildMembers').all() as HypixelGuildMember[];
  for (const memberData of allLifetimeGexp) {
    for (const i in memberData) {
      if (/[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(i)) {
        totalLifetimeGexp += Number(memberData[i]);
      }
    }
  }

  renderBox(
    ctx,
    {
      x: 299,
      y: 418,
      width: 279,
      height: 54
    },
    {
      header: '§bLifetime Guild Contribution',
      text: `§b${((lifetimeGexp / totalLifetimeGexp) * 100).toFixed(1)}%`,
      font: '20px Minecraft',
      textY: [3, 30]
    }
  );

  let online = '§cCurrently Offline';
  const status = await fetchStatus(uuid);
  if (status.success && status.session.online) {
    online = '§aCurrently Online';
  } else if ((await uuidToName(uuid))! in global.playtime) {
    online = '§aCurrently Online';
  }

  renderBox(
    ctx,
    {
      x: 13,
      y: 480,
      width: 565,
      height: 32
    },
    {
      text: online,
      font: '20px Minecraft'
    }
  );

  renderBox(
    ctx,
    {
      x: 13,
      y: 521,
      width: 565,
      height: 34
    },
    {
      text: '§gDo§hmin§ian§jce',
      font: '20px Minecraft Bold'
    }
  );

  await renderSkin(ctx, { x: 15, y: 14, width: 126, height: 132 }, uuid);

  await interaction.editReply({ files: [await canvas.toBuffer('png')] });
}
