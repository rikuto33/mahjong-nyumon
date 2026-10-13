import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { shanten } from '../../engine/shanten';
import { sortTiles, tileOfKind, type Tile as TileCode } from '../../engine/tile';
import { acceptance, waits } from '../../engine/waits';
import { furitenReason } from '../../engine/furiten';
import type { CallOption } from '../../engine/calls';
import { decideResponse, decideTurn, type AiLevel } from '../../game/ai';
import {
  apply,
  handOf,
  responseOptions,
  SEATS,
  turnOptions,
  visibleCounts,
  type HandState,
  type Response,
  type Seat,
} from '../../game/hand';
import { afterHand, newMatch, startMatchHand, type MatchState } from '../../game/match';
import { fullTileSet, shuffled } from '../../game/solo';
import { useI18n } from '../../i18n/I18nContext';
import { useApp } from '../AppContext';
import { Tile } from '../tile/Tile';
import { tileName } from '../tile/tileText';
import { FinalView } from './FinalView';
import { GameTable, type HandTarget } from './GameTable';
import { HandResultView } from './HandResultView';

const AI_TURN_MS = 650;
const AI_RESPONSE_MS = 300;

type Choice = { kind: 'chi'; options: CallOption[] } | { kind: 'kan'; ankan: number[]; kakan: number[] } | null;

function newHand(m: MatchState): HandState {
  return startMatchHand(m, shuffled(fullTileSet()));
}

export function GameScreen({ level, onFinished, onExit }: { level: AiLevel; onFinished: () => void; onExit: () => void }) {
  const { t } = useI18n();
  const { settings } = useApp();
  const [match, setMatch] = useState<MatchState>(() => newMatch(Math.floor(Math.random() * 4) as Seat));
  const [hand, setHand] = useState<HandState>(() => newHand(match));
  const [view, setView] = useState<'play' | 'result' | 'final'>('play');
  const [lifted, setLifted] = useState<HandTarget | null>(null);
  const [riichiMode, setRiichiMode] = useState(false);
  const [choice, setChoice] = useState<Choice>(null);
  const [showTip, setShowTip] = useState(false);
  const [finalMatch, setFinalMatch] = useState<MatchState | null>(null);
  const [southNotice, setSouthNotice] = useState(false);

  const myTurn = hand.phase === 'turn' && hand.turn === 0;
  const turnOpts = useMemo(() => (myTurn ? turnOptions(hand) : null), [hand, myTurn]);
  const responding = hand.phase === 'respond' || hand.phase === 'chankan';
  const from: Seat | null = hand.phase === 'chankan' ? (hand.chankanTile?.from ?? null) : (hand.lastDiscard?.from ?? null);
  const myResp = useMemo(() => (responding && from !== 0 ? responseOptions(hand, 0) : null), [hand, responding, from]);
  const humanMustRespond = !!myResp && (!!myResp.ron || myResp.calls.length > 0);

  // AI の手番・応答を進める
  useEffect(() => {
    if (view !== 'play') return;
    if (hand.phase === 'ended') {
      const id = setTimeout(() => setView('result'), 500);
      return () => clearTimeout(id);
    }
    if (hand.phase === 'turn' && hand.turn !== 0) {
      const id = setTimeout(() => setHand(apply(hand, decideTurn(hand, level))), AI_TURN_MS);
      return () => clearTimeout(id);
    }
    if (responding && !humanMustRespond) {
      const id = setTimeout(() => setHand(apply(hand, { type: 'respond', responses: aiResponses(hand, null) })), AI_RESPONSE_MS);
      return () => clearTimeout(id);
    }
  }, [hand, view, responding, humanMustRespond, level]);

  // 立直後は、和了も暗槓もできなければ自動でツモ切りする（雀魂の自動ツモ切りと同じ）
  useEffect(() => {
    if (view !== 'play' || !myTurn || !turnOpts || !hand.players[0].riichi) return;
    if (turnOpts.tsumo || turnOpts.ankan.length > 0) return;
    const id = setTimeout(() => setHand(apply(hand, { type: 'discard', tile: hand.players[0].drawn! })), AI_TURN_MS);
    return () => clearTimeout(id);
  }, [view, myTurn, turnOpts, hand]);

  useEffect(() => {
    setLifted(null);
    setShowTip(false);
    setChoice(null);
    if (!myTurn) setRiichiMode(false);
  }, [hand, myTurn]);

  function aiResponses(h: HandState, human: Response | null): Response[] {
    const f = h.phase === 'chankan' ? h.chankanTile!.from : h.lastDiscard!.from;
    return SEATS.filter((s) => s !== f).map((s) =>
      s === 0 ? (human ?? { seat: 0, action: 'pass' }) : decideResponse(h, s, level),
    );
  }

  const respond = (human: Response) => setHand(apply(hand, { type: 'respond', responses: aiResponses(hand, human) }));

  // 手牌のタップ（1 回目で浮かせ、2 回目で打牌）
  const tileOf = (target: HandTarget): TileCode | null =>
    target === 'drawn' ? hand.players[0].drawn : (hand.players[0].hand[target] ?? null);
  const canTap = (target: HandTarget) => {
    if (!turnOpts) return false;
    const tile = tileOf(target);
    if (!tile) return false;
    return riichiMode ? turnOpts.riichiDiscards.includes(tile) : turnOpts.discards.includes(tile);
  };
  const onTap = (target: HandTarget) => {
    if (lifted !== target) {
      setLifted(target);
      return;
    }
    const tile = tileOf(target)!;
    setHand(apply(hand, { type: 'discard', tile, riichi: riichiMode }));
    setRiichiMode(false);
  };

  // ヒント
  const tipTiles = useMemo(() => {
    if (!showTip || !myTurn || !turnOpts) return [];
    const all = handOf(hand, 0);
    const melds = hand.players[0].melds.length;
    const vis = visibleCounts(hand, 0);
    const cands = turnOpts.discards.map((tile) => {
      const rest = [...all];
      rest.splice(rest.indexOf(tile), 1);
      return { tile, s: shanten(rest, melds), a: acceptance(rest, melds, vis).count };
    });
    const minS = Math.min(...cands.map((c) => c.s));
    const maxA = Math.max(...cands.filter((c) => c.s === minS).map((c) => c.a));
    return cands.filter((c) => c.s === minS && c.a === maxA).map((c) => c.tile);
  }, [showTip, myTurn, turnOpts, hand]);

  const hintText = useMemo(() => {
    if (!settings.gameHints) return null;
    const p = hand.players[0];
    if (myTurn && turnOpts?.tsumo) return t('game.hint.tsumo');
    if (myResp?.ron) return t('game.hint.ron');
    if (riichiMode) return t('game.riichiMode');
    const melds = p.melds.length;
    // 自分の手番は「一番良い打牌のあと」、それ以外は今の 13 枚で判断
    let base: TileCode[] = p.hand;
    if (myTurn && turnOpts) {
      const all = handOf(hand, 0);
      let best = 99;
      for (const tile of turnOpts.discards) {
        const rest = [...all];
        rest.splice(rest.indexOf(tile), 1);
        const s = shanten(rest, melds);
        if (s < best) {
          best = s;
          base = rest;
        }
      }
    }
    const s = shanten(base, melds);
    if (s === 0) {
      const ws = waits(base, melds);
      const parts = [t('game.hint.tenpai', { list: ws.map((k) => tileName(t, tileOfKind(k))).join(', ') })];
      if (!myTurn && furitenReason(p.hand, melds, { ownDiscards: p.discards, skippedThisTurn: p.skippedThisTurn, skippedAfterRiichi: p.skippedAfterRiichi })) {
        parts.push(t('game.hint.furiten'));
      }
      return parts.join('. ');
    }
    if (s === 1) return t('game.hint.oneAway');
    return t('game.hint.shanten', { n: s });
  }, [settings.gameHints, hand, myTurn, turnOpts, myResp, riichiMode, t]);

  if (view === 'final' && finalMatch) {
    return <FinalView match={finalMatch} onNewGame={restart} onDone={onExit} />;
  }

  function restart() {
    const m = newMatch(Math.floor(Math.random() * 4) as Seat);
    setMatch(m);
    setHand(newHand(m));
    setView('play');
    setFinalMatch(null);
  }

  function nextHand() {
    const m2 = afterHand(match, hand);
    if (m2.finished) {
      setFinalMatch(m2);
      setView('final');
      onFinished();
      return;
    }
    setSouthNotice(match.roundWind === 1 && m2.roundWind === 2);
    setMatch(m2);
    setHand(newHand(m2));
    setView('play');
  }

  // ボタン
  const buttons: ReactNode[] = [];
  if (view === 'play' && choice?.kind === 'chi') {
    buttons.push(<span key="label" className="choice-label">{t('game.chooseChi')}</span>);
    choice.options.forEach((o, i) => {
      buttons.push(
        <button key={`chi${i}`} className="btn action-btn chi-choice" onClick={() => respond({ seat: 0, action: 'call', option: o })}>
          {sortTiles([...o.fromHand, o.called]).map((x, j) => (
            <Tile key={j} tile={x} width="28px" noHint />
          ))}
        </button>,
      );
    });
    buttons.push(<button key="cancel" className="btn" onClick={() => setChoice(null)}>{t('game.cancel')}</button>);
  } else if (view === 'play' && choice?.kind === 'kan') {
    buttons.push(<span key="label" className="choice-label">{t('game.chooseKan')}</span>);
    for (const k of choice.ankan)
      buttons.push(
        <button key={`a${k}`} className="btn action-btn chi-choice" onClick={() => setHand(apply(hand, { type: 'ankan', kind: k }))}>
          <Tile tile={tileOfKind(k)} width="28px" noHint />
        </button>,
      );
    for (const k of choice.kakan)
      buttons.push(
        <button key={`k${k}`} className="btn action-btn chi-choice" onClick={() => setHand(apply(hand, { type: 'kakan', kind: k }))}>
          <Tile tile={tileOfKind(k)} width="28px" noHint />
        </button>,
      );
    buttons.push(<button key="cancel" className="btn" onClick={() => setChoice(null)}>{t('game.cancel')}</button>);
  } else if (view === 'play' && myTurn && turnOpts) {
    if (turnOpts.tsumo)
      buttons.push(<button key="tsumo" className="btn action-btn action-tsumo" onClick={() => setHand(apply(hand, { type: 'tsumo' }))}>{t('actions.tsumo')}</button>);
    if (turnOpts.riichiDiscards.length > 0)
      buttons.push(
        <button key="riichi" className={`btn action-btn action-riichi ${riichiMode ? 'active' : ''}`} onClick={() => { setRiichiMode(!riichiMode); setLifted(null); }}>
          {riichiMode ? t('game.cancel') : t('actions.riichi')}
        </button>,
      );
    if (turnOpts.ankan.length + turnOpts.kakan.length > 0)
      buttons.push(
        <button
          key="kan"
          className="btn action-btn"
          onClick={() =>
            turnOpts.ankan.length + turnOpts.kakan.length === 1
              ? setHand(apply(hand, turnOpts.ankan.length ? { type: 'ankan', kind: turnOpts.ankan[0] } : { type: 'kakan', kind: turnOpts.kakan[0] }))
              : setChoice({ kind: 'kan', ankan: turnOpts.ankan, kakan: turnOpts.kakan })
          }
        >
          {t('actions.kan')}
        </button>,
      );
    if (turnOpts.kyuushu)
      buttons.push(<button key="kyuushu" className="btn action-btn" onClick={() => setHand(apply(hand, { type: 'kyuushu' }))}>{t('game.kyuushu')}</button>);
    if (settings.gameHints && !hand.players[0].riichi)
      buttons.push(<button key="tip" className="btn" disabled={showTip} onClick={() => setShowTip(true)}>{t('game.tip')}</button>);
  } else if (view === 'play' && humanMustRespond && myResp) {
    if (myResp.ron) buttons.push(<button key="ron" className="btn action-btn action-ron" onClick={() => respond({ seat: 0, action: 'ron' })}>{t('actions.ron')}</button>);
    const pon = myResp.calls.find((c) => c.type === 'pon');
    if (pon) buttons.push(<button key="pon" className="btn action-btn" onClick={() => respond({ seat: 0, action: 'call', option: pon })}>{t('actions.pon')}</button>);
    const chis = myResp.calls.filter((c) => c.type === 'chi');
    if (chis.length)
      buttons.push(
        <button key="chi" className="btn action-btn" onClick={() => (chis.length === 1 ? respond({ seat: 0, action: 'call', option: chis[0] }) : setChoice({ kind: 'chi', options: chis }))}>
          {t('actions.chi')}
        </button>,
      );
    const kan = myResp.calls.find((c) => c.type === 'minkan');
    if (kan) buttons.push(<button key="kan" className="btn action-btn" onClick={() => respond({ seat: 0, action: 'call', option: kan })}>{t('actions.kan')}</button>);
    buttons.push(<button key="skip" className="btn action-btn" onClick={() => respond({ seat: 0, action: 'pass' })}>{t('actions.skip')}</button>);
  }

  return (
    <>
      <GameTable
        hand={hand}
        lifted={lifted}
        canTap={canTap}
        onTap={onTap}
        marks={tipTiles}
        actions={buttons}
        hint={
          <>
            {southNotice && hand.roundWind === 2 && hand.roundNumber === 1 && hand.honba === match.honba && <span>{t('game.south')} </span>}
            {hintText}
            {showTip && tipTiles.length > 0 && <span className="muted"> {t('game.hint.tipShown')}</span>}
          </>
        }
        topLeft={
          <button className="btn btn-small" onClick={onExit}>
            {t('common.back')}
          </button>
        }
      />
      {view === 'result' && hand.result && <HandResultView hand={hand} onNext={nextHand} />}
    </>
  );
}

