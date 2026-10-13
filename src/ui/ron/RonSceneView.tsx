import { parseTiles, sortTiles } from '../../engine/tile';
import { useI18n } from '../../i18n/I18nContext';
import type { RonScene } from '../../tutorial/ron';
import { Tile } from '../tile/Tile';

/** ロンの場面：他家の捨て牌・自分の河・自分の手牌 */
export function RonSceneView({ scene }: { scene: RonScene }) {
  const { t } = useI18n();
  return (
    <div className="ron-scene">
      <div className="ron-discard">
        <span className="muted">{t('scene.discarded')}</span>
        <Tile tile={parseTiles(scene.tile)[0]} width="var(--choice-tile)" mark="tip" />
      </div>
      <div className="ron-river">
        <span className="muted">{t('scene.yourRiver')}</span>
        <span className="tile-row-inline">
          {parseTiles(scene.river).map((tile, i) => (
            <Tile key={i} tile={tile} width="var(--solo-river-tile)" sideways={scene.riichi && i === 0} />
          ))}
        </span>
      </div>
      <div>
        <span className="muted">{t('scene.yourHand')}</span>
        <div className="quiz-hand">
          {sortTiles(parseTiles(scene.hand)).map((tile, i) => (
            <Tile key={i} tile={tile} width="var(--hand-tile)" />
          ))}
        </div>
      </div>
      <ul className="situation">
        {scene.riichi && <li>{t('scene.riichi')}</li>}
      </ul>
    </div>
  );
}
