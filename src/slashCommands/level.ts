import { Canvas, FontLibrary, loadImage } from '@julusian/skia-canvas';
import { ChatInputCommandInteraction, EmbedBuilder, GuildMember, SlashCommandBuilder } from 'discord.js';
import Database from 'better-sqlite3';
import { getLevelDetails } from '../helper/utils.js';
import { DiscordMember } from '../types/global.js';
import config from '../config.json' assert { type: 'json' };

FontLibrary.use('Nunito', './fonts/Nunito.ttf');
const db = new Database('guild.db');

interface RankCardOptions {
  displayName: string;
  currentLvl: number;
  rank: number;
  xp: number;
  requiredXP: number;
  status: string | undefined;
  avatar: string;
  font?: string;
  colorTextDefault?: string;
  currentXPColor?: string;
  requiredXPColor?: string;
}

async function createRankCard({
  displayName,
  currentLvl,
  rank,
  xp,
  requiredXP,
  status,
  avatar,
  font = 'Nunito',
  colorTextDefault = '#FFFFFF',
  currentXPColor = '#FFFFFF',
  requiredXPColor = '#7F8384'
}: RankCardOptions) {
  const canvas = new Canvas(1000, 250);
  const ctx = canvas.getContext('2d');

  // Border radius
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(1000, 250);
  ctx.arcTo(0, 250, 0, 0, 30);
  ctx.arcTo(0, 0, 1000, 0, 30);
  ctx.arcTo(1000, 0, 1000, 250, 30);
  ctx.arcTo(1000, 250, 0, 250, 30);
  ctx.clip();

  // Background
  ctx.drawImage(await loadImage('./images/levels.png'), 0, 0, canvas.width, canvas.height);

  // Avatar
  ctx.beginPath();
  ctx.arc(105, 125, 75, 0, Math.PI * 0.36, true);
  ctx.arc(159, 179, 23.5, Math.PI * 0.82, Math.PI * 1.68, false);
  ctx.arc(105, 125, 75, Math.PI * 0.15, Math.PI * 1.5, true);
  ctx.closePath();
  ctx.save();
  ctx.clip();
  try {
    ctx.drawImage(await loadImage(avatar), 30, 50, 150, 150);
  } catch (err) {
    throw new Error('Error loading the avatar image. The URL may be invalid.');
  }
  ctx.restore();

  // Status
  ctx.beginPath();
  if (status === 'online') {
    ctx.arc(159, 179, 17, 0, Math.PI * 2);
    ctx.fillStyle = '#57F287';
  } else if (status === 'idle') {
    ctx.arc(159, 179, 17, Math.PI * 0.9, Math.PI * 1.6, true);
    ctx.arc(148, 168, 17, Math.PI * 1.9, Math.PI * 0.6);
    ctx.fillStyle = '#faa61a';
  } else if (status === 'dnd') {
    ctx.arc(151, 179, 3.5, Math.PI * 1.5, Math.PI * 0.5, true);
    ctx.arc(167, 179, 3.5, Math.PI * 0.5, Math.PI * 1.5, true);
    ctx.closePath();
    ctx.arc(159, 179, 17, 0, Math.PI * 2);
    ctx.fillStyle = '#ed4245';
  } else if (status === 'streaming') {
    ctx.moveTo(168, 179);
    ctx.lineTo(154.5, 170);
    ctx.lineTo(154.5, 188);
    ctx.closePath();
    ctx.arc(159, 179, 17, 0, Math.PI * 2);
    ctx.fillStyle = '#593695';
  } else {
    ctx.arc(159, 179, 9, Math.PI * 1.5, Math.PI * 0.5, true);
    ctx.arc(159, 179, 9, Math.PI * 0.5, Math.PI * 1.5, true);
    ctx.closePath();
    ctx.arc(159, 179, 17, 0, Math.PI * 2);
    ctx.fillStyle = '#747f8d';
  }
  ctx.fill();

  // Progress Bar Back
  ctx.save();

  ctx.beginPath();
  ctx.fillStyle = '#333333';
  ctx.arc(canvas.width - 47.5, 182.5, 17.5, Math.PI * 1.5, Math.PI * 0.5);
  ctx.arc(227.5, 182.5, 17.5, Math.PI * 0.5, Math.PI * 1.5);
  ctx.fill();
  ctx.clip();
  ctx.closePath();

  // Progress Bar Front
  const currentPercentXP = Math.floor((xp / requiredXP) * 100);
  if (currentPercentXP >= 1) {
    ctx.beginPath();
    const onePercentBar = (canvas.width - 30 - 210) / 100;
    const pxBar = onePercentBar * currentPercentXP;
    ctx.fillStyle = '#3cc356';
    ctx.arc(192.5 + pxBar, 182.5, 17.5, Math.PI * 1.5, Math.PI * 0.5);
    ctx.arc(227.5, 182.5, 17.5, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  }

  let offsetLvlXP = canvas.width - 30;

  // XP
  ctx.save();
  ctx.font = `600 35px '${font}'`;
  ctx.textAlign = 'right';
  ctx.fillStyle = requiredXPColor;
  ctx.fillText(`${requiredXP} XP`, offsetLvlXP, 150);
  offsetLvlXP -= ctx.measureText(`${requiredXP} XP`).width + 3;
  ctx.fillText('/', offsetLvlXP, 150);
  ctx.fillStyle = currentXPColor;
  offsetLvlXP -= ctx.measureText(`/`).width + 3;
  ctx.fillText(`${xp}`, offsetLvlXP, 150);
  offsetLvlXP -= ctx.measureText(`${xp}`).width;
  ctx.restore();

  // Username
  ctx.font = `800 40px '${font}'`;
  ctx.fillStyle = colorTextDefault;
  ctx.fillText(displayName.toUpperCase(), 210, 150, offsetLvlXP - 210 - 15);

  ctx.save();

  // Level
  let offsetRankX = canvas.width - 30;
  ctx.textAlign = 'right';

  ctx.fillStyle = colorTextDefault;

  ctx.font = `600 60px '${font}'`;
  ctx.fillText(`${currentLvl}`, offsetRankX, 75);
  offsetRankX -= ctx.measureText(`${currentLvl}`).width + 5;

  ctx.font = `600 35px '${font}'`;
  ctx.fillText(`LEVEL `, offsetRankX, 75);
  offsetRankX -= ctx.measureText('LEVEL ').width;

  // Rank
  ctx.font = `600 60px '${font}'`;
  ctx.fillText(`#${rank}`, offsetRankX, 75);
  offsetRankX -= ctx.measureText(`#${rank}`).width + 5;

  ctx.font = `600 35px '${font}'`;
  ctx.fillText(' RANK ', offsetRankX, 75);
  ctx.restore();

  return canvas;
}

export const data = new SlashCommandBuilder()
  .setName('level')
  .setDescription('View your levelling information')
  .addUserOption((option) => option.setName('member').setDescription('The user that you want to check the level of'));

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const user = (
    interaction.options.getMember('member') ? interaction.options.getMember('member')! : interaction.member!
  ) as GuildMember;
  const member = db.prepare('SELECT xp FROM members WHERE discord = ?').get(user.id) as DiscordMember;

  if (!member) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle('Error')
      .setDescription(`<a:across:986170696512204820> **${user}** is not verified`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const { displayName } = user;
  const { rank } = db
    .prepare(
      'SELECT rank FROM (SELECT xp, discord, RANK() OVER (ORDER BY xp DESC) as rank FROM members) WHERE discord = ?'
    )
    .get(user.id) as { rank: number };
  const { xp } = member;
  const { currentLevel, xpInCurrentLevel, xpTillNextLevel } = getLevelDetails(xp);
  const status = user.presence?.status;
  const displayAvatarURL = user.displayAvatarURL({ extension: 'png' });

  const rankCard = await createRankCard({
    displayName,
    currentLvl: currentLevel,
    rank,
    xp: xpInCurrentLevel,
    requiredXP: xpInCurrentLevel + xpTillNextLevel,
    status,
    avatar: displayAvatarURL
  });

  await interaction.editReply({ files: [await rankCard.toBuffer('png')] });
}
