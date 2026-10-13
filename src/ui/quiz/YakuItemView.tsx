import { decompose } from '../../engine/decompose';
import { isHonor, kindOf, parseTiles, rankOf, sortTiles, type Tile as TileCode } from '../../engine/tile';
import { useI18n } from '../../i18n/I18nContext';
import { scoreItem, type YakuItem } from '../../tutorial/yakuItems';
import { MeldTiles } from '../tile/MeldTiles';
import { Tile } from '../tile/Tile';

/** 手の内を組ごとに分けて並べる（七対子は対子ごと）。和了牌は印を付ける */
function groupsOf(item: YakuItem): TileCode[][] {
  const win = parseTiles(item.win)[0];
  const all = [...parseTiles(item.hand), win];
  const r = scoreItem(item);
  if (r?.form === 'chiitoitsu') {
    const sorted = sortTiles(all);
    return Array.from({ length: 7 }, (_, i) => sorted.slice(i * 2, i * 2 + 2));
  }
  const d = decompose(all, true)[0];
  if (!d) return [sortTiles(all)];
  const pool = [...all];
  const take = (k: number) => {
    const i = pool.findIndex((t) => kindOf(t) === k);
    return pool.splice(i, 1)[0];
  };
  const groups = d.melds.map((m) => (m.type === 'koutsu' ? [m.kind, m.kind, m.kind] : [m.kind, m.kind + 1, m.kind + 2]).map(take));
  groups.push([take(d.pair!), take(d.pair!)]);
  return groups.sort((a, b) => kindOf(a[0]) - kindOf(b[0]));
}

/** 役のクイズで手の状態を示す：組に分けた手牌、鳴いた面子、手の状態のまとめ */
export function YakuItemView({ item }: { item: YakuItem }) {
  const { t } = useI18n();
  const win = parseTiles(item.win)[0];
  const groups = groupsOf(item);
  let winMarked = false;
  const closed = (item.melds ?? []).every((m) => m.type === 'ankan');
  const all = [...parseTiles(item.hand), win, ...(item.melds ?? []).flatMap((m) => parseTiles(m.tiles))];
  const simples = all.every((x) => !isHonor(x) && rankOf(x) !== 1 && rankOf(x) !== 9);
  return (
    <div className="yaku-item">
      <div className="yaku-item-tiles">
        {groups.map((g, i) => (
          <span key={i} className="tile-group">
            {g.map((tile, j) => {
              const isWin = !winMarked && kindOf(tile) === kindOf(win) && tile === win;
              if (isWin) winMarked = true;
              return <Tile key={j} tile={tile} width="var(--hand-tile)" mark={isWin ? 'correct' : undefined} />;
            })}
          </span>
        ))}
        {(item.melds ?? []).map((m, i) => (
          <span key={`m${i}`} className="tile-group called-group">
            <MeldTiles meld={{ type: m.type, tiles: parseTiles(m.tiles) }} width="var(--hand-tile)" />
          </span>
        ))}
      </div>
      <ul className="hand-facts">
        <li>{closed ? t('quizHelp.closed') : t('quizHelp.open')}</li>
        <li>{item.tsumo ? t('quizHelp.tsumo') : t('quizHelp.ron')}</li>
        {item.riichi && <li>{t('quizHelp.riichi')}</li>}
        <li>{simples ? t('quizHelp.simplesYes') : t('quizHelp.simplesNo')}</li>
        <li>{t('quizHelp.winds')}</li>
      </ul>
      <p className="muted small">{t('quizHelp.winTile')}</p>
    </div>
  );
}

