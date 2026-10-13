import { parseTiles, sortTiles } from '../../engine/tile';
import { useI18n } from '../../i18n/I18nContext';
import type { RonScene } from '../../tutorial/stage6';
import { Tile } from '../tile/Tile';

/** ロンの場面：他家の捨て牌・自分の河・自分の手牌 */
export function RonSceneView({ scene }: { scene: RonScene }) {
  const { t } = useI18n();
  return (
    <div className="ron-scene">
      <div className="ron-discard">
        <span className="muted">{t('stage6.quiz.discarded')}</span>
        <Tile tile={parseTiles(scene.tile)[0]} width="var(--choice-tile)" mark="tip" />
      </div>
      <div className="ron-river">
        <span className="muted">{t('stage6.quiz.yourRiver')}</span>
        <span className="tile-row-inline">
          {parseTiles(scene.river).map((tile, i) => (
            <Tile key={i} tile={tile} width="var(--solo-river-tile)" sideways={scene.riichi && i === 0} />
          ))}
        </span>
      </div>
      <div>
        <span className="muted">{t('stage6.quiz.yourHand')}</span>
        <div className="quiz-hand">
          {sortTiles(parseTiles(scene.hand)).map((tile, i) => (
            <Tile key={i} tile={tile} width="var(--hand-tile)" />
          ))}
        </div>
      </div>
      <ul className="situation">
        {scene.riichi && <li>{t('stage6.quiz.riichi')}</li>}
        {scene.skippedThisTurn && <li>{t('stage6.quiz.skipped')}</li>}
        {scene.skippedAfterRiichi && <li>{t('stage6.quiz.skippedRiichi')}</li>}
      </ul>
    </div>
  );
}
