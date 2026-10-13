import { memo, type ReactNode } from 'react';
import { isRed, rankOf, suitOf, type Tile } from '../../engine/tile';

/*
 * 牌の絵柄はすべて自作。座標は牌の表面 60×80 を基準にする。
 * 表面の下に厚み（6）を描く。横向きは表面を反時計回りに 90° 回す。
 */
const W = 60;
const H = 80;
const T = 6;

const C = {
  face: '#f8f4e8',
  faceEdge: '#d9d1bb',
  body: '#c9a24a',
  back: '#2f7d5b',
  backEdge: '#1f5a41',
  ink: '#1f2a44',
  red: '#c0281f',
  green: '#1f7a45',
  blue: '#1d4f91',
};

const SERIF = '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';
const KANJI_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const HONOR_CHAR = ['', '東', '南', '西', '北', '', '發', '中'];

// --- 筒子 ---
type Dot = [number, number, string];
function pinLayout(rank: number): { dots: Dot[]; r: number } {
  const g = C.green;
  const b = C.blue;
  const r = C.red;
  switch (rank) {
    case 2:
      return { dots: [[30, 22, g], [30, 58, b]], r: 11.5 };
    case 3:
      return { dots: [[15, 17, b], [30, 40, r], [45, 63, g]], r: 9 };
    case 4:
      return { dots: [[17, 23, b], [43, 23, g], [17, 57, g], [43, 57, b]], r: 10.5 };
    case 5:
      return { dots: [[16, 18, b], [44, 18, g], [30, 40, r], [16, 62, g], [44, 62, b]], r: 9 };
    case 6:
      return {
        dots: [[18, 15, g], [42, 15, g], [18, 43, r], [42, 43, r], [18, 65, r], [42, 65, r]],
        r: 8.5,
      };
    case 7:
      return {
        dots: [[13, 11, g], [30, 18, g], [47, 25, g], [18, 46, r], [42, 46, r], [18, 67, r], [42, 67, r]],
        r: 7.8,
      };
    case 8:
      return {
        dots: [[18, 12, b], [42, 12, b], [18, 31, b], [42, 31, b], [18, 50, b], [42, 50, b], [18, 69, b], [42, 69, b]],
        r: 8,
      };
    case 9:
      return {
        dots: [
          [14, 16, b], [30, 16, b], [46, 16, b],
          [14, 40, r], [30, 40, r], [46, 40, r],
          [14, 64, g], [30, 64, g], [46, 64, g],
        ],
        r: 7.6,
      };
    default:
      return { dots: [], r: 0 };
  }
}

function PinDot({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={color} />
      <circle cx={x} cy={y} r={r * 0.68} fill={C.face} />
      <circle cx={x} cy={y} r={r * 0.4} fill={color} />
    </g>
  );
}

function Pin({ rank, red }: { rank: number; red: boolean }) {
  if (rank === 1) {
    return (
      <g>
        <circle cx={30} cy={40} r={22} fill={C.blue} />
        <circle cx={30} cy={40} r={17.5} fill={C.face} />
        <circle cx={30} cy={40} r={14} fill={C.green} />
        <circle cx={30} cy={40} r={9} fill={C.face} />
        <circle cx={30} cy={40} r={6} fill={C.red} />
      </g>
    );
  }
  const { dots, r } = pinLayout(rank);
  return (
    <g>
      {dots.map(([x, y, color], i) => (
        <PinDot key={i} x={x} y={y} r={r} color={red ? C.red : color} />
      ))}
    </g>
  );
}

// --- 索子 ---
type Stick = [number, number, string];
function souLayout(rank: number): { sticks: Stick[]; h: number } {
  const g = C.green;
  const r = C.red;
  switch (rank) {
    case 2:
      return { sticks: [[30, 22, g], [30, 58, g]], h: 26 };
    case 3:
      return { sticks: [[30, 22, g], [18, 58, g], [42, 58, g]], h: 26 };
    case 4:
      return { sticks: [[18, 22, g], [42, 22, g], [18, 58, g], [42, 58, g]], h: 26 };
    case 5:
      return { sticks: [[16, 22, g], [44, 22, g], [30, 40, r], [16, 58, g], [44, 58, g]], h: 26 };
    case 6:
      return { sticks: [[14, 22, g], [30, 22, g], [46, 22, g], [14, 58, g], [30, 58, g], [46, 58, g]], h: 26 };
    case 7:
      return {
        sticks: [[30, 14, r], [14, 40, g], [30, 40, g], [46, 40, g], [14, 66, g], [30, 66, g], [46, 66, g]],
        h: 20,
      };
    case 8:
      return {
        sticks: [[12, 22, g], [24, 22, g], [36, 22, g], [48, 22, g], [12, 58, g], [24, 58, g], [36, 58, g], [48, 58, g]],
        h: 26,
      };
    case 9:
      return {
        sticks: [
          [14, 16, g], [30, 16, r], [46, 16, g],
          [14, 40, g], [30, 40, r], [46, 40, g],
          [14, 64, g], [30, 64, r], [46, 64, g],
        ],
        h: 20,
      };
    default:
      return { sticks: [], h: 0 };
  }
}

function SouStick({ x, y, h, color }: { x: number; y: number; h: number; color: string }) {
  const w = 6.5;
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={3} fill={color} />
      <line x1={x - w / 2} x2={x + w / 2} y1={y} y2={y} stroke={C.face} strokeWidth={1.4} />
      <line x1={x} x2={x} y1={y - h / 2 + 2.5} y2={y + h / 2 - 2.5} stroke={C.face} strokeWidth={0.9} opacity={0.6} />
    </g>
  );
}

function Sou({ rank, red }: { rank: number; red: boolean }) {
  if (rank === 1) {
    // 一索：独自の意匠（1 本の太い竹と葉）
    return (
      <g>
        <path d="M30 26 C 18 20, 12 26, 9 34 C 18 33, 24 31, 30 30 Z" fill={C.green} />
        <path d="M30 40 C 42 34, 48 40, 51 48 C 42 47, 36 45, 30 44 Z" fill={C.green} />
        <rect x={24} y={10} width={12} height={62} rx={6} fill={C.green} />
        {[26, 42, 58].map((y) => (
          <line key={y} x1={24} x2={36} y1={y} y2={y} stroke={C.face} strokeWidth={2} />
        ))}
        <circle cx={30} cy={10} r={5} fill={C.red} />
      </g>
    );
  }
  const { sticks, h } = souLayout(rank);
  return (
    <g>
      {sticks.map(([x, y, color], i) => (
        <SouStick key={i} x={x} y={y} h={h} color={red ? C.red : color} />
      ))}
    </g>
  );
}

// --- 萬子 ---
function Man({ rank, red }: { rank: number; red: boolean }) {
  return (
    <g fontFamily={SERIF} textAnchor="middle" fontWeight={600}>
      <text x={30} y={34} fontSize={28} fill={red ? C.red : C.ink}>
        {KANJI_NUM[rank]}
      </text>
      <text x={30} y={70} fontSize={29} fill={C.red}>
        萬
      </text>
    </g>
  );
}

// --- 字牌 ---
function Honor({ rank }: { rank: number }) {
  if (rank === 5) {
    // 白：枠だけ
    return <rect x={13} y={22} width={34} height={46} rx={4} fill="none" stroke={C.blue} strokeWidth={2.5} />;
  }
  const color = rank === 6 ? C.green : rank === 7 ? C.red : C.ink;
  return (
    <text x={30} y={55} fontSize={40} fontFamily={SERIF} fontWeight={700} textAnchor="middle" fill={color}>
      {HONOR_CHAR[rank]}
    </text>
  );
}

function Face({ tile }: { tile: Tile }) {
  const rank = rankOf(tile);
  const red = isRed(tile);
  switch (suitOf(tile)) {
    case 'm':
      return <Man rank={rank} red={red} />;
    case 'p':
      return <Pin rank={rank} red={red} />;
    case 's':
      return <Sou rank={rank} red={red} />;
    case 'z':
      return <Honor rank={rank} />;
  }
}

function HintBadge({ text }: { text: string }) {
  // 補助表示：牌の左上に、読みやすい大きさで
  const w = 7 + text.length * 8.6;
  return (
    <g>
      <rect x={1} y={1} width={w} height={18} rx={4} fill="#ffffff" stroke="#9a937f" strokeWidth={0.8} />
      <text
        x={1 + w / 2}
        y={15}
        fontSize={15}
        fontWeight={800}
        textAnchor="middle"
        fill="#111"
        fontFamily="-apple-system, Helvetica, sans-serif"
      >
        {text}
      </text>
    </g>
  );
}

type Props = {
  tile: Tile | null; // null = 裏向き
  sideways?: boolean;
  hint?: string;
};

/** 牌 1 枚の SVG。大きさは親要素の幅で決まる */
export const TileSvg = memo(function TileSvg({ tile, sideways = false, hint }: Props) {
  const fw = sideways ? H : W;
  const fh = sideways ? W : H;
  let content: ReactNode = null;
  if (tile) {
    const inner = (
      <>
        <Face tile={tile} />
        {hint && <HintBadge text={hint} />}
      </>
    );
    content = sideways ? <g transform={`translate(0 ${W}) rotate(-90)`}>{inner}</g> : inner;
  }
  return (
    <svg viewBox={`0 0 ${fw} ${fh + T}`} className="tile-svg" aria-hidden="true">
      <rect x={0} y={0} width={fw} height={fh + T} rx={6} fill={tile ? C.body : C.backEdge} />
      <rect
        x={0.5}
        y={0.5}
        width={fw - 1}
        height={fh - 0.5}
        rx={5.5}
        fill={tile ? C.face : C.back}
        stroke={tile ? C.faceEdge : C.backEdge}
        strokeWidth={1}
      />
      {content}
    </svg>
  );
});
