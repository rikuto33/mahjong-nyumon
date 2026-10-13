import { isRed, rankOf, suitOf, type Tile } from '../../engine/tile';
import type { MessageKey } from '../../i18n/translate';

type T = (key: MessageKey, params?: Record<string, string | number>) => string;

export function tileName(t: T, tile: Tile): string {
  const suit = suitOf(tile);
  if (suit === 'z') return t(`tile.z${rankOf(tile)}` as MessageKey);
  const suitName = t(`tile.suit.${suit}`);
  return isRed(tile) ? t('tile.red', { suit: suitName }) : t('tile.number', { n: rankOf(tile), suit: suitName });
}

/** 牌の隅の補助表示。数牌はアラビア数字、字牌は言語ごとの表記 */
export function tileHint(t: T, tile: Tile): string {
  const suit = suitOf(tile);
  if (suit === 'z') return t(`tileHint.z${rankOf(tile)}` as MessageKey);
  return String(rankOf(tile));
}
