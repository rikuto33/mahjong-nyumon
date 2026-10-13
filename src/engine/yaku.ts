/**
 * 雀魂 段位戦で採用されている役（SPEC §5.2）。ローカル役・人和はなし。
 * han: 門前の翻数、openHan: 副露時の翻数（null = 門前限定）。
 * yakuman: 役満の倍数（1 = 役満、2 = ダブル役満）。
 * 流し満貫は和了役ではなく流局時の精算なので、ここには含めない（局の進行で扱う）。
 */
export type YakuId =
  // 1 翻
  | 'riichi'
  | 'ippatsu'
  | 'menzenTsumo'
  | 'tanyao'
  | 'pinfu'
  | 'iipeikou'
  | 'haku'
  | 'hatsu'
  | 'chun'
  | 'seatWind'
  | 'roundWind'
  | 'haitei'
  | 'houtei'
  | 'rinshan'
  | 'chankan'
  // 2 翻
  | 'doubleRiichi'
  | 'chiitoitsu'
  | 'chanta'
  | 'ittsu'
  | 'sanshokuDoujun'
  | 'sanshokuDoukou'
  | 'sankantsu'
  | 'toitoi'
  | 'sanankou'
  | 'shousangen'
  | 'honroutou'
  // 3 翻以上
  | 'ryanpeikou'
  | 'junchan'
  | 'honitsu'
  | 'chinitsu'
  // 役満
  | 'tenhou'
  | 'chiihou'
  | 'daisangen'
  | 'suuankou'
  | 'suuankouTanki'
  | 'tsuuiisou'
  | 'ryuuiisou'
  | 'chinroutou'
  | 'kokushi'
  | 'kokushi13'
  | 'shousuushi'
  | 'daisuushi'
  | 'suukantsu'
  | 'chuuren'
  | 'junseiChuuren';

export type YakuInfo = {
  id: YakuId;
  han: number;
  openHan: number | null;
  yakuman: 0 | 1 | 2;
};

const y = (id: YakuId, han: number, openHan: number | null, yakuman: 0 | 1 | 2 = 0): YakuInfo => ({
  id,
  han,
  openHan,
  yakuman,
});

/** 役図鑑の並び順でもある */
export const YAKU_LIST: readonly YakuInfo[] = [
  y('riichi', 1, null),
  y('ippatsu', 1, null),
  y('menzenTsumo', 1, null),
  y('tanyao', 1, 1),
  y('pinfu', 1, null),
  y('iipeikou', 1, null),
  y('haku', 1, 1),
  y('hatsu', 1, 1),
  y('chun', 1, 1),
  y('seatWind', 1, 1),
  y('roundWind', 1, 1),
  y('haitei', 1, 1),
  y('houtei', 1, 1),
  y('rinshan', 1, 1),
  y('chankan', 1, 1),
  y('doubleRiichi', 2, null),
  y('chiitoitsu', 2, null),
  y('chanta', 2, 1),
  y('ittsu', 2, 1),
  y('sanshokuDoujun', 2, 1),
  y('sanshokuDoukou', 2, 2),
  y('sankantsu', 2, 2),
  y('toitoi', 2, 2),
  y('sanankou', 2, 2),
  y('shousangen', 2, 2),
  y('honroutou', 2, 2),
  y('ryanpeikou', 3, null),
  y('junchan', 3, 2),
  y('honitsu', 3, 2),
  y('chinitsu', 6, 5),
  y('tenhou', 0, null, 1),
  y('chiihou', 0, null, 1),
  y('daisangen', 0, 0, 1),
  y('suuankou', 0, null, 1),
  y('suuankouTanki', 0, null, 2),
  y('tsuuiisou', 0, 0, 1),
  y('ryuuiisou', 0, 0, 1),
  y('chinroutou', 0, 0, 1),
  y('kokushi', 0, null, 1),
  y('kokushi13', 0, null, 2),
  y('shousuushi', 0, 0, 1),
  y('daisuushi', 0, 0, 2),
  y('suukantsu', 0, 0, 1),
  y('chuuren', 0, null, 1),
  y('junseiChuuren', 0, null, 2),
];

export const YAKU: Readonly<Record<YakuId, YakuInfo>> = Object.fromEntries(
  YAKU_LIST.map((info) => [info.id, info]),
) as Record<YakuId, YakuInfo>;
