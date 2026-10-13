import { useMemo, useState } from 'react';
import { shanten } from '../../engine/shanten';
import { bestDiscards } from '../../engine/waits';
import { discard, fullHand, fullTileSet, isWallEmpty, shuffled, startSolo, tsumoForms, type SoloState } from '../../game/solo';
import { useI18n } from '../../i18n/I18nContext';
import { useApp } from '../AppContext';
import { ScreenHeader } from '../ScreenHeader';
import { Tile } from '../tile/Tile';
import { SoloBoard } from './SoloBoard';
import { play } from '../sound';

export function Stage3Game({ onDone, onNext }: { onDone: () => void; onNext: () => void }) {
  const { t } = useI18n();
  const { settings, markCleared } = useApp();
  const [state, setState] = useState<SoloState | null>(null);
  const [won, setWon] = useState(false);
  const [showTip, setShowTip] = useState(false);

  const forms = state ? tsumoForms(state) : [];
  const s = useMemo(() => (state?.drawn ? shanten(fullHand(state)) : null), [state]);
  const tipTiles = useMemo(
    () => (state?.drawn && showTip ? bestDiscards(fullHand(state)).map((o) => o.tile) : []),
    [state, showTip],
  );

  const start = () => {
    setState(startSolo(shuffled(fullTileSet())));
    setWon(false);
    setShowTip(false);
  };

  if (!state) {
    return (
      <main className="screen">
        <ScreenHeader title={t('stageMenu.practice')} onBack={onDone} />
        <p className="prompt">{t('solo.game.intro')}</p>
        <button className="btn btn-primary" onClick={start}>
          {t('solo.game.start')}
        </button>
      </main>
    );
  }

  if (won) {
    return (
      <main className="screen screen-wide">
        <ScreenHeader title={t('stageMenu.practice')} onBack={onDone} />
        <p className="result-score">{t('solo.game.won', { n: state.draws })}</p>
        {forms.includes('chiitoitsu') && !forms.includes('regular') && <p>{t('solo.game.wonChiitoitsu')}</p>}
        {forms.includes('kokushi') && <p>{t('solo.game.wonKokushi')}</p>}
        <div className="won-hand">
          {fullHand(state).map((tile, i) => (
            <Tile key={i} tile={tile} width="var(--hand-tile)" />
          ))}
        </div>
        <p className="notice notice-success">{t('solo.game.passed')}</p>
        <div className="button-row">
          <button className="btn" onClick={start}>
            {t('solo.game.newGame')}
          </button>
          <button className="btn btn-primary" onClick={onNext}>
            {t('common.next')}
          </button>
        </div>
      </main>
    );
  }

  const hint =
    s === null ? null : s === -1 ? t('solo.game.hintAgari') : s === 0 ? t('solo.game.hintOne') : t('solo.game.hintMany', { n: s + 1 });

  return (
    <main className="screen screen-wide">
      <ScreenHeader title={t('stageMenu.practice')} onBack={onDone} />
      <div className="instruction" aria-live="polite">
        {settings.gameHints && hint && <p className="prompt">{hint}</p>}
        {showTip && tipTiles.length > 0 && <p className="muted">{t('solo.game.tipShown')}</p>}
        {isWallEmpty(state) && <p className="prompt">{t('solo.game.wallEmpty')}</p>}
      </div>
      <SoloBoard
        state={state}
        canDiscard={() => !!state.drawn}
        tipTiles={tipTiles}
        showTsumo={forms.length > 0}
        onDiscard={(d) => {
          setState(discard(state, d));
          setShowTip(false);
        }}
        onTsumo={() => {
          play('win');
          setWon(true);
          markCleared('solo');
        }}
      />
      <div className="bottom-actions">
        {isWallEmpty(state) ? (
          <button className="btn btn-primary" onClick={start}>
            {t('solo.game.newGame')}
          </button>
        ) : (
          settings.gameHints && (
            <button className="btn" disabled={showTip} onClick={() => setShowTip(true)}>
              {t('solo.game.tip')}
            </button>
          )
        )}
      </div>
    </main>
  );
}
