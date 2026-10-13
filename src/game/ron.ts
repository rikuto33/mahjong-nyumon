import { furitenReason } from '../engine/furiten';
import { scoreWin, type WinResult, type Wind } from '../engine/score';
import { kindOf, type Tile } from '../engine/tile';
import { waits } from '../engine/waits';

export type RonSituation = {
  /** 手の内 13 枚 */
  hand: Tile[];
  /** 他家が捨てた牌 */
  tile: Tile;
  ownDiscards: Tile[];
  seatWind: Wind;
  roundWind: Wind;
  riichi?: boolean;
  skippedThisTurn?: boolean;
  skippedAfterRiichi?: boolean;
};

export type RonCheck =
  | { ok: true; result: WinResult }
  | { ok: false; reason: 'notWait' | 'furitenDiscard' | 'furitenTemporary' | 'furitenRiichi' | 'noYaku' };

/** その捨て牌でロンできるか。できない理由も返す（段階 6 の説明用） */
export function checkRon(s: RonSituation): RonCheck {
  if (!waits(s.hand).includes(kindOf(s.tile))) return { ok: false, reason: 'notWait' };
  const f = furitenReason(s.hand, 0, {
    ownDiscards: s.ownDiscards,
    skippedThisTurn: s.skippedThisTurn,
    skippedAfterRiichi: s.skippedAfterRiichi,
  });
  if (f === 'discard') return { ok: false, reason: 'furitenDiscard' };
  if (f === 'riichi') return { ok: false, reason: 'furitenRiichi' };
  if (f === 'temporary') return { ok: false, reason: 'furitenTemporary' };
  const result = scoreWin({
    hand: [...s.hand, s.tile],
    winTile: s.tile,
    tsumo: false,
    seatWind: s.seatWind,
    roundWind: s.roundWind,
    riichi: s.riichi,
  });
  if (!result) return { ok: false, reason: 'noYaku' };
  return { ok: true, result };
}
