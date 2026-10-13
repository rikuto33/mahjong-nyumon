import { useState } from 'react';
import { kindOf, parseTiles } from '../../engine/tile';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/translate';
import { makeGroup, newBoard, type Board } from '../../tutorial/groupBoard';
import { STAGE2_GUIDED, STAGE2_GUIDED_HAND } from '../../tutorial/stage2';
import { ScreenHeader } from '../ScreenHeader';
import { GroupBoardView } from './GroupBoardView';

export function Stage2Guided({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [board, setBoard] = useState<Board>(() => newBoard(parseTiles(STAGE2_GUIDED_HAND)));
  const [selected, setSelected] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const [formed, setFormed] = useState(false);

  const finished = step >= STAGE2_GUIDED.length;
  const current = STAGE2_GUIDED[step];
  const target = current ? parseTiles(current.group).map(kindOf) : [];

  // 指示された組の牌だけ、必要な枚数までタップできる
  const remainingNeed = (() => {
    const need = [...target];
    for (const id of selected) need.splice(need.indexOf(kindOf(board.tiles[id])), 1);
    return need;
  })();
  const canTap = (id: number) =>
    !finished && !formed && (selected.includes(id) || remainingNeed.includes(kindOf(board.tiles[id])));
  const ready = !finished && !formed && remainingNeed.length === 0;

  const toggle = (id: number) =>
    setSelected(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const form = () => {
    const r = makeGroup(board, selected);
    if (!r.ok) return;
    setBoard(r.board);
    setSelected([]);
    setFormed(true);
  };

  const key = (part: 'prompt' | 'after') => `stage2.guided.${current.id}.${part}` as MessageKey;

  return (
    <main className="screen screen-wide">
      <ScreenHeader title={t('stageMenu.guided')} onBack={onDone} />
      <div className="instruction" aria-live="polite">
        {finished ? (
          <p className="prompt">{t('stage2.guided.finished')}</p>
        ) : (
          <>
            {step === 0 && !formed && <p className="muted">{t('stage2.guided.intro')}</p>}
            <p className="prompt">{t(key(formed ? 'after' : 'prompt'))}</p>
          </>
        )}
      </div>
      <GroupBoardView board={board} selected={selected} canTap={canTap} onTapTile={toggle} />
      <div className="bottom-actions">
        {finished ? (
          <button className="btn btn-primary" onClick={onDone}>
            {t('common.done')}
          </button>
        ) : formed ? (
          <button
            className="btn btn-primary"
            onClick={() => {
              setStep(step + 1);
              setFormed(false);
            }}
          >
            {t('common.next')}
          </button>
        ) : (
          <button className="btn btn-primary" disabled={!ready} onClick={form}>
            {t('stage2.puzzle.makeGroup')}
          </button>
        )}
      </div>
    </main>
  );
}
