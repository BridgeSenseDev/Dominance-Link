import { Canvas, FontLibrary } from '@julusian/skia-canvas';
import { rgbaColor } from './constants.js';

FontLibrary.use('Uni Sans Heavy', './fonts/Uni Sans Heavy Regular.ttf');

function getHeight(message: string) {
  const canvas = new Canvas(1, 1);
  const ctx = canvas.getContext('2d');
  const splitMessageSpace = message.split(' ');
  for (const msg in splitMessageSpace) {
    if (!splitMessageSpace[msg].startsWith('§')) splitMessageSpace[msg] = `§r${splitMessageSpace[msg]}`;
  }

  const splitMessage = splitMessageSpace.join(' ').split(/§|\n/g);
  splitMessage.shift();
  ctx.font = '40px Uni Sans Heavy';

  let width = 5;
  let height = 35;

  for (const msg of splitMessage) {
    const currentMessage = msg.substring(1);
    if (width + ctx.measureText(currentMessage).width > 1000 || msg.charAt(0) === 'n') {
      width = 5;
      height += 40;
    }
    width += ctx.measureText(currentMessage).width;
  }
  if (width === 5) height -= 40;

  return height + 10;
}

export default async function generateMessageImage(message: string) {
  const canvasHeight = getHeight(message);
  const canvas = new Canvas(1000, canvasHeight);
  const ctx = canvas.getContext('2d');
  const splitMessageSpace = message.split(' ');
  for (const msg in splitMessageSpace) {
    if (!splitMessageSpace[msg].startsWith('§')) splitMessageSpace[msg] = `§r${splitMessageSpace[msg]}`;
  }
  const splitMessage = splitMessageSpace.join(' ').split(/§|\n/g);
  splitMessage.shift();
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  ctx.shadowColor = '#131313';
  ctx.font = '40px Uni Sans Heavy';

  let width = 5;
  let height = 35;

  for (const msg of splitMessage) {
    const colorCode = rgbaColor[msg.charAt(0)];
    const currentMessage = msg.substring(1);
    if (width + ctx.measureText(currentMessage).width > 1000 || msg.charAt(0) === 'n') {
      width = 5;
      height += 40;
    }
    if (colorCode) {
      ctx.fillStyle = colorCode;
    }
    ctx.fillText(currentMessage, width, height);
    width += ctx.measureText(currentMessage).width;
  }
  const buffer = await canvas.toBuffer('png');
  return buffer;
}
