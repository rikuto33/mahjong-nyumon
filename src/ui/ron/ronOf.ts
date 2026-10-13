import { parseTiles, type Tile } from '../../engine/tile';
import { checkRon } from '../../game/ron';
import type { RonScene } from '../../tutorial/ron';

export function ronOf(scene: RonScene) {
  return checkRon({
    hand: parseTiles(scene.hand),
    tile: parseTiles(scene.tile)[0] as Tile,
    ownDiscards: parseTiles(scene.river),
    seatWind: scene.seatWind,
    roundWind: scene.roundWind,
    riichi: scene.riichi,
    skippedThisTurn: scene.skippedThisTurn,
    skippedAfterRiichi: scene.skippedAfterRiichi,
  });
}
