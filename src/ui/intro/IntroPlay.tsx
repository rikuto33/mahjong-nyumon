import { useEffect, useState } from 'react';
import { parseTiles } from '../../engine/tile';
import { apply, responseOptions, type HandState, type Seat } from '../../game/hand';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import { aiTsumogiri, INTRO_STEPS, introHand, passAll } from '../../tutorial/intro';
import { useApp } from '../AppContext';
import { GameTable, type HandTarget } from '../game/GameTable';
import { HandResultView } from '../game/HandResultView';

const AI_DELAY_MS = 1100;

/** 段階 1：本物の卓で 1 局を台本どおりに体験する */
export function IntroPlay({ onDone, onNext }: { onDone: () => void; onNext: () => void }) {
  const { t } = useI18n();
  const { markCleared } = useApp();
  const [hand, setHand] = useState<HandState>(() => introHand());
  const [index, setIndex] = useState(0);
  const [lifted, setLifted] = useState<HandTarget | null>(null);
  const [showResult, setShowResult] = useState(false);
  // 説明付きの他家の手番は、説明を読んで「次へ」を押してから進める
  const [ackIndex, setAckIndex] = useState(-1);
  const step = INTRO_STEPS[index];
  const next = INTRO_STEPS[index + 1];

  // 直近の説明（id のない自動ステップでは前の説明を出し続ける）
  let textId: string | undefined;
  for (let i = index; i >= 0; i--) {
    const s = INTRO_STEPS[i];
    if ('id' in s && s.id) {
      textId = s.id;
      break;
    }
  }

  // 同じ説明が 2 回目以降なら止めない
  const firstTime =
    step?.kind === 'ai' && !!step.id && !INTRO_STEPS.slice(0, index).some((x) => 'id' in x && x.id === step.id);
  const waitingForAck = firstTime && ackIndex !== index;

  useEffect(() => {
    if (!step || step.kind !== 'ai' || waitingForAck) return;
    const id = setTimeout(() => {
      let h = aiTsumogiri(hand);
      if (!(next && (next.kind === 'call' || next.kind === 'ron'))) h = passAll(h);
      setHand(h);
      setIndex(index + 1);
    }, AI_DELAY_MS);
    return () => clearTimeout(id);
  }, [step, next, hand, index, waitingForAck]);

  const target = step?.kind === 'discard' ? parseTiles(step.tile)[0] : null;
  const tileOf = (x: HandTarget) => (x === 'drawn' ? hand.players[0].drawn : hand.players[0].hand[x]);
  const canTap = (x: HandTarget) => hand.phase === 'turn' && hand.turn === 0 && tileOf(x) === target;
  const onTap = (x: HandTarget) => {
    if (lifted !== x) {
      setLifted(x);
      return;
    }
    setLifted(null);
    setHand(passAll(apply(hand, { type: 'discard', tile: target! })));
    setIndex(index + 1);
  };

  const respondAs = (action: 'pon' | 'chi' | 'ron') => {
    const from = hand.lastDiscard!.from;
    const others = ([1, 2, 3] as Seat[]).filter((s) => s !== from);
    const mine =
      action === 'ron'
        ? ({ seat: 0, action: 'ron' } as const)
        : { seat: 0 as const, action: 'call' as const, option: responseOptions(hand, 0).calls.find((c) => c.type === action)! };
    const h = apply(hand, { type: 'respond', responses: [mine, ...others.map((seat) => ({ seat, action: 'pass' as const }))] });
    setHand(h);
    if (action === 'ron') setShowResult(true);
    else setIndex(index + 1);
  };

  const finish = () => {
    markCleared('intro');
    onNext();
  };

  const buttons = [];
  if (step?.kind === 'call') {
    for (const c of ['chi', 'pon'] as const) {
      if (responseOptions(hand, 0).calls.some((o) => o.type === c)) {
        buttons.push(
          <button key={c} className="btn action-btn" disabled={c !== step.call} onClick={() => respondAs(c)}>
            {t(`actions.${c}`)}
          </button>,
        );
      }
    }
    buttons.push(
      <button key="skip" className="btn action-btn" disabled>
        {t('actions.skip')}
      </button>,
    );
  }
  if (step?.kind === 'ron') {
    buttons.push(
      <button key="ron" className="btn action-btn action-ron" onClick={() => respondAs('ron')}>
        {t('actions.ron')}
      </button>,
    );
  }

  const isLast = index === INTRO_STEPS.length - 1;
  const overlay = (
    <div className="tour-box intro-box" aria-live="polite">
      {textId &&
        t(`intro.${textId}` as MessageKey)
          .split('\n')
          .map((p, i) => <p key={i}>{p}</p>)}
      {waitingForAck && (
        <div className="button-row">
          <button className="btn btn-primary" onClick={() => setAckIndex(index)}>
            {t('intro.next')}
          </button>
        </div>
      )}
      {step?.kind === 'info' && (
        <div className="button-row">
          <button className="btn btn-primary" onClick={isLast ? finish : () => setIndex(index + 1)}>
            {t('intro.next')}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <GameTable
        hand={hand}
        lifted={lifted}
        canTap={canTap}
        onTap={onTap}
        actions={buttons}
        overlay={overlay}
        topLeft={
          <button className="btn btn-small" onClick={onDone}>
            {t('common.back')}
          </button>
        }
      />
      {showResult && hand.result && (
        <HandResultView
          hand={hand}
          onNext={() => {
            setShowResult(false);
            setIndex(index + 1);
          }}
        />
      )}
    </>
  );
}
