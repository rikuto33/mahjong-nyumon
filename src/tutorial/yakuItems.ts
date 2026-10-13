import { scoreWin, type CalledMeld, type WinResult, type Wind } from '../engine/score';
import { parseTiles, type Tile } from '../engine/tile';
import type { YakuId } from '../engine/yaku';

/**
 * 役を考えるクイズ（段階 6・7・8）の 1 問。hand は和了牌を除く手の内、melds は鳴いた面子。
 * 席は南家・東場（自風 = 南、場風 = 東）。
 */
export type YakuItem = {
  hand: string;
  win: string;
  tsumo: boolean;
  riichi?: boolean;
  melds?: { type: CalledMeld['type']; tiles: string }[];
};

export const QUIZ_SEAT: Wind = 2;
export const QUIZ_ROUND: Wind = 1;

/** レッスンで扱う役。役牌（白・發・中・自風・場風）は 1 つにまとめる */
export type BasicYaku = 'riichi' | 'menzenTsumo' | 'tanyao' | 'yakuhai' | 'toitoi' | 'chiitoitsu';
export const BASIC_YAKU: BasicYaku[] = ['riichi', 'menzenTsumo', 'tanyao', 'yakuhai', 'toitoi', 'chiitoitsu'];
const YAKUHAI: YakuId[] = ['haku', 'hatsu', 'chun', 'seatWind', 'roundWind'];

export function toBasic(id: YakuId): BasicYaku | null {
  if (YAKUHAI.includes(id)) return 'yakuhai';
  return (BASIC_YAKU as string[]).includes(id) ? (id as BasicYaku) : null;
}

export function scoreItem(item: YakuItem): WinResult | null {
  const win = parseTiles(item.win)[0] as Tile;
  return scoreWin({
    hand: [...parseTiles(item.hand), win],
    melds: (item.melds ?? []).map((m) => ({ type: m.type, tiles: parseTiles(m.tiles) })),
    winTile: win,
    tsumo: item.tsumo,
    riichi: item.riichi,
    seatWind: QUIZ_SEAT,
    roundWind: QUIZ_ROUND,
  });
}

/** 基本の役（重複なし、並びは BASIC_YAKU の順）。役がなければ空 */
export function basicYakuOf(item: YakuItem): BasicYaku[] {
  const r = scoreItem(item);
  if (!r) return [];
  const set = new Set(r.yaku.map((y) => toBasic(y.id)).filter((x): x is BasicYaku => x !== null));
  return BASIC_YAKU.filter((y) => set.has(y));
}

/** 基本の役以外が付いていないか（クイズの問題として使えるか） */
export function onlyBasic(item: YakuItem): boolean {
  const r = scoreItem(item);
  return !r || r.yaku.every((y) => toBasic(y.id) !== null);
}

const y = (hand: string, win: string, tsumo: boolean, extra: Partial<YakuItem> = {}): YakuItem => ({ hand, win, tsumo, ...extra });
const pon = (tiles: string) => ({ type: 'pon' as const, tiles });
const chi = (tiles: string) => ({ type: 'chi' as const, tiles });

/** 段階 6：役を選ぶ（門前・副露・ツモ・ロンを混ぜる） */
export const YAKU_QUIZ: YakuItem[] = [
  y('123m456p789s99p33z', '3z', true),
  y('123m456p789s99p33z', '3z', false),
  y('123m456p789s99p33z', '3z', false, { riichi: true }),
  y('234m456p678s55p77s', '7s', false),
  y('234m456p678s55p77s', '7s', true),
  y('234m567p345s777z9s', '9s', false),
  y('234m567p345s9s', '9s', false, { melds: [pon('777z')] }),
  y('888s99s66z', '9s', false, { melds: [pon('222m'), pon('555p')] }),
  y('777p22s88s', '8s', false, { melds: [pon('555z'), pon('333m')] }),
  y('1133m5577p2299s4z', '4z', false),
  y('2244m5577p3366s8p', '8p', false),
  y('123m567p99p78s', '9s', false, { melds: [chi('345s')] }),
  y('234m567p66p67s', '8s', false, { melds: [chi('345s')] }),
  y('234m456p678s55p77s', '7s', true, { riichi: true }),
  y('234m567p345s222z9s', '9s', false),
];

/** 段階 7：ロンしたら役はある？（すべてロン） */
export const RON_QUIZ: YakuItem[] = [
  y('123m456p789s99p33z', '3z', false),
  y('123m456p789s99p33z', '3z', false, { riichi: true }),
  y('234m456p678s55p77s', '7s', false),
  y('234m567p345s777z9s', '9s', false),
  y('111m567p345s99p78s', '9s', false),
  y('1133m5577p2299s4z', '4z', false),
  y('123m456p789s11m99s', '9s', false),
  y('123m456p789s11m99s', '9s', false, { riichi: true }),
  y('234m567p345s222z9s', '9s', false),
  y('113355m789p22s44z', '4z', false),
];

/** 段階 8：鳴いたあと、ロンしたら役はある？ */
export const CALLS_QUIZ: YakuItem[] = [
  y('234m567p55p67s', '8s', false, { melds: [chi('345s')] }),
  y('234m567p99p78s', '9s', false, { melds: [chi('345s')] }),
  y('234m567p345s7s', '7s', false, { melds: [pon('777z')] }),
  y('123m567p55p78s', '9s', false, { melds: [pon('222p')] }),
  y('234m345p66s78s', '6s', false, { melds: [pon('444s')] }),
  y('234m567p345s9s', '9s', false, { melds: [chi('678s')] }),
  y('888s99s66z', '9s', false, { melds: [pon('222m'), pon('555p')] }),
  y('123m99p78s', '9s', false, { melds: [pon('555z'), chi('456p')] }),
  y('123m99p78s', '9s', false, { melds: [pon('111p'), chi('456p')] }),
  y('345m66p34s', '5s', false, { melds: [pon('222z'), chi('678s')] }),
];
