import type { Tile } from '../../engine/tile';

// 表示用の型。局の進行（src/game）を作るフェーズ 5 で状態機械の型に置き換える

export type Discard = { tile: Tile; riichi?: boolean };

/** 副露。sideways は横向きにする牌の位置（誰から鳴いたかを示す） */
export type Meld = { tiles: Tile[]; sideways: number };

export type SeatView = {
  wind: 1 | 2 | 3 | 4;
  score: number;
  riichi: boolean;
  discards: Discard[];
  melds: Meld[];
  /** 他家は枚数だけ、自分は牌 */
  handCount: number;
};

export type TableView = {
  roundWind: 1 | 2 | 3 | 4;
  roundNumber: number;
  honba: number;
  riichiSticks: number;
  remaining: number;
  doraIndicators: Tile[];
  /** 0 = 自分、1 = 下家（右）、2 = 対面、3 = 上家（左） */
  seats: [SeatView, SeatView, SeatView, SeatView];
  myHand: Tile[];
};
