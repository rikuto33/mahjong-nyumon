import { shanten, shantenOfCounts } from '../engine/shanten';
import { kindOf, rankOf, toCounts, type Tile } from '../engine/tile';
import { acceptance } from '../engine/waits';
import {
  handOf,
  responseOptions,
  seatWindOf,
  turnOptions,
  visibleCounts,
  type Action,
  type HandState,
  type Response,
  type Seat,
} from './hand';

/*
 * AI（SPEC §7）。エンジンの関数だけで考える。
 * - やさしい：向聴数が下がる打牌を選ぶが、ときどき最善でない牌を切る。守備はしない。鳴きはほぼしない
 * - ふつう：受け入れ枚数が最大の打牌。聴牌したら基本は立直。役牌はポン。
 *   他家の立直に対しては、自分が一向聴以上なら現物・筋を優先して切る簡易な守備
 */

export type AiLevel = 'easy' | 'normal';
type Rng = () => number;

type Candidate = { tile: Tile; shanten: number; accept: number };

function evaluateDiscards(s: HandState, seat: Seat, tiles: Tile[], useVisible: boolean): Candidate[] {
  const p = s.players[seat];
  const all = handOf(s, seat);
  const visible = useVisible ? visibleCounts(s, seat) : toCounts(all);
  return tiles.map((tile) => {
    const rest = [...all];
    rest.splice(rest.indexOf(tile), 1);
    const sh = shanten(rest, p.melds.length);
    return { tile, shanten: sh, accept: acceptance(rest, p.melds.length, visible).count };
  });
}

function bestOf(cands: Candidate[]): Candidate[] {
  const minS = Math.min(...cands.map((c) => c.shanten));
  const atMin = cands.filter((c) => c.shanten === minS);
  const maxA = Math.max(...atMin.map((c) => c.accept));
  return atMin.filter((c) => c.accept === maxA);
}

/** 牌の危険度（小さいほど安全）。立直者ごとの最大値 */
function danger(s: HandState, seat: Seat, tile: Tile): number {
  const k = kindOf(tile);
  const visible = visibleCounts(s, seat);
  let worst = 0;
  for (const other of [0, 1, 2, 3] as Seat[]) {
    if (other === seat || !s.players[other].riichi) continue;
    const op = s.players[other];
    const genbutsu = new Set(op.discards.map(kindOf));
    // 立直宣言後に他家が切って通った牌も現物
    const riichiIdx = op.river.findIndex((r) => r.riichi);
    const after = s.players.flatMap((pp) => pp.river.slice(Math.max(0, riichiIdx)).map((r) => kindOf(r.tile)));
    let d: number;
    if (genbutsu.has(k) || after.includes(k)) d = 0;
    else if (k >= 27) d = visible[k] >= 3 ? 1 : visible[k] === 2 ? 3 : 5;
    else {
      const r = rankOf(tile);
      const base = Math.floor(k / 9) * 9;
      const has = (rr: number) => genbutsu.has(base + rr - 1);
      const suji = r <= 3 ? has(r + 3) : r >= 7 ? has(r - 3) : has(r - 3) && has(r + 3);
      if (suji) d = 2;
      else if (r === 1 || r === 9) d = 4;
      else d = 6;
    }
    worst = Math.max(worst, d);
  }
  return worst;
}

export function decideTurn(s: HandState, level: AiLevel, rng: Rng = Math.random): Action {
  const seat = s.turn;
  const p = s.players[seat];
  const opts = turnOptions(s);
  if (opts.tsumo) return { type: 'tsumo' };
  if (opts.kyuushu) return { type: 'kyuushu' };
  if (p.riichi) return { type: 'discard', tile: opts.discards[0] };

  // ふつう：暗槓しても向聴数が悪くならなければ槓
  if (level === 'normal' && opts.ankan.length > 0) {
    const all = handOf(s, seat);
    const k = opts.ankan[0];
    const before = shanten(all.filter((_, i) => i !== all.findIndex((t) => kindOf(t) === k)), p.melds.length);
    const after = shantenOfCounts(
      toCounts(all.filter((t) => kindOf(t) !== k)),
      p.melds.length + 1,
    );
    if (after <= before) return { type: 'ankan', kind: k };
  }

  const cands = evaluateDiscards(s, seat, opts.discards, level === 'normal');
  let choice: Candidate;
  const someoneRiichi = s.players.some((pp, i) => i !== seat && pp.riichi);
  const currentShanten = Math.min(...cands.map((c) => c.shanten));

  if (level === 'normal' && someoneRiichi && currentShanten >= 1) {
    // 簡易な守備：危険度が最小の牌、その中で効率の良い牌
    const scored = cands.map((c) => ({ c, d: danger(s, seat, c.tile) }));
    const minD = Math.min(...scored.map((x) => x.d));
    choice = bestOf(scored.filter((x) => x.d === minD).map((x) => x.c))[0];
  } else if (level === 'easy' && rng() < 0.3) {
    // ときどき最善でない牌（向聴数は 1 つ悪くなる程度まで）
    const ok = cands.filter((c) => c.shanten <= currentShanten + 1);
    choice = ok[Math.floor(rng() * ok.length)];
  } else {
    const best = bestOf(cands);
    choice = best[Math.floor(rng() * best.length)];
  }

  const canRiichi = opts.riichiDiscards.includes(choice.tile);
  const riichi = canRiichi && (level === 'normal' || rng() < 0.6);
  return { type: 'discard', tile: choice.tile, riichi };
}

export function decideResponse(s: HandState, seat: Seat, level: AiLevel, rng: Rng = Math.random): Response {
  const opts = responseOptions(s, seat);
  if (opts.ron) return { seat, action: 'ron' };
  const pon = opts.calls.find((c) => c.type === 'pon');
  if (pon) {
    const k = kindOf(pon.called);
    const seatWind = 26 + seatWindOf(s, seat);
    const roundWind = 26 + s.roundWind;
    const yakuhai = k >= 31 || k === seatWind || k === roundWind;
    const wants = level === 'normal' ? yakuhai : yakuhai && rng() < 0.1;
    if (wants) return { seat, action: 'call', option: pon };
  }
  return { seat, action: 'pass' };
}
