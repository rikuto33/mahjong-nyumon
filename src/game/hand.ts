import { agariForms } from '../engine/agari';
import { ankanOptions, callOptions, forbiddenAfterCall, kakanOptions, type CallOption } from '../engine/calls';
import { furitenReason } from '../engine/furiten';
import { scoreWin, type CalledMeld, type WinResult, type Wind } from '../engine/score';
import { shanten } from '../engine/shanten';
import { isHonor, kindOf, rankOf, sortTiles, toCounts, type Tile } from '../engine/tile';
import { waits } from '../engine/waits';
import type { YakuId } from '../engine/yaku';

/*
 * 1 局の進行（雀魂 段位戦ルール、SPEC §5.2）。純粋な状態遷移で、UI にも AI にも依存しない。
 * 席番号 0〜3 は固定（0 = 人間）。席 s の下家（次の番）は (s + 1) % 4、上家は (s + 3) % 4。
 */

export type Seat = 0 | 1 | 2 | 3;
export const SEATS: Seat[] = [0, 1, 2, 3];
export const nextSeat = (s: Seat): Seat => ((s + 1) % 4) as Seat;
export const prevSeat = (s: Seat): Seat => ((s + 3) % 4) as Seat;

export type OpenMeld = {
  meld: CalledMeld;
  /** 鳴いた相手（暗槓は null） */
  from: Seat | null;
  /** 鳴いた牌（暗槓は null） */
  called: Tile | null;
};

export type RiverTile = { tile: Tile; riichi?: boolean; calledAway?: boolean };

export type RiichiInfo = { double: boolean; ippatsu: boolean };

export type PlayerState = {
  hand: Tile[]; // 手の内（ツモ牌を除く、並べ替え済み）
  drawn: Tile | null;
  melds: OpenMeld[];
  river: RiverTile[];
  /** フリテン判定用：自分が捨てた牌すべて（鳴かれた牌を含む） */
  discards: Tile[];
  riichi: RiichiInfo | null;
  /** この打牌で立直を宣言中（ロンされなければ成立） */
  riichiPending: boolean;
  skippedThisTurn: boolean;
  skippedAfterRiichi: boolean;
  /** 流し満貫の条件（捨て牌がすべて么九牌で、鳴かれていない）を満たしているか */
  nagashi: boolean;
  /** 鳴いた直後の打牌で切れない種類（喰い替え） */
  forbidden: number[];
};

export type Phase = 'turn' | 'respond' | 'chankan' | 'ended';

export type WinRecord = {
  seat: Seat;
  /** 放銃者（ツモなら null） */
  from: Seat | null;
  result: WinResult;
  hand: Tile[]; // 和了牌を除く手の内
  melds: OpenMeld[];
  winTile: Tile;
  uraIndicators: Tile[];
  /** 責任払い（パオ）の相手 */
  pao: Seat | null;
};

export type DrawReason = 'exhaustive' | 'kyuushu' | 'suufon' | 'suucha' | 'suukaikan';

export type HandResult =
  | { kind: 'win'; wins: WinRecord[]; deltas: number[]; dealerWon: boolean }
  | { kind: 'draw'; reason: DrawReason; tenpai: boolean[]; nagashi: Seat[]; deltas: number[] };

export type HandState = {
  roundWind: Wind;
  roundNumber: number;
  dealer: Seat;
  honba: number;
  /** 場に出ている供託（前局からの持ち越しを含む） */
  riichiSticks: number;
  scores: number[];
  wall: Tile[]; // 残りのツモ山（先頭から引く）
  deadWall: Tile[]; // 王牌 14 枚：[0..3] 嶺上牌、[4..8] ドラ表示牌、[9..13] 裏ドラ表示牌
  rinshanUsed: number;
  /** めくられているドラ表示牌の数 */
  doraRevealed: number;
  /** 明槓・加槓のあと、打牌後にめくる槓ドラ */
  pendingKanDora: number;
  /** 槓をした席（四開槓の判定用） */
  kans: Seat[];
  players: PlayerState[];
  turn: Seat;
  phase: Phase;
  /** ツモ牌が嶺上牌か（嶺上開花の判定） */
  rinshanDraw: boolean;
  /** 鳴いた直後で、ツモをしていない手番 */
  afterCall: boolean;
  lastDiscard: { tile: Tile; from: Seat } | null;
  /** 加槓（または暗槓）された牌（搶槓の判定用）。暗槓への搶槓は国士無双だけ */
  chankanTile: { tile: Tile; from: Seat; kind: number; ankan: boolean } | null;
  /** まだ誰も鳴いていない（ダブル立直・天和・地和・九種九牌・四風連打の判定） */
  noCallsYet: boolean;
  /** 大三元・大四喜の責任払い：席ごとに [役, 包の相手] */
  pao: ({ yaku: 'daisangen' | 'daisuushi'; liable: Seat } | null)[];
  result: HandResult | null;
};

export type HandSetup = {
  roundWind: Wind;
  roundNumber: number;
  dealer: Seat;
  honba: number;
  riichiSticks: number;
  scores: number[];
  /** 136 枚をシャッフルしたもの。先頭から 4 枚ずつ配り、最後の 14 枚を王牌にする */
  tiles: Tile[];
};

export const seatWindOf = (s: HandState, seat: Seat): Wind => ((((seat - s.dealer + 4) % 4) + 1) as Wind);

const clone = <T>(x: T): T => structuredClone(x);

function newPlayer(): PlayerState {
  return {
    hand: [],
    drawn: null,
    melds: [],
    river: [],
    discards: [],
    riichi: null,
    riichiPending: false,
    skippedThisTurn: false,
    skippedAfterRiichi: false,
    nagashi: true,
    forbidden: [],
  };
}

/** 配牌して親の第一ツモまで進める */
export function startHand(setup: HandSetup): HandState {
  if (setup.tiles.length !== 136) throw new Error('136 tiles required');
  const live = setup.tiles.slice(0, 122);
  const deadWall = setup.tiles.slice(122);
  const players = SEATS.map(newPlayer);
  // 親から順に 13 枚ずつ（簡略化：まとめて配る）
  let pos = 0;
  for (let i = 0; i < 4; i++) {
    const seat = ((setup.dealer + i) % 4) as Seat;
    players[seat].hand = sortTiles(live.slice(pos, pos + 13));
    pos += 13;
  }
  const s: HandState = {
    roundWind: setup.roundWind,
    roundNumber: setup.roundNumber,
    dealer: setup.dealer,
    honba: setup.honba,
    riichiSticks: setup.riichiSticks,
    scores: [...setup.scores],
    wall: live.slice(pos),
    deadWall,
    rinshanUsed: 0,
    doraRevealed: 1,
    pendingKanDora: 0,
    kans: [],
    players,
    turn: setup.dealer,
    phase: 'turn',
    rinshanDraw: false,
    afterCall: false,
    lastDiscard: null,
    chankanTile: null,
    noCallsYet: true,
    pao: [null, null, null, null],
    result: null,
  };
  return beginTurn(s, setup.dealer, false);
}

export function doraIndicators(s: HandState): Tile[] {
  return s.deadWall.slice(4, 4 + s.doraRevealed);
}

export function uraIndicators(s: HandState): Tile[] {
  return s.deadWall.slice(9, 9 + s.doraRevealed);
}

/** 席の手番を始める（ツモる）。山がなければ流局 */
function beginTurn(s: HandState, seat: Seat, rinshan: boolean): HandState {
  const p = s.players[seat];
  s.turn = seat;
  s.phase = 'turn';
  s.afterCall = false;
  s.lastDiscard = null;
  s.chankanTile = null;
  p.skippedThisTurn = false;
  p.forbidden = [];
  if (rinshan) {
    p.drawn = s.deadWall[s.rinshanUsed];
    s.rinshanUsed++;
    s.rinshanDraw = true;
  } else {
    if (s.wall.length === 0) return exhaustiveDraw(s);
    p.drawn = s.wall[0];
    s.wall = s.wall.slice(1);
    s.rinshanDraw = false;
  }
  return s;
}

const fullHand = (p: PlayerState): Tile[] => (p.drawn ? [...p.hand, p.drawn] : [...p.hand]);
const isClosed = (p: PlayerState) => p.melds.every((m) => m.meld.type === 'ankan');
const isYaochu = (t: Tile) => isHonor(t) || rankOf(t) === 1 || rankOf(t) === 9;

function winContext(s: HandState, seat: Seat) {
  const p = s.players[seat];
  return {
    melds: p.melds.map((m) => m.meld),
    seatWind: seatWindOf(s, seat),
    roundWind: s.roundWind,
    riichi: !!p.riichi && !p.riichi.double,
    doubleRiichi: !!p.riichi?.double,
    ippatsu: !!p.riichi?.ippatsu,
    doraIndicators: doraIndicators(s),
    uraIndicators: p.riichi ? uraIndicators(s) : [],
  };
}

// ---------------------------------------------------------------- 手番の選択肢

export type TurnOptions = {
  tsumo: WinResult | null;
  /** 切れる牌（同じ牌が複数あっても 1 つずつ。ツモ牌は 'drawn' 側で扱う） */
  discards: Tile[];
  /** 立直できる場合、立直宣言牌として切れる牌 */
  riichiDiscards: Tile[];
  ankan: number[];
  kakan: number[];
  kyuushu: boolean;
};

export function turnOptions(s: HandState): TurnOptions {
  const seat = s.turn;
  const p = s.players[seat];
  const none: TurnOptions = { tsumo: null, discards: [], riichiDiscards: [], ankan: [], kakan: [], kyuushu: false };
  if (s.phase !== 'turn') return none;
  const tiles = fullHand(p);
  const kanCount = s.kans.length;

  let tsumo: WinResult | null = null;
  if (p.drawn && !s.afterCall) {
    tsumo = scoreWin({
      ...winContext(s, seat),
      hand: tiles,
      winTile: p.drawn,
      tsumo: true,
      lastTile: s.wall.length === 0 && !s.rinshanDraw,
      rinshan: s.rinshanDraw,
      tenhou: s.noCallsYet && seat === s.dealer && p.river.length === 0,
      chiihou: s.noCallsYet && seat !== s.dealer && p.river.length === 0,
      honba: s.honba,
      riichiSticks: s.riichiSticks,
    });
  }

  let discards: Tile[];
  if (p.riichi) discards = p.drawn ? [p.drawn] : [];
  else discards = [...new Set(tiles)].filter((t) => !p.forbidden.includes(kindOf(t)));

  let riichiDiscards: Tile[] = [];
  if (!p.riichi && isClosed(p) && !s.afterCall && s.scores[seat] >= 1000 && s.wall.length >= 4) {
    const openMelds = p.melds.length;
    riichiDiscards = discards.filter((t) => {
      const rest = [...tiles];
      rest.splice(rest.indexOf(t), 1);
      return waits(rest, openMelds).length > 0;
    });
  }

  const ankan = s.afterCall
    ? []
    : ankanOptions(tiles, {
        riichi: !!p.riichi,
        drawn: p.drawn ?? undefined,
        openMelds: p.melds.length,
        wallRemaining: s.wall.length,
        kanCount,
      });
  const kakan = s.afterCall
    ? []
    : kakanOptions(
        tiles,
        p.melds.map((m) => m.meld),
        { riichi: !!p.riichi, wallRemaining: s.wall.length, kanCount },
      );
  const kyuushu =
    s.noCallsYet &&
    p.river.length === 0 &&
    !s.afterCall &&
    new Set(tiles.filter(isYaochu).map(kindOf)).size >= 9;

  return { tsumo, discards, riichiDiscards, ankan, kakan, kyuushu };
}

// ---------------------------------------------------------------- 応答の選択肢

export type ResponseOptions = { ron: WinResult | null; calls: CallOption[] };

export function responseOptions(s: HandState, seat: Seat): ResponseOptions {
  const none = { ron: null, calls: [] };
  if (s.phase === 'chankan' && s.chankanTile && seat !== s.chankanTile.from) {
    const r = ronResult(s, seat, s.chankanTile.tile, true);
    return { ron: r && (!s.chankanTile.ankan || r.form === 'kokushi') ? r : null, calls: [] };
  }
  if (s.phase !== 'respond' || !s.lastDiscard || seat === s.lastDiscard.from) return none;
  const tile = s.lastDiscard.tile;
  const ron = ronResult(s, seat, tile, false);
  const p = s.players[seat];
  const calls =
    s.wall.length === 0
      ? []
      : callOptions(p.hand, tile, {
          fromLeft: prevSeat(seat) === s.lastDiscard.from,
          riichi: !!p.riichi,
          wallRemaining: s.wall.length,
          kanCount: s.kans.length,
        });
  return { ron, calls };
}

function ronResult(s: HandState, seat: Seat, tile: Tile, chankan: boolean): WinResult | null {
  const p = s.players[seat];
  if (!waits(p.hand, p.melds.length).includes(kindOf(tile))) return null;
  if (
    furitenReason(p.hand, p.melds.length, {
      ownDiscards: p.discards,
      skippedThisTurn: p.skippedThisTurn,
      skippedAfterRiichi: p.skippedAfterRiichi,
    })
  ) {
    return null;
  }
  return scoreWin({
    ...winContext(s, seat),
    hand: [...p.hand, tile],
    winTile: tile,
    tsumo: false,
    lastTile: !chankan && s.wall.length === 0,
    chankan,
    honba: s.honba,
    riichiSticks: s.riichiSticks,
  });
}

// ---------------------------------------------------------------- 行動

export type Response =
  | { seat: Seat; action: 'pass' }
  | { seat: Seat; action: 'ron' }
  | { seat: Seat; action: 'call'; option: CallOption };

export type Action =
  | { type: 'discard'; tile: Tile; riichi?: boolean }
  | { type: 'tsumo' }
  | { type: 'ankan'; kind: number }
  | { type: 'kakan'; kind: number }
  | { type: 'kyuushu' }
  | { type: 'respond'; responses: Response[] };

export function apply(state: HandState, action: Action): HandState {
  if (state.phase === 'ended') return state;
  const s = clone(state);
  switch (action.type) {
    case 'discard':
      return doDiscard(s, action.tile, !!action.riichi);
    case 'tsumo':
      return doTsumo(s);
    case 'ankan':
      return doAnkan(s, action.kind);
    case 'kakan':
      return doKakan(s, action.kind);
    case 'kyuushu':
      return abortiveDraw(s, 'kyuushu');
    case 'respond':
      return doRespond(s, action.responses);
  }
}

function removeTile(tiles: Tile[], t: Tile): Tile[] {
  const i = tiles.indexOf(t);
  if (i < 0) throw new Error(`tile ${t} not in hand`);
  const out = [...tiles];
  out.splice(i, 1);
  return out;
}

function doDiscard(s: HandState, tile: Tile, riichi: boolean): HandState {
  const seat = s.turn;
  const p = s.players[seat];
  const opts = turnOptions(s);
  if (riichi ? !opts.riichiDiscards.includes(tile) : !opts.discards.includes(tile)) {
    throw new Error(`illegal discard ${tile}`);
  }
  // 手牌から抜く（ツモ牌と同じ牌なら、ツモ切りを優先）
  if (p.drawn === tile) p.drawn = null;
  else {
    p.hand = removeTile(p.hand, tile);
    if (p.drawn) p.hand = sortTiles([...p.hand, p.drawn]);
    p.drawn = null;
  }
  if (p.riichi) p.riichi.ippatsu = false; // 立直後の自分の打牌で一発は消える
  if (riichi) p.riichiPending = true;
  p.river.push({ tile, riichi });
  p.discards.push(tile);
  if (!isYaochu(tile)) p.nagashi = false;
  p.forbidden = [];
  s.lastDiscard = { tile, from: seat };
  s.afterCall = false;
  // 明槓・加槓の槓ドラは打牌後にめくる
  s.doraRevealed += s.pendingKanDora;
  s.pendingKanDora = 0;
  s.phase = 'respond';
  return s;
}

function doTsumo(s: HandState): HandState {
  const seat = s.turn;
  const p = s.players[seat];
  const r = turnOptions(s).tsumo;
  if (!r || !p.drawn) throw new Error('cannot tsumo');
  const win: WinRecord = {
    seat,
    from: null,
    result: r,
    hand: [...p.hand],
    melds: p.melds,
    winTile: p.drawn,
    uraIndicators: p.riichi ? uraIndicators(s) : [],
    pao: paoFor(s, seat, r),
  };
  return settleWins(s, [win]);
}

function paoFor(s: HandState, seat: Seat, r: WinResult): Seat | null {
  const pao = s.pao[seat];
  if (!pao) return null;
  return r.yaku.some((y) => y.id === pao.yaku) ? pao.liable : null;
}

function revealKanDoraNow(s: HandState) {
  s.doraRevealed += 1 + s.pendingKanDora;
  s.pendingKanDora = 0;
}

function clearIppatsu(s: HandState) {
  for (const p of s.players) if (p.riichi) p.riichi.ippatsu = false;
}

function doAnkan(s: HandState, kind: number): HandState {
  const seat = s.turn;
  const p = s.players[seat];
  if (!turnOptions(s).ankan.includes(kind)) throw new Error('illegal ankan');
  const all = fullHand(p);
  const four = all.filter((t) => kindOf(t) === kind);
  p.hand = sortTiles(all.filter((t) => kindOf(t) !== kind));
  p.drawn = null;
  p.melds.push({ meld: { type: 'ankan', tiles: four }, from: null, called: null });
  s.kans.push(seat);
  s.noCallsYet = false;
  clearIppatsu(s);
  revealKanDoraNow(s); // 暗槓は即めくり（前の槓の後めくり分も一緒に）
  s.wall = s.wall.slice(0, -1); // 嶺上牌の補充で山が 1 枚減る
  // 国士無双の聴牌者がいれば暗槓の牌で搶槓できる
  s.chankanTile = { tile: four[0], from: seat, kind, ankan: true };
  if (SEATS.some((x) => x !== seat && responseOptions({ ...s, phase: 'chankan' }, x).ron)) {
    s.phase = 'chankan';
    return s;
  }
  s.chankanTile = null;
  return beginTurn(s, seat, true);
}

function doKakan(s: HandState, kind: number): HandState {
  const seat = s.turn;
  const p = s.players[seat];
  if (!turnOptions(s).kakan.includes(kind)) throw new Error('illegal kakan');
  const all = fullHand(p);
  const tile = all.find((t) => kindOf(t) === kind)!;
  p.hand = sortTiles(removeTile(all, tile));
  p.drawn = null;
  const m = p.melds.find((x) => x.meld.type === 'pon' && kindOf(x.meld.tiles[0]) === kind)!;
  m.meld = { type: 'kakan', tiles: [...m.meld.tiles, tile] };
  // 続く槓の直前に、前の槓の後めくり分をめくる
  s.doraRevealed += s.pendingKanDora;
  s.pendingKanDora = 0;
  s.chankanTile = { tile, from: seat, kind, ankan: false };
  s.phase = 'chankan';
  return s;
}

/** 搶槓されなかったあと、嶺上牌をツモる */
function finishKakan(s: HandState): HandState {
  const seat = s.chankanTile!.from;
  if (s.chankanTile!.ankan) {
    s.chankanTile = null;
    return beginTurn(s, seat, true);
  }
  s.kans.push(seat);
  s.noCallsYet = false;
  clearIppatsu(s);
  s.pendingKanDora += 1; // 加槓は後めくり
  s.wall = s.wall.slice(0, -1);
  s.chankanTile = null;
  return beginTurn(s, seat, true);
}

function doRespond(s: HandState, responses: Response[]): HandState {
  const isChankan = s.phase === 'chankan';
  const source = isChankan ? s.chankanTile! : s.lastDiscard!;
  const from = source.from;

  // 見逃しフリテン：ロンできたのにパスした人
  for (const r of responses) {
    if (r.action === 'ron') continue;
    if (responseOptions(s, r.seat).ron) {
      const p = s.players[r.seat];
      p.skippedThisTurn = true;
      if (p.riichi) p.skippedAfterRiichi = true;
    }
  }

  const rons = responses.filter((r) => r.action === 'ron').map((r) => r.seat);
  if (rons.length > 0) {
    // 放銃者から近い順（上家取りの判定にも使う）
    const order = [1, 2, 3].map((d) => ((from + d) % 4) as Seat).filter((x) => rons.includes(x));
    const wins: WinRecord[] = order.map((seat, i) => {
      const r = responseOptions(s, seat).ron;
      if (!r) throw new Error('illegal ron');
      // 本場・供託は上家取り：最初の和了者だけ
      const result = i === 0 ? r : rescore(s, seat, source.tile, isChankan);
      return {
        seat,
        from,
        result,
        hand: [...s.players[seat].hand],
        melds: s.players[seat].melds,
        winTile: source.tile,
        uraIndicators: s.players[seat].riichi ? uraIndicators(s) : [],
        pao: paoFor(s, seat, result),
      };
    });
    // 立直宣言牌でロンされたら立直は不成立
    s.players[from].riichiPending = false;
    return settleWins(s, wins);
  }

  if (isChankan) return finishKakan(s);

  // 立直の成立
  const discarder = s.players[from];
  if (discarder.riichiPending) {
    discarder.riichiPending = false;
    discarder.riichi = { double: s.noCallsYet && discarder.river.length === 1, ippatsu: true };
    s.scores[from] -= 1000;
    s.riichiSticks += 1;
    if (s.players.every((p) => p.riichi)) return abortiveDraw(s, 'suucha');
  }

  // 四開槓：4 回目の槓のあとの打牌が通ったら（1 人で 4 回なら続行）
  if (s.kans.length === 4 && new Set(s.kans).size > 1) return abortiveDraw(s, 'suukaikan');

  // 四風連打
  if (s.noCallsYet && s.players.every((p) => p.river.length === 1)) {
    const first = s.players.map((p) => p.river[0].tile);
    if (first.every((t) => t === first[0]) && kindOf(first[0]) >= 27 && kindOf(first[0]) <= 30) {
      return abortiveDraw(s, 'suufon');
    }
  }

  const calls = responses.filter((r): r is Extract<Response, { action: 'call' }> => r.action === 'call');
  const ponKan = calls.find((c) => c.option.type !== 'chi');
  const chi = calls.find((c) => c.option.type === 'chi');
  const call = ponKan ?? chi;
  if (call) return doCall(s, call.seat, call.option, from);

  return beginTurn(s, nextSeat(from), false);
}

/** 2 人目以降の和了者は本場・供託なしで計算し直す */
function rescore(s: HandState, seat: Seat, tile: Tile, chankan: boolean): WinResult {
  const saved = { honba: s.honba, sticks: s.riichiSticks };
  s.honba = 0;
  s.riichiSticks = 0;
  const r = ronResult(s, seat, tile, chankan)!;
  s.honba = saved.honba;
  s.riichiSticks = saved.sticks;
  return r;
}

function doCall(s: HandState, seat: Seat, option: CallOption, from: Seat): HandState {
  const p = s.players[seat];
  for (const t of option.fromHand) p.hand = removeTile(p.hand, t);
  const meld: CalledMeld = { type: option.type, tiles: [...option.fromHand, option.called] };
  p.melds.push({ meld, from, called: option.called });
  const fp = s.players[from];
  fp.river[fp.river.length - 1].calledAway = true;
  fp.nagashi = false;
  s.noCallsYet = false;
  clearIppatsu(s);

  // 責任払い：大三元の 3 種目・大四喜の 4 種目を鳴かせた人
  if (option.type !== 'chi') {
    const k = kindOf(option.called);
    const tripletKinds = p.melds.filter((m) => m.meld.type !== 'chi').map((m) => kindOf(m.meld.tiles[0]));
    const dragons = tripletKinds.filter((x) => x >= 31).length;
    const winds = tripletKinds.filter((x) => x >= 27 && x <= 30).length;
    if (k >= 31 && dragons === 3) s.pao[seat] = { yaku: 'daisangen', liable: from };
    if (k >= 27 && k <= 30 && winds === 4) s.pao[seat] = { yaku: 'daisuushi', liable: from };
  }

  if (option.type === 'minkan') {
    s.doraRevealed += s.pendingKanDora; // 前の槓の後めくり分
    s.pendingKanDora = 0;
    s.kans.push(seat);
    s.pendingKanDora += 1; // 明槓は後めくり
    s.wall = s.wall.slice(0, -1);
    return beginTurn(s, seat, true);
  }
  s.turn = seat;
  s.phase = 'turn';
  s.afterCall = true;
  s.lastDiscard = null;
  p.forbidden = forbiddenAfterCall(option.type, option.fromHand, option.called);
  return s;
}

// ---------------------------------------------------------------- 精算

function settleWins(s: HandState, wins: WinRecord[]): HandState {
  const deltas = [0, 0, 0, 0];
  wins.forEach((w, i) => {
    const r = w.result;
    const honba = i === 0 ? s.honba : 0;
    if (w.pao !== null && r.yakuman > 0) {
      payWithPao(s, w, honba, deltas);
    } else if (r.payment.kind === 'ron') {
      deltas[w.from!] -= r.payment.total;
      deltas[w.seat] += r.payment.total;
    } else {
      for (const other of SEATS) {
        if (other === w.seat) continue;
        const pay =
          r.payment.kind === 'tsumoDealer'
            ? r.payment.each
            : other === s.dealer
              ? r.payment.dealer
              : r.payment.child;
        deltas[other] -= pay;
        deltas[w.seat] += pay;
      }
    }
    if (i === 0) deltas[w.seat] += s.riichiSticks * 1000;
  });
  for (const seat of SEATS) s.scores[seat] += deltas[seat];
  s.riichiSticks = 0;
  s.phase = 'ended';
  s.result = { kind: 'win', wins, deltas, dealerWon: wins.some((w) => w.seat === s.dealer) };
  return s;
}

/** パオ：責任のある役満の分は包が払う（ツモは全額、ロンは放銃者と折半）。積み棒は包 */
function payWithPao(s: HandState, w: WinRecord, honba: number, deltas: number[]) {
  const r = w.result;
  const dealer = w.seat === s.dealer;
  const paoYaku: YakuId = s.pao[w.seat]!.yaku;
  const paoMult = paoYaku === 'daisuushi' ? 2 : 1;
  const otherMult = r.yakuman - paoMult;
  const unit = dealer ? 48000 : 32000; // 役満 1 倍のロン相当
  const liable = w.pao!;
  const paoPart = unit * paoMult;
  const otherPart = unit * otherMult;
  const honbaTotal = 300 * honba;
  const pay = (seat: number, amount: number) => {
    deltas[seat] -= amount;
    deltas[w.seat] += amount;
  };
  if (w.from === null) {
    pay(liable, paoPart + honbaTotal);
    if (otherMult > 0) {
      for (const other of SEATS) {
        if (other === w.seat) continue;
        pay(other, dealer ? otherPart / 3 : other === s.dealer ? otherPart / 2 : otherPart / 4);
      }
    }
  } else if (w.from === liable) {
    pay(liable, paoPart + otherPart + honbaTotal);
  } else {
    pay(liable, paoPart / 2 + honbaTotal);
    pay(w.from, paoPart / 2 + otherPart);
  }
}

/** ノーテン罰符：ノーテンの人が合計 3,000 点を聴牌の人に払う（全員聴牌・全員ノーテンなら 0） */
export function notenPayments(tenpai: boolean[]): number[] {
  const n = tenpai.filter(Boolean).length;
  if (n === 0 || n === 4) return [0, 0, 0, 0];
  return tenpai.map((t) => (t ? 3000 / n : -3000 / (4 - n)));
}

function tenpaiOf(p: PlayerState): boolean {
  return waits(p.hand, p.melds.length).length > 0;
}

function exhaustiveDraw(s: HandState): HandState {
  const tenpai = s.players.map(tenpaiOf);
  const nagashi = SEATS.filter((seat) => s.players[seat].nagashi && s.players[seat].river.length > 0);
  const deltas = [0, 0, 0, 0];
  if (nagashi.length > 0) {
    // 流し満貫：満貫のツモ和了と同じ支払い（本場・供託なし）
    for (const seat of nagashi) {
      for (const other of SEATS) {
        if (other === seat) continue;
        const pay = seat === s.dealer ? 4000 : other === s.dealer ? 4000 : 2000;
        deltas[other] -= pay;
        deltas[seat] += pay;
      }
    }
  } else {
    notenPayments(tenpai).forEach((d, seat) => (deltas[seat] += d));
  }
  for (const seat of SEATS) s.scores[seat] += deltas[seat];
  s.phase = 'ended';
  s.result = { kind: 'draw', reason: 'exhaustive', tenpai, nagashi, deltas };
  return s;
}

function abortiveDraw(s: HandState, reason: DrawReason): HandState {
  if (reason === 'kyuushu' && !turnOptions(s).kyuushu) throw new Error('cannot declare kyuushu');
  s.phase = 'ended';
  s.result = { kind: 'draw', reason, tenpai: s.players.map(tenpaiOf), nagashi: [], deltas: [0, 0, 0, 0] };
  return s;
}

// ---------------------------------------------------------------- 補助

/** 手番の人の手牌（ツモ牌を含む） */
export function handOf(s: HandState, seat: Seat): Tile[] {
  return fullHand(s.players[seat]);
}

export function shantenOf(s: HandState, seat: Seat): number {
  const p = s.players[seat];
  return shanten(fullHand(p), p.melds.length);
}

/** 見えている牌の枚数（自分の手牌・全員の河・全員の副露・ドラ表示牌） */
export function visibleCounts(s: HandState, seat: Seat): number[] {
  const tiles: Tile[] = [...fullHand(s.players[seat]), ...doraIndicators(s)];
  for (const p of s.players) {
    tiles.push(...p.river.filter((r) => !r.calledAway).map((r) => r.tile));
    for (const m of p.melds) tiles.push(...m.meld.tiles);
  }
  return toCounts(tiles);
}

export { agariForms };
