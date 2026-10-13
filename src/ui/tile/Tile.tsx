import type { CSSProperties } from 'react';
import type { Tile as TileCode } from '../../engine/tile';
import { useI18n } from '../../i18n/I18nContext';
import { useApp } from '../AppContext';
import { TileSvg } from './TileSvg';
import { tileHint, tileName } from './tileText';

type Props = {
  tile: TileCode | null;
  /** 牌の幅（CSS の長さ）。横向きのときも縦向き基準の幅を渡す */
  width?: string;
  sideways?: boolean;
  selected?: boolean;
  disabled?: boolean;
  mark?: 'correct' | 'wrong' | 'tip';
  onTap?: () => void;
  /** 補助表示を強制的に消す（設定より優先） */
  noHint?: boolean;
  /** ドラ・赤ドラをきらきら光らせる */
  shine?: boolean;
};

export function Tile({ tile, width, sideways, selected, disabled, mark, onTap, noHint, shine }: Props) {
  const { t } = useI18n();
  const { settings } = useApp();
  const hint = tile && settings.tileHints && !noHint ? tileHint(t, tile) : undefined;
  const label = tile ? tileName(t, tile) : t('tile.faceDown');
  const style = { '--tile-w': width } as CSSProperties;
  const className = [
    'tile',
    sideways ? 'sideways' : '',
    selected ? 'selected' : '',
    mark ? `mark-${mark}` : '',
    onTap ? 'tappable' : '',
    shine && tile ? 'shine' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const svg = <TileSvg tile={tile} sideways={sideways} hint={hint} />;
  if (onTap) {
    return (
      <button type="button" className={className} style={style} onClick={onTap} disabled={disabled} aria-label={label}>
        {svg}
      </button>
    );
  }
  return (
    <span className={className} style={style} role="img" aria-label={label}>
      {svg}
    </span>
  );
}
