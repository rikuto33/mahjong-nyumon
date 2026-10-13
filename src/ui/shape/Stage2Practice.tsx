import { useState } from 'react';
import { parseTiles, sortTiles } from '../../engine/tile';
import { useI18n } from '../../i18n/I18nContext';
import { dissolveGroup, findTip, isSolved, makeGroup, newBoard, type Board } from '../../tutorial/groupBoard';
import { PUZZLES_TO_CLEAR, STAGE2_PUZZLES } from '../../tutorial/shape';
import { useApp } from '../AppContext';
import { ScreenHeader } from '../ScreenHeader';
import { GroupBoardView } from './GroupBoardView';

type Message = { kind: 'error' | 'info' | 'success'; text: string } | null;

function pickPuzzles(): string[] {
  const a = [...STAGE2_PUZZLES];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, PUZZLES_TO_CLEAR);
}

const boardOf = (p: string) => newBoard(sortTiles(parseTiles(p)));

export function Stage2Practice({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const { markCleared } = useApp();
  const [started, setStarted] = useState(false);
  const [puzzles, setPuzzles] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [board, setBoard] = useState<Board>(() => newBoard([]));
  const [selected, setSelected] = useState<number[]>([]);
  const [tipIds, setTipIds] = useState<number[]>([]);
  const [message, setMessage] = useState<Message>(null);

  const solved = started && isSolved(board);
  const allDone = solved && index === puzzles.length - 1;

  const load = (ps: string[], i: number) => {
    setPuzzles(ps);
    setIndex(i);
    setBoard(boardOf(ps[i]));
    setSelected([]);
    setTipIds([]);
    setMessage(null);
  };

  const start = () => {
    load(pickPuzzles(), 0);
    setStarted(true);
  };

  const change = (b: Board, msg: Message) => {
    setBoard(b);
    setSelected([]);
    setTipIds([]);
    setMessage(msg);
    if (isSolved(b)) {
      setMessage({ kind: 'success', text: t('shape.puzzle.solved') });
      if (index === puzzles.length - 1) markCleared('shape');
    }
  };

  const toggle = (id: number) => {
    if (selected.includes(id)) setSelected(selected.filter((x) => x !== id));
    else if (selected.length < 3) setSelected([...selected, id]);
    setMessage(null);
  };

  const form = () => {
    const r = makeGroup(board, selected);
    if (r.ok) change(r.board, null);
    else setMessage({ kind: 'error', text: t(`shape.puzzle.err.${r.reason}`) });
  };

  const tip = () => {
    const ids = findTip(board);
    setSelected([]);
    if (ids) {
      setTipIds(ids);
      setMessage({ kind: 'info', text: t('shape.puzzle.tipShown') });
    } else {
      setTipIds([]);
      setMessage({ kind: 'info', text: t('shape.puzzle.tipStuck') });
    }
  };

  if (!started) {
    return (
      <main className="screen">
        <ScreenHeader title={t('stageMenu.practice')} onBack={onDone} />
        <p className="prompt">{t('shape.puzzle.intro', { total: PUZZLES_TO_CLEAR })}</p>
        <button className="btn btn-primary" onClick={start}>
          {t('shape.puzzle.start')}
        </button>
      </main>
    );
  }

  return (
    <main className="screen screen-wide">
      <ScreenHeader title={t('shape.puzzle.task', { n: index + 1, total: puzzles.length })} onBack={onDone} />
      <div className="instruction">
        <p className="muted">{t('shape.puzzle.instruction')}</p>
        {board.groups.length > 0 && !solved && <p className="muted">{t('shape.puzzle.ungroupHint')}</p>}
      </div>
      <GroupBoardView
        board={board}
        selected={selected}
        tipIds={tipIds}
        onTapTile={toggle}
        onTapGroup={solved ? undefined : (i) => change(dissolveGroup(board, i), null)}
      />
      <div className={`feedback ${message ? `msg-${message.kind}` : ''}`} aria-live="polite">
        {message && <p>{message.text}</p>}
        {allDone && <p>{t('shape.puzzle.passed')}</p>}
      </div>
      <div className="bottom-actions">
        {solved ? (
          allDone ? (
            <button className="btn btn-primary" onClick={onDone}>
              {t('common.done')}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => load(puzzles, index + 1)}>
              {t('shape.puzzle.nextTask')}
            </button>
          )
        ) : (
          <>
            <button className="btn" onClick={tip}>
              {t('shape.puzzle.tip')}
            </button>
            <button
              className="btn"
              disabled={board.groups.length === 0}
              onClick={() => change(newBoard(board.tiles), null)}
            >
              {t('shape.puzzle.resetGroups')}
            </button>
            <button className="btn btn-primary" disabled={selected.length < 2} onClick={form}>
              {t('shape.puzzle.makeGroup')}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
