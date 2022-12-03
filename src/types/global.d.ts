/* eslint-disable no-unused-expressions */
/* eslint-disable no-lone-blocks */
/* eslint-disable no-unused-vars */
/* eslint-disable no-var */
/* eslint-disable vars-on-top */

import { Channel, WebhookClient } from 'discord.js';

interface StringObject {
  [key: string]: string;
}

interface NumberObject {
  [key: string]: number;
}
declare global {
  var onlineMembers: number;
  var guildOnline: string[];
  var playtime: NumberObject;
}
