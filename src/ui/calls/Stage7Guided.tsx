import { useState } from 'react';
import { callOptions, forbiddenAfterCall, toMeld, type CallOption } from '../../engine/calls';
import { kindOf, parseTiles, sortTiles, type Tile as TileCode } from '../../engine/tile';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import { STAGE7_GUIDED } from '../../tutorial/calls';
import { ScreenHeader } from '../ScreenHeader';
import { MeldTiles } from '../tile/MeldTiles';
import { Tile } from '../tile/Tile';

type Phase = 'prompt' | 'discard' | 'after';

export function Stage7Guided({ onDone, onNext }: { onDone: () => void; onNext: () => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>('prompt');
  const [called, setCalled] = useState<CallOption | null>(null);
  const [hand, setHand] = useState<TileCode[]>(() => sortTiles(parseTiles(STAGE7_GUIDED[0].scene.hand)));
  const [lifted, setLifted] = useState<number | null>(null);
  const finished = step >= STAGE7_GUIDED.length;
  const g = STAGE7_GUIDED[step];

  const goNext = () => {
    const n = step + 1;
    setStep(n);
    setPhase('prompt');
    setCalled(null);
    setLifted(null);
    if (n < STAGE7_GUIDED.length) setHand(sortTiles(parseTiles(STAGE7_GUIDED[n].scene.hand)));
  };

  if (finished) {
    return (
      <main className="screen">
        <ScreenHeader title={t('stageMenu.guided')} onBack={onDone} />
        <p className="prompt">{t('calls.guided.finished')}</p>
        <button className="btn btn-primary" onClick={onNext}>
          {t('common.next')}
        </button>
      </main>
    );
  }

  const tile = parseTiles(g.scene.tile)[0];
  const options = callOptions(parseTiles(g.scene.hand), tile, { fromLeft: g.scene.from === 'left' });
  const forbidden = called ? forbiddenAfterCall(called.type, called.fromHand, called.called) : [];
  const target = g.discard ? parseTiles(g.discard)[0] : null;

  const doCall = (o: CallOption) => {
    const rest = [...hand];
    for (const x of o.fromHand) rest.splice(rest.indexOf(x), 1);
    setHand(rest);
    setCalled(o);
    setPhase('discard');
  };

  const tapHand = (i: number) => {
    if (lifted !== i) {
      setLifted(i);
      return;
    }
    setHand(hand.filter((_, j) => j !== i));
    setLifted(null);
    setPhase('after');
  };

  const text = t(`calls.guided.${g.id}.${phase === 'after' ? 'after' : 'prompt'}` as MessageKey);

  return (
    <main className="screen screen-wide">
      <ScreenHeader title={t('stageMenu.guided')} onBack={onDone} />
      <div className="instruction" aria-live="polite">
        {step === 0 && phase === 'prompt' && <p className="muted">{t('calls.guided.intro')}</p>}
        <p className="prompt">{text}</p>
      </div>
      <div className="call-scene">
        {!called && (
          <div className="ron-discard">
            <span className="muted">{t(`scene.from.${g.scene.from}`)}</span>
            <Tile tile={tile} width="var(--choice-tile)" mark="tip" />
          </div>
        )}
        <div className="solo-hand">
          <span className="solo-hand-main">
            {hand.map((x, i) => (
              <Tile
                key={`${i}-${x}`}
                tile={x}
                width="var(--hand-tile)"
                selected={lifted === i}
                mark={phase === 'discard' && forbidden.includes(kindOf(x)) ? 'wrong' : undefined}
                disabled={phase !== 'discard' || x !== target || forbidden.includes(kindOf(x))}
                onTap={() => tapHand(i)}
              />
            ))}
          </span>
          {called && <MeldTiles meld={toMeld(called)} from={g.scene.from} called={called.called} width="var(--hand-tile)" />}
        </div>
      </div>
      <div className="bottom-actions">
        {phase === 'prompt' &&
          options.map((o, i) => (
            <button
              key={i}
              className="btn action-btn"
              disabled={o.type !== g.action}
              onClick={() => doCall(o)}
            >
              {t(`actions.${o.type === 'minkan' ? 'kan' : o.type}`)}
            </button>
          ))}
        {phase === 'prompt' && (
          <button className="btn" disabled={g.action !== 'skip'} onClick={() => setPhase('after')}>
            {t('actions.skip')}
          </button>
        )}
        {phase === 'after' && (
          <button className="btn btn-primary" onClick={goNext}>
            {t('common.next')}
          </button>
        )}
      </div>
    </main>
  );
}
