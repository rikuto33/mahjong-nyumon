import type { CalledMeld, WinInput } from '../engine/score';
import type { YakuId } from '../engine/yaku';

/**
 * 役図鑑の例。hand は和了牌を除いた手の内（mpsz）、win は和了牌。
 * ctx は状況（立直・ツモなど）。すべての例はテストでエンジンにかけて、その役が付くことを確かめる。
 */
export type DexExample = {
  hand: string;
  win: string;
  melds?: { type: CalledMeld['type']; tiles: string }[];
  ctx?: Partial<Omit<WinInput, 'hand' | 'winTile' | 'melds'>>;
};

export const DEX_EXAMPLES: Record<YakuId, DexExample> = {
  riichi: { hand: '234m567p345s55p78s', win: '9s', ctx: { riichi: true } },
  ippatsu: { hand: '234m567p345s55p78s', win: '9s', ctx: { riichi: true, ippatsu: true } },
  menzenTsumo: { hand: '234m567p345s55p78s', win: '9s', ctx: { tsumo: true } },
  tanyao: { hand: '234m567p345s55p67s', win: '8s' },
  pinfu: { hand: '123m567p345s55p78s', win: '9s' },
  iipeikou: { hand: '223344m567p55p78s', win: '9s' },
  haku: { hand: '234m567p345s555z7s', win: '7s' },
  hatsu: { hand: '234m567p345s666z7s', win: '7s' },
  chun: { hand: '234m567p345s777z7s', win: '7s' },
  seatWind: { hand: '234m567p345s222z7s', win: '7s', ctx: { seatWind: 2 } },
  roundWind: { hand: '234m567p345s111z7s', win: '7s', ctx: { roundWind: 1 } },
  haitei: { hand: '234m567p345s55p78s', win: '9s', ctx: { tsumo: true, lastTile: true } },
  houtei: { hand: '234m567p345s55p78s', win: '9s', ctx: { lastTile: true } },
  rinshan: { hand: '567p345s55p78s', win: '9s', melds: [{ type: 'ankan', tiles: '2222m' }], ctx: { tsumo: true, rinshan: true } },
  chankan: { hand: '234m567p345s55p78s', win: '9s', ctx: { chankan: true } },
  doubleRiichi: { hand: '234m567p345s55p78s', win: '9s', ctx: { doubleRiichi: true } },
  chiitoitsu: { hand: '1122m3344p5566s7z', win: '7z' },
  chanta: { hand: '123m789p789s11z99m', win: '9m' },
  ittsu: { hand: '123456789m55p78s', win: '9s' },
  sanshokuDoujun: { hand: '234m234p234s55p78s', win: '9s' },
  sanshokuDoukou: { hand: '333m333p333s567p2z', win: '2z', ctx: { tsumo: true } },
  sankantsu: {
    hand: '567p5p',
    win: '5p',
    melds: [
      { type: 'minkan', tiles: '1111m' },
      { type: 'minkan', tiles: '9999p' },
      { type: 'ankan', tiles: '2222s' },
    ],
  },
  toitoi: {
    hand: '888s99s77z',
    win: '9s',
    melds: [
      { type: 'pon', tiles: '222m' },
      { type: 'pon', tiles: '555p' },
    ],
  },
  sanankou: { hand: '222m555p888s34s77z', win: '5s' },
  shousangen: { hand: '555666z77z234m56p', win: '7p' },
  honroutou: { hand: '111m999p111s22z99s', win: '9s' },
  ryanpeikou: { hand: '223344m667788p5s', win: '5s' },
  junchan: { hand: '123m789p789s12s11m', win: '3s' },
  honitsu: { hand: '123456789m11z22z', win: '2z' },
  chinitsu: { hand: '123345567m99m88m', win: '8m' },
  tenhou: { hand: '234m567p345s55p78s', win: '9s', ctx: { tsumo: true, seatWind: 1, tenhou: true } },
  chiihou: { hand: '234m567p345s55p78s', win: '9s', ctx: { tsumo: true, seatWind: 2, chiihou: true } },
  daisangen: { hand: '555666777z234m5p', win: '5p' },
  suuankou: { hand: '222m555p888s33s11z', win: '3s', ctx: { tsumo: true } },
  suuankouTanki: { hand: '222m555p888s111z3s', win: '3s' },
  tsuuiisou: { hand: '1122334455667z', win: '7z' },
  ryuuiisou: { hand: '234234666888s6z', win: '6z' },
  chinroutou: { hand: '111m999m111p99p11s', win: '9p' },
  kokushi: { hand: '9m19p19s12345677z', win: '1m' },
  kokushi13: { hand: '19m19p19s1234567z', win: '7z' },
  shousuushi: { hand: '11122233344z55m', win: '5m' },
  daisuushi: { hand: '111222333444z5m', win: '5m' },
  suukantsu: {
    hand: '5z',
    win: '5z',
    melds: [
      { type: 'minkan', tiles: '1111m' },
      { type: 'ankan', tiles: '2222p' },
      { type: 'minkan', tiles: '3333s' },
      { type: 'kakan', tiles: '4444s' },
    ],
    ctx: { tsumo: true },
  },
  chuuren: { hand: '1123455678999p', win: '1p' },
  junseiChuuren: { hand: '1112345678999p', win: '5p' },
};

/** 段階 6 のレッスンで教える役（「まずはこれだけ」の 6 種。平和はおまけ扱い） */
export const LESSON_YAKU: YakuId[] = [
  'riichi',
  'menzenTsumo',
  'tanyao',
  'haku',
  'hatsu',
  'chun',
  'seatWind',
  'roundWind',
  'toitoi',
  'chiitoitsu',
  'pinfu',
];
