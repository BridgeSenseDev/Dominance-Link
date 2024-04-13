import { GlobalFonts, SKRSContext2D, loadImage } from '@napi-rs/canvas';
import { BoxProps, DeferredGradient, Fill, TextProps } from '../types/box.js';
import { rgbaColor } from './constants.js';
import { removeSectionSymbols } from './utils.js';

GlobalFonts.registerFromPath('./fonts/Minecraft Regular.ttf', 'Minecraft');
GlobalFonts.registerFromPath('./fonts/Minecraft Bold.otf', 'Minecraft Bold');

function resolveFill(
  fill: Fill | DeferredGradient,
  ctx: SKRSContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  if (typeof fill === 'string' || typeof fill === 'object') return fill;
  return fill(ctx, x, y, width, height);
}

function renderText(
  ctx: SKRSContext2D,
  { x, y, width, height }: BoxProps,
  { header = '', text, font, textY = [0, 0] }: TextProps
) {
  ctx.shadowOffsetX = Number(font.match(/\d+/)![0]) / 10;
  ctx.shadowOffsetY = Number(font.match(/\d+/)![0]) / 10;
  ctx.font = font;

  if (header === '') {
    ctx.textBaseline = 'middle';
    x += width / 2 - ctx.measureText(removeSectionSymbols(text)).width / 2;
    y += height / 2;
    const splitMessageSpace = text.split(' ');
    for (const msg in splitMessageSpace) {
      if (!splitMessageSpace[msg].startsWith('§')) splitMessageSpace[msg] = `§r${splitMessageSpace[msg]}`;
    }
    const splitMessage = splitMessageSpace.join(' ').split(/§|\n/g);
    splitMessage.shift();

    for (const msg of splitMessage) {
      const colorCode = rgbaColor[msg.charAt(0)];
      const currentMessage = msg.substring(1);
      if (colorCode) {
        let shadowCode = 'rgba(';
        for (let i = 0; i < 3; i++) {
          shadowCode += `${Number(colorCode.match(/\d+/g)![i]) / 4},`;
        }
        shadowCode += '1)';
        ctx.shadowColor = shadowCode;
        ctx.shadowBlur = 0.001;
        ctx.fillStyle = colorCode;
      }
      ctx.fillText(currentMessage, Math.round(x), y + 1);
      x += ctx.measureText(currentMessage).width;
    }
  } else {
    let wordX = x;
    y += height / 2;
    let splitMessageSpace = header.split(' ');
    ctx.textBaseline = 'top';
    ctx.font = '20px Minecraft';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    for (const msg in splitMessageSpace) {
      if (!splitMessageSpace[msg].startsWith('§')) splitMessageSpace[msg] = `§r${splitMessageSpace[msg]}`;
    }
    let splitMessage = splitMessageSpace.join(' ').split(/§|\n/g);
    splitMessage.shift();

    for (const msg of splitMessage) {
      const colorCode = rgbaColor[msg.charAt(0)];
      const currentMessage = msg.substring(1);
      if (colorCode) {
        let shadowCode = 'rgba(';
        for (let i = 0; i < 3; i++) {
          shadowCode += `${Number(colorCode.match(/\d+/g)![i]) / 4},`;
        }
        shadowCode += '1)';
        ctx.shadowColor = shadowCode;
        ctx.shadowBlur = 0.001;
        ctx.fillStyle = colorCode;
      }
      ctx.fillText(
        currentMessage,
        Math.round(wordX + width / 2 - ctx.measureText(removeSectionSymbols(header)).width / 2),
        y - textY[0]
      );
      wordX += ctx.measureText(currentMessage).width;
    }

    ctx.font = font;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    splitMessageSpace = text.split(' ');

    for (const msg in splitMessageSpace) {
      if (!splitMessageSpace[msg].startsWith('§')) splitMessageSpace[msg] = `§r${splitMessageSpace[msg]}`;
    }
    splitMessage = splitMessageSpace.join(' ').split(/§|\n/g);
    splitMessage.shift();

    for (const msg of splitMessage) {
      const colorCode = rgbaColor[msg.charAt(0)];
      const currentMessage = msg.substring(1);
      if (colorCode) {
        let shadowCode = 'rgba(';
        for (let i = 0; i < 3; i++) {
          shadowCode += `${Number(colorCode.match(/\d+/g)![i]) / 4},`;
        }
        shadowCode += '1)';
        ctx.shadowColor = shadowCode;
        ctx.shadowBlur = 0.001;
        ctx.fillStyle = colorCode;
      }
      ctx.fillText(
        currentMessage,
        Math.round(x + width / 2 - ctx.measureText(removeSectionSymbols(text)).width / 2),
        y + textY[1]
      );
      x += ctx.measureText(currentMessage).width;
    }
  }

  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

export async function renderSkin(ctx: SKRSContext2D, { x, y, width, height }: BoxProps, uuid: string) {
  const response = await fetch(`https://visage.surgeplay.com/bust/${uuid}`, {
    headers: {
      'User-Agent': 'Dominance-Link/1.0 (+https://github.com/BridgeSenseDev/Dominance-Link)'
    }
  });
  const arrayBuffer = await response.arrayBuffer();
  const skin = await loadImage(Buffer.from(arrayBuffer));

  const scale = 0.5;

  ctx.drawImage(
    skin,
    x + width / 2 - (skin.width * scale) / 2,
    y + height / 2 - (skin.height * scale) / 2,
    skin.width * scale,
    skin.height * scale
  );
}

export default function renderBox(
  ctx: SKRSContext2D,
  { x, y, width, height }: BoxProps,
  { header = '', text, font, textY = [0, 0] }: TextProps
) {
  const border = { topLeft: 4, bottomLeft: 4, bottomRight: 4, topRight: 4 };
  const shadowDistance = 4;
  const fill = resolveFill('rgba(0, 0, 0, 0.5)', ctx, x, y, width, height);
  ctx.fillStyle = fill;
  ctx.shadowBlur = 0;

  x = Math.round(x);
  y = Math.round(y);
  width = Math.round(width);
  height = Math.round(height);

  ctx.beginPath();
  ctx.moveTo(x + border.topLeft, y);
  ctx.lineTo(x + width - border.topRight, y);
  ctx.lineTo(x + width - border.topRight, y + border.topRight);
  ctx.lineTo(x + width, y + border.topRight);
  ctx.lineTo(x + width, y + height - border.bottomRight);
  ctx.lineTo(x + width - border.bottomRight, y + height - border.bottomRight);
  ctx.lineTo(x + width - border.bottomRight, y + height);
  ctx.lineTo(x + border.bottomLeft, y + height);
  ctx.lineTo(x + border.bottomLeft, y + height - border.bottomLeft);
  ctx.lineTo(x, y + height - border.bottomLeft);
  ctx.lineTo(x, y + border.topLeft);
  ctx.lineTo(x + border.topLeft, y + border.topLeft);
  ctx.closePath();
  ctx.fill();

  ctx.globalCompositeOperation = 'overlay';

  const overlay = ctx.createLinearGradient(x, y, x, y + height);
  overlay.addColorStop(0, `rgba(255, 255, 255, 0.15)`);
  overlay.addColorStop(1, `rgba(0, 0, 0, 0.15)`);
  ctx.fillStyle = overlay;

  ctx.fill();

  ctx.globalCompositeOperation = 'source-over';

  if (!shadowDistance) return;

  ctx.globalAlpha = 0.84;
  ctx.fillStyle = fill;

  ctx.beginPath();
  ctx.moveTo(x + width, y + shadowDistance + border.topRight);
  ctx.lineTo(x + width + shadowDistance, y + shadowDistance + border.topRight);
  ctx.lineTo(x + width + shadowDistance, y + height - border.bottomRight + shadowDistance);
  ctx.lineTo(x + width, y + height - border.bottomRight + shadowDistance);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + border.bottomLeft + shadowDistance, y + height);
  ctx.lineTo(x + border.bottomLeft + shadowDistance, y + height + shadowDistance);
  ctx.lineTo(x + width + shadowDistance - (border.bottomRight || shadowDistance), y + height + shadowDistance);
  ctx.lineTo(x + width + shadowDistance - (border.bottomRight || shadowDistance), y + height);
  ctx.closePath();
  ctx.fill();

  if (border.bottomRight !== 0)
    ctx.fillRect(
      x + width - border.bottomRight,
      y + height - border.bottomRight,
      border.bottomRight,
      border.bottomRight
    );

  ctx.globalAlpha = 1;
  renderText(ctx, { x, y, width, height }, { header, text, font, textY });
}
