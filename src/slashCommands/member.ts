import { readFileSync } from 'fs';
import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { createCanvas, Image } from '@napi-rs/canvas';
import renderBox, { renderSkin } from '../helper/render.js';
import { abbreviateNumber, nameToUuid, uuidToName } from '../helper/utils.js';
import { StringObject } from '../types/global.d.js';
import config from '../config.json' assert { type: 'json' };
import { hypixel } from '../index.js';
import {
  fetchGexpForMember,
  fetchGuildMember,
  fetchMember,
  fetchTotalLifetimeGexp,
  fetchTotalWeeklyGexp
} from '../handlers/databaseHandler.js';

const tagColorCodes: StringObject = {
  '[Slayer]': '§2[Slayer]',
  '[Hero]': '§6[Hero]',
  '[Elite]': '§5[Elite]',
  '[Staff]': '§c[Staff]',
  '[Owner]': '§4[Owner]',
  '[GM]': '§4[GM]'
};

async function getOnlineStatus(uuid: string) {
  async function isOnline() {
    const status = await hypixel.getStatus(uuid);
    return status.online;
  }

  async function isInPlaytime() {
    return (await uuidToName(uuid))! in global.playtime;
  }

  return (await (isOnline() || isInPlaytime())) ? '§aCurrently Online' : '§cCurrently Offline';
}

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

  const guildMember = fetchGuildMember(uuid);
  if (!guildMember) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle('Error')
      .setDescription(`<a:across:986170696512204820> **${interaction.options.getString('name')}** is not in Dominance`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const gexpHistory = fetchGexpForMember(uuid);

  const canvas = createCanvas(591, 568);
  const ctx = canvas.getContext('2d');
  const image = new Image();
  image.src = readFileSync('./images/member_bg.png');
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
      text: guildMember.nameColor,
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
      text: `§f${new Date(guildMember.joined).toLocaleDateString('en-GB', {
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
      text: tagColorCodes[guildMember.tag],
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

  const dcMessages = fetchMember(uuid)?.messages ?? 0;

  const mainData = [
    ['§aDaily GEXP', `§a${abbreviateNumber(gexpHistory.dailyGexp)}`],
    ['§aWeekly GEXP', `§a${abbreviateNumber(gexpHistory.weeklyGexp)}`],
    ['§aMonthly GEXP', `§a${abbreviateNumber(gexpHistory.monthlyGexp)}`],
    ['§cLifetime GEXP', `§c${abbreviateNumber(gexpHistory.lifetimeGexp)}`],
    [
      '§cGEXP / Day',
      `§c${abbreviateNumber(
        gexpHistory.lifetimeGexp /
          Number((new Date().getTime() - new Date(guildMember.joined).getTime()) / (1000 * 3600 * 24))
      )}`
    ],
    ['§cGEXP / Playtime', `§c${abbreviateNumber(gexpHistory.lifetimeGexp / (guildMember.playtime / 3600))} / H`],
    ['§6Playtime', `§6${(guildMember.playtime / 3600).toFixed(1)}H`],
    ['§6MC Messages', `§6${guildMember.messages}`],
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
      text: `§b${((guildMember.weeklyGexp / fetchTotalWeeklyGexp()) * 100).toFixed(1)}%`,
      font: '20px Minecraft',
      textY: [3, 30]
    }
  );

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
      text: `§b${((gexpHistory.lifetimeGexp / fetchTotalLifetimeGexp()) * 100).toFixed(1)}%`,
      font: '20px Minecraft',
      textY: [3, 30]
    }
  );

  renderBox(
    ctx,
    {
      x: 13,
      y: 480,
      width: 565,
      height: 32
    },
    {
      text: await getOnlineStatus(uuid),
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

  await interaction.editReply({ files: [canvas.toBuffer('image/png')] });
}
