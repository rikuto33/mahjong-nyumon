import { useEffect, useMemo, useState } from 'react';
import { rolesOf } from '../../engine/analyze';
import { tileName } from '../tile/tileText';
import { apply, handOf, responseOptions, type HandState } from '../../game/hand';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import {
  acceptedTiles,
  passAll,
  respondHuman,
  runAiStep,
  scriptHand,
  tileOf,
  type Script,
} from '../../tutorial/script';
import { GameTable, type HandTarget } from '../game/GameTable';
import { HandResultView } from '../game/HandResultView';

const AI_DELAY_MS = 1000;

type Props = {
  script: Script;
  /** 文字列の接頭辞（`${prefix}.${id}`、選ぶ場面は `.prompt` / `.why`） */
  prefix: string;
  /** 手牌の下に組の色を出す（pairs は七対子用） */
  analysis?: 'regular' | 'pairs';
  onFinish: () => void;
  onBack: () => void;
};

type Feedback = 'good' | 'ok' | 'wrong' | null;

/** 台本どおりに 1 局を打つ画面。選ぶ場面では自分で打牌を選び、考え方の説明を読む */
export function ScenarioPlay({ script, prefix, analysis, onFinish, onBack }: Props) {
  const { t } = useI18n();
  const steps = script.steps;
  const [hand, setHand] = useState<HandState>(() => scriptHand(script.setup));
  const [index, setIndex] = useState(0);
  const [lifted, setLifted] = useState<HandTarget | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [ackIndex, setAckIndex] = useState(-1);
  const [feedback, setFeedback] = useState<Feedback>(null);
  // 「こちらが良い」と示した牌（打牌後も説明に残すため、答えた時点で覚えておく）
  const [betterTiles, setBetterTiles] = useState<string[]>([]);
  const [chosenDone, setChosenDone] = useState(false);
  const [riichiArmed, setRiichiArmed] = useState(false);
  const step = steps[index];
  const next = steps[index + 1];
  const k = (s: string) => `${prefix}.${s}` as MessageKey;

  const firstTime = step?.kind === 'ai' && !!step.id && !steps.slice(0, index).some((x) => 'id' in x && x.id === step.id);
  const waitingForAck = firstTime && ackIndex !== index;

  const advance = () => {
    setIndex((i) => i + 1);
    setFeedback(null);
    setChosenDone(false);
    setLifted(null);
    setRiichiArmed(false);
  };

  // 他家のツモ切り
  useEffect(() => {
    if (!step || step.kind !== 'ai' || waitingForAck) return;
    const id = setTimeout(() => {
      setHand(runAiStep(hand, step, next));
      advance();
    }, AI_DELAY_MS);
    return () => clearTimeout(id);
  }, [step, next, hand, waitingForAck]);

  // 直近の説明（id のない自動ステップでは前の説明を出し続ける）
  let textStep = step;
  for (let i = index; i >= 0; i--) {
    const s = steps[i];
    if ('id' in s && s.id) {
      textStep = s;
      break;
    }
  }

  const myTurn = hand.phase === 'turn' && hand.turn === 0;
  // 正解の牌（同じくらい良い牌はすべて正解）
  const accepted = useMemo(
    () =>
      myTurn && (step?.kind === 'choose' || step?.kind === 'riichi')
        ? acceptedTiles(hand, step.accept)
        : step?.kind === 'discard'
          ? [tileOf(step.tile)]
          : step?.kind === 'tsumogiri' && hand.players[0].drawn
            ? [hand.players[0].drawn]
            : [],
    [hand, step, myTurn],
  );
  const tileAt = (x: HandTarget) => (x === 'drawn' ? hand.players[0].drawn : hand.players[0].hand[x]);

  const canTap = (x: HandTarget) => {
    if (!myTurn || !step) return false;
    const tile = tileAt(x)!;
    if (step.kind === 'choose') return !chosenDone && (feedback === null || accepted.includes(tile));
    if (step.kind === 'riichi') return riichiArmed && !chosenDone && (feedback === null || accepted.includes(tile));
    if (step.kind === 'tsumogiri') return x === 'drawn';
    return step.kind === 'discard' && accepted.includes(tile);
  };

  const discard = (tile: NonNullable<ReturnType<typeof tileAt>>, riichi = false) =>
    setHand(passAll(apply(hand, { type: 'discard', tile, riichi })));

  const onTap = (x: HandTarget) => {
    if (lifted !== x) {
      setLifted(x);
      return;
    }
    setLifted(null);
    const tile = tileAt(x)!;
    if (step.kind === 'choose' || step.kind === 'riichi') {
      if (feedback === null && !accepted.includes(tile)) {
        setFeedback(step.ok?.some((s) => tileOf(s) === tile) ? 'ok' : 'wrong');
        setBetterTiles([...new Set(accepted.map((x) => tileName(t, x)))]);
        return;
      }
      if (feedback === null) setFeedback('good');
      discard(tile, step.kind === 'riichi');
      setChosenDone(true);
      return;
    }
    discard(tile);
    advance();
  };

  const respond = (action: 'pon' | 'chi' | 'ron' | 'pass') => {
    setHand(respondHuman(hand, action));
    if (action === 'ron') setShowResult(true);
    else advance();
  };

  const roles = useMemo(() => {
    if (!analysis) return undefined;
    const tiles = handOf(hand, 0);
    return rolesOf(tiles, hand.players[0].melds.length, analysis);
  }, [hand, analysis]);

  const buttons = [];
  if (step?.kind === 'call' || step?.kind === 'pass') {
    for (const c of ['chi', 'pon'] as const) {
      if (responseOptions(hand, 0).calls.some((o) => o.type === c)) {
        buttons.push(
          <button key={c} className="btn action-btn" disabled={step.kind === 'pass' || c !== step.call} onClick={() => respond(c)}>
            {t(`actions.${c}`)}
          </button>,
        );
      }
    }
    buttons.push(
      <button key="skip" className="btn action-btn" disabled={step.kind !== 'pass'} onClick={() => respond('pass')}>
        {t('actions.skip')}
      </button>,
    );
  }
  if (step?.kind === 'ron')
    buttons.push(
      <button key="ron" className="btn action-btn action-ron" onClick={() => respond('ron')}>
        {t('actions.ron')}
      </button>,
    );
  if (step?.kind === 'tsumo')
    buttons.push(
      <button
        key="tsumo"
        className="btn action-btn action-tsumo"
        onClick={() => {
          setHand(apply(hand, { type: 'tsumo' }));
          setShowResult(true);
        }}
      >
        {t('actions.tsumo')}
      </button>,
    );
  if (step?.kind === 'riichi' && !riichiArmed && myTurn)
    buttons.push(
      <button key="riichi" className="btn action-btn action-riichi" onClick={() => setRiichiArmed(true)}>
        {t('actions.riichi')}
      </button>,
    );

  const isLast = index === steps.length - 1;
  let body: string;
  if (step?.kind === 'choose' || step?.kind === 'riichi') body = feedback ? t(k(`${step.id}.why`)) : t(k(`${step.id}.prompt`));
  else body = textStep && 'id' in textStep && textStep.id ? t(k(textStep.id)) : '';

  const overlay = (
    <div className="tour-box intro-box" aria-live="polite">
      {(step?.kind === 'choose' || step?.kind === 'riichi') && feedback && (
        <p className={feedback === 'wrong' ? 'ng strong' : 'ok strong'}>
          {feedback === 'good'
            ? t('scenario.good')
            : t(feedback === 'ok' ? 'scenario.ok' : 'scenario.wrong', {
                tile: betterTiles.join(t('scenario.or')),
              })}
        </p>
      )}
      {body.split('\n').map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      {analysis && <p className="legend">{t(analysis === 'pairs' ? 'scenario.legendPairs' : 'scenario.legend')}</p>}
      {(waitingForAck || step?.kind === 'info' || ((step?.kind === 'choose' || step?.kind === 'riichi') && chosenDone)) && (
        <div className="button-row">
          <button
            className="btn btn-primary"
            onClick={() => {
              if (waitingForAck) setAckIndex(index);
              else if (isLast) onFinish();
              else advance();
            }}
          >
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
        roles={roles}
        topLeft={
          <button className="btn btn-small" onClick={onBack}>
            {t('common.back')}
          </button>
        }
      />
      {showResult && hand.result && (
        <HandResultView
          hand={hand}
          onNext={() => {
            setShowResult(false);
            advance();
          }}
        />
      )}
    </>
  );
}
