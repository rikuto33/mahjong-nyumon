import { useState } from 'react';
import { parseTiles, sortTiles } from '../../engine/tile';
import { YAKU_LIST, type YakuInfo } from '../../engine/yaku';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import { DEX_EXAMPLES, LESSON_YAKU } from '../../tutorial/yakuDex';
import { ScreenHeader } from '../ScreenHeader';
import { MeldTiles } from '../tile/MeldTiles';
import { Tile } from '../tile/Tile';

type Group = 'g1' | 'g2' | 'g3' | 'gY';
const groupOf = (y: YakuInfo): Group => (y.yakuman ? 'gY' : y.han === 1 ? 'g1' : y.han === 2 ? 'g2' : 'g3');
const GROUPS: Group[] = ['g1', 'g2', 'g3', 'gY'];

function YakuCard({ info }: { info: YakuInfo }) {
  const { t } = useI18n();
  const ex = DEX_EXAMPLES[info.id];
  const hanText = info.yakuman
    ? t(info.yakuman === 2 ? 'dex.doubleYakuman' : 'dex.yakuman')
    : t('dex.han', { n: info.han });
  const openText =
    info.openHan === null
      ? t('dex.closedOnly')
      : !info.yakuman && info.openHan !== info.han
        ? t('dex.openHan', { n: info.openHan })
        : null;
  const ctx = [ex.ctx?.tsumo ? t('dex.tsumo') : t('dex.ron')];
  if (ex.ctx?.riichi) ctx.push(t('dex.riichi'));
  return (
    <article className="yaku-card">
      <header>
        <h3>{t(`yaku.${info.id}.name` as MessageKey)}</h3>
        <span className="yaku-han">{hanText}</span>
        {LESSON_YAKU.includes(info.id) && <span className="badge">{t('dex.lesson')}</span>}
      </header>
      {openText && <p className="yaku-open">{openText}</p>}
      <p>{t(`yaku.${info.id}.desc` as MessageKey)}</p>
      <div className="yaku-example">
        <span className="yaku-example-tiles">
          {sortTiles(parseTiles(ex.hand)).map((tile, i) => (
            <Tile key={i} tile={tile} width="var(--dex-tile)" />
          ))}
          <span className="win-tile">
            <Tile tile={parseTiles(ex.win)[0]} width="var(--dex-tile)" mark="correct" />
          </span>
          {(ex.melds ?? []).map((m, i) => (
            <MeldTiles key={i} meld={{ type: m.type, tiles: parseTiles(m.tiles) }} width="var(--dex-tile)" />
          ))}
        </span>
        <span className="muted yaku-ctx">{ctx.join(' · ')}</span>
      </div>
    </article>
  );
}

export function YakuDexScreen({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const [group, setGroup] = useState<Group>('g1');
  return (
    <main className="screen screen-wide">
      <ScreenHeader title={t('dex.title')} onBack={onBack} />
      <p className="muted">{t('dex.intro')}</p>
      <div className="segmented dex-tabs" role="tablist">
        {GROUPS.map((g) => (
          <button key={g} role="tab" aria-selected={group === g} className={group === g ? 'active' : ''} onClick={() => setGroup(g)}>
            {t(`dex.${g}`)}
          </button>
        ))}
      </div>
      <div className="yaku-list">
        {YAKU_LIST.filter((y) => groupOf(y) === group).map((y) => (
          <YakuCard key={y.id} info={y} />
        ))}
      </div>
    </main>
  );
}
