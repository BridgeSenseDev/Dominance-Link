import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { google } from 'googleapis';
import config from '../config.json' assert { type: 'json' };
import { NumberObject } from '../types/global.d.js';

const limits: NumberObject = {
  TOXICITY: 0.7,
  SEVERE_TOXICITY: 0.5,
  IDENTITY_ATTACK: 0.6,
  INSULT: 0.8,
  PROFANITY: 0.7,
  THREAT: 0.8,
  SEXUALLY_EXPLICIT: 0.8,
  OBSCENE: 0.8
};

async function checkProfanity(message: string) {
  message = message.replace(/\*([^*]+)\*/g, '$1');
  message = message.replace(/_([^_]+)_/g, '$1');
  message = message.replace(/\*\*([^*]+)\*\*/g, '$1');
  message = message.replace(/__([^_]+)__/g, '$1');
  message = message.replace(/\|\|([^|]+)\|\|/g, '$1');
  message = message.replace(/~([^~]+)~/g, '$1');
  message = message.replace(/~~([^~]+)~~/g, '$1');
  message = message.replace(/`([^`]+)`/g, '$1');
  message = message.replace(/```([^`]+)```/g, '$1');
  message = message.replace(/:([^:]+):/g, '$1');

  const client = (await google.discoverAPI(
    'https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1'
  )) as any;

  const analyzeRequest = {
    comment: {
      text: message
    },
    requestedAttributes: {
      TOXICITY: {},
      SEVERE_TOXICITY: {},
      IDENTITY_ATTACK: {},
      INSULT: {},
      PROFANITY: {},
      THREAT: {},
      SEXUALLY_EXPLICIT: {}
    }
  };

  const analyzeRequestNotEn = {
    comment: {
      text: message
    },
    requestedAttributes: {
      TOXICITY: {},
      SEVERE_TOXICITY: {},
      IDENTITY_ATTACK: {},
      INSULT: {},
      PROFANITY: {},
      THREAT: {}
    }
  };

  let response;
  try {
    response = await client.comments.analyze({
      key: config.keys.googleCloud,
      resource: analyzeRequest
    });
  } catch (e) {
    try {
      response = await client.comments.analyze({
        key: config.keys.googleCloud,
        resource: analyzeRequestNotEn
      });
    } catch (err) {
      return false;
    }
  }

  return response.data.attributeScores;
}

export const data = new SlashCommandBuilder()
  .setName('automod')
  .setDescription('Test Dominance Link automod filters')
  .addStringOption((option) =>
    option.setName('message').setDescription('The message you want automod to check').setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const message = interaction.options.getString('message')!;
  const scores = await checkProfanity(message);

  const fields = [];
  let passesAutomod = true;

  for (const category in limits) {
    if (!scores[category]?.summaryScore?.value) continue;
    const score = scores[category].summaryScore.value;
    const emoji = score > limits[category] ? '<a:across:986170696512204820>' : '<a:atick:986173414723162113>';
    fields.push({ name: category, value: `${emoji} ${score.toFixed(2)} / ${limits[category]}` });
    if (score > limits[category]) {
      passesAutomod = false;
    }
  }

  const embed = new EmbedBuilder()
    .setTitle(`Message Passes Automod: ${passesAutomod ? 'Yes' : 'No'}`)
    .addFields(...fields)
    .setColor(passesAutomod ? config.colors.green : config.colors.red);

  interaction.editReply({ embeds: [embed] });
}
