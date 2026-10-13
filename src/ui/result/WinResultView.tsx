import { useEffect } from 'react';
import type { WinResult } from '../../engine/score';
import { play } from '../sound';
import type { Tile as TileCode } from '../../engine/tile';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import { Tile } from '../tile/Tile';

type Props = {
  result: WinResult;
  tsumo: boolean;
  /** 和了牌を除いた手の内（並べ替え済み）と和了牌 */
  hand: TileCode[];
  winTile: TileCode;
};

/** 和了画面。役が 1 つずつ現れる（雀魂の演出を参考に、CSS のアニメーションで） */
export function WinResultView({ result, tsumo, hand, winTile }: Props) {
  const { t } = useI18n();
  // 和了の音と、役が 1 つずつ出るたびの音
  useEffect(() => {
    play('win');
    const n = result.yaku.length + (result.dora ? 1 : 0) + (result.aka ? 1 : 0) + (result.ura ? 1 : 0);
    const ids = Array.from({ length: n }, (_, i) => setTimeout(() => play('tick'), 900 + 350 * i));
    return () => ids.forEach(clearTimeout);
  }, [result]);
  const rows: { label: string; value: string }[] = result.yaku.map((y) => ({
    label: t(`yaku.${y.id}.name` as MessageKey),
    value: result.yakuman > 0 ? '' : t('result.han', { n: y.han }),
  }));
  if (result.dora) rows.push({ label: t('result.dora'), value: t('result.han', { n: result.dora }) });
  if (result.aka) rows.push({ label: t('result.aka'), value: t('result.han', { n: result.aka }) });
  if (result.ura) rows.push({ label: t('result.ura'), value: t('result.han', { n: result.ura }) });

  const limit =
    result.yakuman > 1
      ? t('result.multiYakuman', { n: result.yakuman })
      : result.limit
        ? t(`result.${result.limit}` as MessageKey)
        : '';
  const p = result.payment;
  const payText =
    p.kind === 'ron'
      ? t('result.payRon', { n: p.total.toLocaleString('de-DE') })
      : p.kind === 'tsumoChild'
        ? t('result.payTsumoChild', { d: p.dealer.toLocaleString('de-DE'), c: p.child.toLocaleString('de-DE') })
        : t('result.payTsumoDealer', { e: p.each.toLocaleString('de-DE') });

  return (
    <section className="win-result" aria-live="polite">
      <div className="win-kind">{tsumo ? t('result.tsumo') : t('result.ron')}</div>
      <div className="win-hand">
        {hand.map((tile, i) => (
          <Tile key={i} tile={tile} width="var(--group-tile)" />
        ))}
        <span className="win-tile">
          <Tile tile={winTile} width="var(--group-tile)" mark="correct" />
        </span>
      </div>
      <ul className="yaku-rows">
        {rows.map((r, i) => (
          <li key={i} style={{ animationDelay: `${0.35 * i}s` }}>
            <span>{r.label}</span>
            <span>{r.value}</span>
          </li>
        ))}
      </ul>
      <div className="win-total" style={{ animationDelay: `${0.35 * rows.length}s` }}>
        <span>
          {result.yakuman === 0 && `${t('result.han', { n: result.han })} · ${t('result.fu', { n: result.fu })}`}
          {limit && <strong> {limit}</strong>}
        </span>
        <span className="win-points">{t('result.points', { n: result.basePoints.toLocaleString('de-DE') })}</span>
      </div>
      <p className="win-pay" style={{ animationDelay: `${0.35 * rows.length + 0.2}s` }}>
        {payText}
      </p>
      <p className="muted win-note">{t('result.note')}</p>
    </section>
  );
}
