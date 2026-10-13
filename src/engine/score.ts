import { decompose } from './decompose';
import { chiitoitsuShanten, kokushiShanten } from './shanten';
import { isRed, kindOf, toCounts, type Tile } from './tile';
import { YAKU, type YakuId } from './yaku';

/*
 * 役・符・点数の計算（雀魂 段位戦ルール、SPEC §5.2）。
 * - 1 翻縛り。ドラだけでは和了れない
 * - 切り上げ満貫なし、数え役満あり、複合役満あり
 * - ダブル役満：四暗刻単騎・国士無双十三面・純正九蓮宝燈・大四喜
 * - 連風牌の雀頭は 4 符、嶺上開花のツモも 2 符、平和ツモ 20 符、七対子 25 符
 */

export type Wind = 1 | 2 | 3 | 4; // 東 南 西 北

export type CalledMeld = {
  type: 'chi' | 'pon' | 'minkan' | 'ankan' | 'kakan';
  tiles: Tile[];
};

export type WinInput = {
  /** 手の内の牌（和了牌を含む）。14 - 3×副露数 枚 */
  hand: Tile[];
  melds?: CalledMeld[];
  winTile: Tile;
  tsumo: boolean;
  seatWind: Wind;
  roundWind: Wind;
  riichi?: boolean;
  doubleRiichi?: boolean;
  ippatsu?: boolean;
  /** 海底（ツモ）・河底（ロン） */
  lastTile?: boolean;
  rinshan?: boolean;
  chankan?: boolean;
  tenhou?: boolean;
  chiihou?: boolean;
  doraIndicators?: Tile[];
  /** 裏ドラ表示牌（立直しているときだけ数える） */
  uraIndicators?: Tile[];
  honba?: number;
  riichiSticks?: number;
};

export type YakuHan = { id: YakuId; han: number };

export type Payment =
  /** ロン：放銃者が total を払う */
  | { kind: 'ron'; total: number }
  /** 親のツモ：子がそれぞれ each を払う */
  | { kind: 'tsumoDealer'; each: number; total: number }
  /** 子のツモ：親が dealer、子がそれぞれ child を払う */
  | { kind: 'tsumoChild'; dealer: number; child: number; total: number };

export type Limit = 'mangan' | 'haneman' | 'baiman' | 'sanbaiman' | 'kazoeYakuman' | 'yakuman' | null;

export type WinResult = {
  form: 'regular' | 'chiitoitsu' | 'kokushi';
  yaku: YakuHan[];
  /** 役満の合計倍数（0 = 役満なし） */
  yakuman: number;
  dora: number;
  aka: number;
  ura: number;
  /** 役＋ドラの合計（役満のときは 0） */
  han: number;
  fu: number;
  limit: Limit;
  /** 本場・供託を含まない基本の和了点 */
  basePoints: number;
  /** 本場を含む支払い */
  payment: Payment;
  /** 和了者が受け取る合計（本場・供託込み） */
  gain: number;
};

type GroupType = 'shuntsu' | 'koutsu' | 'kantsu';
type Group = {
  type: GroupType;
  /** shuntsu は先頭の種類 */
  kind: number;
  /** 符・暗刻の判定用：明刻（ロンで完成した刻子を含む）なら true */
  open: boolean;
  /** 鳴いた面子（門前判定用） */
  called: boolean;
};
type Wait = 'ryanmen' | 'kanchan' | 'penchan' | 'shanpon' | 'tanki';

const isHonorKind = (k: number) => k >= 27;
const isTerminalKind = (k: number) => k < 27 && (k % 9 === 0 || k % 9 === 8);
const isYaochuKind = (k: number) => isHonorKind(k) || isTerminalKind(k);
const suitOfKind = (k: number) => Math.floor(k / 9); // 0 m, 1 p, 2 s, 3 z
const DRAGONS = [31, 32, 33];
const WINDS = [27, 28, 29, 30];
const GREEN = new Set([19, 20, 21, 23, 25, 32]); // 2 3 4 6 8 索・發
const windKind = (w: Wind) => 26 + w;

function groupKinds(g: Group): number[] {
  return g.type === 'shuntsu' ? [g.kind, g.kind + 1, g.kind + 2] : [g.kind, g.kind, g.kind];
}

/** ドラ表示牌 → ドラの種類 */
export function doraFromIndicator(indicator: Tile): number {
  const k = kindOf(indicator);
  if (k < 27) return Math.floor(k / 9) * 9 + ((k % 9) + 1) % 9;
  if (k <= 30) return 27 + ((k - 27 + 1) % 4);
  return 31 + ((k - 31 + 1) % 3);
}

function calledToGroup(m: CalledMeld): Group {
  const kinds = m.tiles.map(kindOf).sort((a, b) => a - b);
  if (m.type === 'chi') return { type: 'shuntsu', kind: kinds[0], open: true, called: true };
  if (m.type === 'pon') return { type: 'koutsu', kind: kinds[0], open: true, called: true };
  if (m.type === 'ankan') return { type: 'kantsu', kind: kinds[0], open: false, called: false };
  return { type: 'kantsu', kind: kinds[0], open: true, called: true };
}

function roundUp100(n: number): number {
  return Math.ceil(n / 100) * 100;
}

function limitOf(han: number, fu: number, yakuman: number): { base: number; limit: Limit } {
  if (yakuman > 0) return { base: 8000 * yakuman, limit: 'yakuman' };
  if (han >= 13) return { base: 8000, limit: 'kazoeYakuman' };
  if (han >= 11) return { base: 6000, limit: 'sanbaiman' };
  if (han >= 8) return { base: 4000, limit: 'baiman' };
  if (han >= 6) return { base: 3000, limit: 'haneman' };
  const base = fu * 2 ** (han + 2);
  if (han >= 5 || base > 2000) return { base: 2000, limit: 'mangan' };
  return { base, limit: null };
}

function payments(base: number, dealer: boolean, tsumo: boolean, honba: number): { payment: Payment; basePoints: number } {
  if (!tsumo) {
    const p = roundUp100(base * (dealer ? 6 : 4));
    return { payment: { kind: 'ron', total: p + 300 * honba }, basePoints: p };
  }
  if (dealer) {
    const each = roundUp100(base * 2);
    return {
      payment: { kind: 'tsumoDealer', each: each + 100 * honba, total: (each + 100 * honba) * 3 },
      basePoints: each * 3,
    };
  }
  const d = roundUp100(base * 2);
  const c = roundUp100(base);
  return {
    payment: { kind: 'tsumoChild', dealer: d + 100 * honba, child: c + 100 * honba, total: d + 2 * c + 300 * honba },
    basePoints: d + 2 * c,
  };
}

type Ctx = {
  input: WinInput;
  menzen: boolean;
  counts: number[]; // 全牌（副露含む、槓は 4 枚）の種類ごとの枚数
  allKinds: number[];
  seat: number;
  round: number;
};

/** 状況役（形によらない役） */
function situationYaku(c: Ctx): YakuHan[] {
  const i = c.input;
  const out: YakuHan[] = [];
  if (i.doubleRiichi) out.push({ id: 'doubleRiichi', han: 2 });
  else if (i.riichi) out.push({ id: 'riichi', han: 1 });
  if ((i.riichi || i.doubleRiichi) && i.ippatsu) out.push({ id: 'ippatsu', han: 1 });
  if (c.menzen && i.tsumo) out.push({ id: 'menzenTsumo', han: 1 });
  if (i.lastTile && !i.rinshan) out.push({ id: i.tsumo ? 'haitei' : 'houtei', han: 1 });
  if (i.rinshan && i.tsumo) out.push({ id: 'rinshan', han: 1 });
  if (i.chankan && !i.tsumo) out.push({ id: 'chankan', han: 1 });
  return out;
}

/** 牌の構成だけで決まる役（一般形・七対子共通） */
function colorYaku(c: Ctx): YakuHan[] {
  const out: YakuHan[] = [];
  const kinds = c.allKinds;
  if (kinds.every((k) => !isYaochuKind(k))) out.push({ id: 'tanyao', han: 1 });
  const suits = new Set(kinds.filter((k) => !isHonorKind(k)).map(suitOfKind));
  const hasHonor = kinds.some(isHonorKind);
  if (suits.size === 1 && !hasHonor) out.push({ id: 'chinitsu', han: c.menzen ? 6 : 5 });
  else if (suits.size === 1 && hasHonor) out.push({ id: 'honitsu', han: c.menzen ? 3 : 2 });
  if (kinds.every(isYaochuKind) && hasHonor && suits.size > 0) out.push({ id: 'honroutou', han: 2 });
  return out;
}

function colorYakuman(c: Ctx): YakuHan[] {
  const out: YakuHan[] = [];
  const kinds = c.allKinds;
  if (kinds.every(isHonorKind)) out.push({ id: 'tsuuiisou', han: 0 });
  if (kinds.every((k) => GREEN.has(k))) out.push({ id: 'ryuuiisou', han: 0 });
  if (kinds.every(isTerminalKind)) out.push({ id: 'chinroutou', han: 0 });
  return out;
}

type Evaluated = { yaku: YakuHan[]; yakuman: YakuHan[]; fu: number };

function evaluateRegular(c: Ctx, pairKind: number, groups: Group[], wait: Wait): Evaluated {
  const i = c.input;
  const yaku: YakuHan[] = [...situationYaku(c), ...colorYaku(c)];
  const yakuman: YakuHan[] = colorYakuman(c);

  const shuntsu = groups.filter((g) => g.type === 'shuntsu');
  const triplets = groups.filter((g) => g.type !== 'shuntsu');
  const kantsu = groups.filter((g) => g.type === 'kantsu');
  const concealedTriplets = triplets.filter((g) => !g.open);
  const isValuePair = DRAGONS.includes(pairKind) || pairKind === c.seat || pairKind === c.round;

  // 役牌
  for (const g of triplets) {
    if (g.kind === 31) yaku.push({ id: 'haku', han: 1 });
    if (g.kind === 32) yaku.push({ id: 'hatsu', han: 1 });
    if (g.kind === 33) yaku.push({ id: 'chun', han: 1 });
    if (g.kind === c.seat) yaku.push({ id: 'seatWind', han: 1 });
    if (g.kind === c.round) yaku.push({ id: 'roundWind', han: 1 });
  }

  const pinfu = c.menzen && shuntsu.length === 4 && !isValuePair && wait === 'ryanmen';
  if (pinfu) yaku.push({ id: 'pinfu', han: 1 });

  // 一盃口・二盃口（門前のみ）
  if (c.menzen) {
    const starts = shuntsu.map((g) => g.kind).sort((a, b) => a - b);
    let pairs = 0;
    for (let j = 0; j + 1 < starts.length; ) {
      if (starts[j] === starts[j + 1]) {
        pairs++;
        j += 2;
      } else j++;
    }
    if (pairs === 2) yaku.push({ id: 'ryanpeikou', han: 3 });
    else if (pairs === 1) yaku.push({ id: 'iipeikou', han: 1 });
  }

  // 混全帯么九・純全帯么九
  const allHaveYaochu =
    isYaochuKind(pairKind) && groups.every((g) => groupKinds(g).some(isYaochuKind));
  if (allHaveYaochu && shuntsu.length > 0) {
    const anyHonor = isHonorKind(pairKind) || groups.some((g) => isHonorKind(g.kind));
    if (anyHonor) yaku.push({ id: 'chanta', han: c.menzen ? 2 : 1 });
    else yaku.push({ id: 'junchan', han: c.menzen ? 3 : 2 });
  }

  // 一気通貫
  for (let s = 0; s < 3; s++) {
    const st = new Set(shuntsu.map((g) => g.kind));
    if (st.has(s * 9) && st.has(s * 9 + 3) && st.has(s * 9 + 6)) {
      yaku.push({ id: 'ittsu', han: c.menzen ? 2 : 1 });
      break;
    }
  }

  // 三色同順・三色同刻
  for (let r = 0; r < 9; r++) {
    if (r <= 6 && [0, 1, 2].every((s) => shuntsu.some((g) => g.kind === s * 9 + r))) {
      yaku.push({ id: 'sanshokuDoujun', han: c.menzen ? 2 : 1 });
      break;
    }
  }
  for (let r = 0; r < 9; r++) {
    if ([0, 1, 2].every((s) => triplets.some((g) => g.kind === s * 9 + r))) {
      yaku.push({ id: 'sanshokuDoukou', han: 2 });
      break;
    }
  }

  if (triplets.length === 4) yaku.push({ id: 'toitoi', han: 2 });
  if (concealedTriplets.length === 3) yaku.push({ id: 'sanankou', han: 2 });
  if (kantsu.length === 3) yaku.push({ id: 'sankantsu', han: 2 });

  const dragonTriplets = triplets.filter((g) => DRAGONS.includes(g.kind)).length;
  if (dragonTriplets === 2 && DRAGONS.includes(pairKind)) yaku.push({ id: 'shousangen', han: 2 });

  // 役満
  if (dragonTriplets === 3) yakuman.push({ id: 'daisangen', han: 0 });
  if (concealedTriplets.length === 4) yakuman.push({ id: wait === 'tanki' ? 'suuankouTanki' : 'suuankou', han: 0 });
  const windTriplets = triplets.filter((g) => WINDS.includes(g.kind)).length;
  if (windTriplets === 4) yakuman.push({ id: 'daisuushi', han: 0 });
  else if (windTriplets === 3 && WINDS.includes(pairKind)) yakuman.push({ id: 'shousuushi', han: 0 });
  if (kantsu.length === 4) yakuman.push({ id: 'suukantsu', han: 0 });
  if (i.tenhou) yakuman.push({ id: 'tenhou', han: 0 });
  if (i.chiihou) yakuman.push({ id: 'chiihou', han: 0 });

  // 符
  let fu: number;
  if (pinfu) {
    fu = i.tsumo ? 20 : 30;
  } else {
    fu = 20;
    if (c.menzen && !i.tsumo) fu += 10;
    if (i.tsumo) fu += 2;
    for (const g of triplets) {
      let f = g.type === 'kantsu' ? 8 : 2;
      if (!g.open) f *= 2;
      if (isYaochuKind(g.kind)) f *= 2;
      fu += f;
    }
    if (DRAGONS.includes(pairKind)) fu += 2;
    if (pairKind === c.seat) fu += 2;
    if (pairKind === c.round) fu += 2;
    if (wait === 'kanchan' || wait === 'penchan' || wait === 'tanki') fu += 2;
    // 副露して符がつかない形（喰い平和形）は 30 符
    if (!c.menzen && fu === 20) fu = 30;
    fu = Math.ceil(fu / 10) * 10;
  }
  return { yaku, yakuman, fu };
}

/** 和了牌が入った位置ごとの解釈を列挙する */
function interpretations(
  pairKind: number,
  melds: { type: 'shuntsu' | 'koutsu'; kind: number }[],
  winKind: number,
  tsumo: boolean,
): { groups: Group[]; wait: Wait }[] {
  const out: { groups: Group[]; wait: Wait }[] = [];
  const base = melds.map<Group>((m) => ({ type: m.type, kind: m.kind, open: false, called: false }));
  if (pairKind === winKind) out.push({ groups: base, wait: 'tanki' });
  base.forEach((g, idx) => {
    if (g.type === 'koutsu' && g.kind === winKind) {
      const groups = base.map((x, j) => (j === idx ? { ...x, open: !tsumo } : x));
      out.push({ groups, wait: 'shanpon' });
    }
    if (g.type === 'shuntsu' && winKind >= g.kind && winKind <= g.kind + 2) {
      const pos = winKind - g.kind;
      const r = g.kind % 9;
      let wait: Wait;
      if (pos === 1) wait = 'kanchan';
      else if ((pos === 2 && r === 0) || (pos === 0 && r === 6)) wait = 'penchan';
      else wait = 'ryanmen';
      out.push({ groups: base, wait });
    }
  });
  return out;
}

function totalHan(yaku: YakuHan[]): number {
  return yaku.reduce((s, x) => s + x.han, 0);
}

/**
 * 和了の計算。役がない（1 翻縛りを満たさない）・和了形でないときは null。
 * 複数の解釈がある場合は最も高い点数になるものを選ぶ。
 */
export function scoreWin(input: WinInput): WinResult | null {
  const melds = input.melds ?? [];
  const calledGroups = melds.map(calledToGroup);
  const menzen = calledGroups.every((g) => !g.called);
  const meldTiles = melds.flatMap((m) => m.tiles);
  const allTiles = [...input.hand, ...meldTiles];
  const counts = toCounts(allTiles);
  const allKinds = allTiles.map(kindOf);
  const winKind = kindOf(input.winTile);
  const dealer = input.seatWind === 1;
  const ctx: Ctx = {
    input,
    menzen,
    counts,
    allKinds,
    seat: windKind(input.seatWind),
    round: windKind(input.roundWind),
  };

  if (input.hand.length !== 14 - 3 * melds.length) return null;
  if (!input.hand.includes(input.winTile)) return null;

  type Candidate = { form: WinResult['form']; ev: Evaluated };
  const candidates: Candidate[] = [];
  const handCounts = toCounts(input.hand);

  // 国士無双
  if (melds.length === 0 && kokushiShanten(handCounts) === -1) {
    const before = [...handCounts];
    before[winKind]--;
    const thirteen = before.every((n) => n <= 1);
    const yakuman: YakuHan[] = [{ id: thirteen ? 'kokushi13' : 'kokushi', han: 0 }];
    if (input.tenhou) yakuman.push({ id: 'tenhou', han: 0 });
    if (input.chiihou) yakuman.push({ id: 'chiihou', han: 0 });
    candidates.push({ form: 'kokushi', ev: { yaku: [], yakuman, fu: 0 } });
  }

  // 七対子
  if (melds.length === 0 && chiitoitsuShanten(handCounts) === -1) {
    const yaku = [...situationYaku(ctx), ...colorYaku(ctx), { id: 'chiitoitsu' as const, han: 2 }];
    const yakuman = colorYakuman(ctx).filter((x) => x.id === 'tsuuiisou');
    if (input.tenhou) yakuman.push({ id: 'tenhou', han: 0 });
    if (input.chiihou) yakuman.push({ id: 'chiihou', han: 0 });
    candidates.push({ form: 'chiitoitsu', ev: { yaku, yakuman, fu: 25 } });
  }

  // 一般形
  for (const d of decompose(input.hand, true)) {
    for (const it of interpretations(d.pair!, d.melds, winKind, input.tsumo)) {
      const groups = [...it.groups, ...calledGroups];
      candidates.push({ form: 'regular', ev: evaluateRegular(ctx, d.pair!, groups, it.wait) });
    }
    // 九蓮宝燈（門前・一色・1112345678999＋1 枚）
    if (melds.length === 0) {
      const suits = new Set(allKinds.map(suitOfKind));
      const s = allKinds[0] !== undefined ? suitOfKind(allKinds[0]) : -1;
      if (suits.size === 1 && s < 3) {
        const c9 = counts.slice(s * 9, s * 9 + 9);
        const shape = [3, 1, 1, 1, 1, 1, 1, 1, 3];
        if (c9.every((n, j) => n >= shape[j])) {
          const before = [...c9];
          before[winKind - s * 9]--;
          const junsei = before.every((n, j) => n === shape[j]);
          const yakuman: YakuHan[] = [{ id: junsei ? 'junseiChuuren' : 'chuuren', han: 0 }];
          if (input.tenhou) yakuman.push({ id: 'tenhou', han: 0 });
          if (input.chiihou) yakuman.push({ id: 'chiihou', han: 0 });
          candidates.push({ form: 'regular', ev: { yaku: [], yakuman, fu: 0 } });
        }
      }
    }
  }

  // ドラ
  const doraKinds = (input.doraIndicators ?? []).map(doraFromIndicator);
  const dora = doraKinds.reduce((s, k) => s + counts[k], 0);
  const aka = allTiles.filter(isRed).length;
  const uraKinds = input.riichi || input.doubleRiichi ? (input.uraIndicators ?? []).map(doraFromIndicator) : [];
  const ura = uraKinds.reduce((s, k) => s + counts[k], 0);
  const honba = input.honba ?? 0;
  const sticks = input.riichiSticks ?? 0;

  let best: WinResult | null = null;
  for (const cand of candidates) {
    let result: WinResult;
    if (cand.ev.yakuman.length > 0) {
      const yakumanList = cand.ev.yakuman;
      const mult = yakumanList.reduce((s, x) => s + YAKU[x.id].yakuman, 0);
      const { base, limit } = limitOf(0, 0, mult);
      const p = payments(base, dealer, input.tsumo, honba);
      result = {
        form: cand.form,
        yaku: yakumanList,
        yakuman: mult,
        dora: 0,
        aka: 0,
        ura: 0,
        han: 0,
        fu: cand.ev.fu,
        limit,
        ...p,
        gain: p.payment.total + sticks * 1000,
      };
    } else {
      const yakuHan = totalHan(cand.ev.yaku);
      if (yakuHan === 0) continue; // 役なし
      const han = yakuHan + dora + aka + ura;
      const { base, limit } = limitOf(han, cand.ev.fu, 0);
      const p = payments(base, dealer, input.tsumo, honba);
      result = {
        form: cand.form,
        yaku: cand.ev.yaku,
        yakuman: 0,
        dora,
        aka,
        ura,
        han,
        fu: cand.ev.fu,
        limit,
        ...p,
        gain: p.payment.total + sticks * 1000,
      };
    }
    if (!best || isBetter(result, best)) best = result;
  }
  return best;
}

function isBetter(a: WinResult, b: WinResult): boolean {
  if (a.basePoints !== b.basePoints) return a.basePoints > b.basePoints;
  // 同点なら本物の役満を数え役満より優先する
  if ((a.yakuman > 0) !== (b.yakuman > 0)) return a.yakuman > 0;
  if (a.han !== b.han) return a.han > b.han;
  return a.fu > b.fu;
}
