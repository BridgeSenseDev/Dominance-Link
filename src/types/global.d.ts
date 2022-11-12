/* eslint-disable no-unused-expressions */
/* eslint-disable no-lone-blocks */
/* eslint-disable no-unused-vars */
/* eslint-disable no-var */
/* eslint-disable vars-on-top */

import { Channel, WebhookClient } from 'discord.js';

declare global {
  var onlineMembers: number;
  var guildOnline: string[];
}

interface StringObject {
  [key: string]: string;
}

interface NumberObject {
  [key: string]: number;
}
