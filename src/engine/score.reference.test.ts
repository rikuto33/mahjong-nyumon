import { describe, expect, it } from 'vitest';
import fixtures from './fixtures/python-score.json';
import { scoreWin, type CalledMeld, type WinInput } from './score';
import { parseTiles, type Tile } from './tile';
import type { YakuId } from './yaku';

/** Python mahjong の役クラス名 → このエンジンの役 ID */
const PY_YAKU: Record<string, YakuId> = {
  Riichi: 'riichi',
  Ippatsu: 'ippatsu',
  Tsumo: 'menzenTsumo',
  Tanyao: 'tanyao',
  Pinfu: 'pinfu',
  Iipeiko: 'iipeikou',
  Haku: 'haku',
  Hatsu: 'hatsu',
  Chun: 'chun',
  YakuhaiOfPlace: 'seatWind',
  YakuhaiOfRound: 'roundWind',
  Haitei: 'haitei',
  Houtei: 'houtei',
  Rinshan: 'rinshan',
  Chankan: 'chankan',
  DaburuRiichi: 'doubleRiichi',
  Chiitoitsu: 'chiitoitsu',
  Chantai: 'chanta',
  Ittsu: 'ittsu',
  Sanshoku: 'sanshokuDoujun',
  SanshokuDoukou: 'sanshokuDoukou',
  SanKantsu: 'sankantsu',
  Toitoi: 'toitoi',
  Sanankou: 'sanankou',
  Shosangen: 'shousangen',
  Honroto: 'honroutou',
  Ryanpeikou: 'ryanpeikou',
  Junchan: 'junchan',
  Honitsu: 'honitsu',
  Chinitsu: 'chinitsu',
  Tenhou: 'tenhou',
  Chiihou: 'chiihou',
  Daisangen: 'daisangen',
  Suuankou: 'suuankou',
  SuuankouTanki: 'suuankouTanki',
  Tsuuiisou: 'tsuuiisou',
  Ryuuiisou: 'ryuuiisou',
  Chinroutou: 'chinroutou',
  KokushiMusou: 'kokushi',
  DaburuKokushiMusou: 'kokushi13',
  Shousuushii: 'shousuushi',
  DaiSuushii: 'daisuushi',
  Suukantsu: 'suukantsu',
  ChuurenPoutou: 'chuuren',
  DaburuChuurenPoutou: 'junseiChuuren',
};

type Case = {
  hand: string;
  melds: { type: CalledMeld['type']; tiles: string }[];
  winTile: string;
  tsumo: boolean;
  seatWind: 1 | 2 | 3 | 4;
  roundWind: 1 | 2 | 3 | 4;
  riichi: boolean;
  doubleRiichi: boolean;
  ippatsu: boolean;
  lastTile: boolean;
  rinshan: boolean;
  chankan: boolean;
  tenhou: boolean;
  chiihou: boolean;
  doraIndicators: string[];
  uraIndicators: string[];
  honba: number;
  riichiSticks: number;
  expected:
    | { error: string }
    | { han: number; fu: number; yaku: string[]; main: number; additional: number; total: number };
};

function toInput(c: Case): WinInput {
  return {
    hand: parseTiles(c.hand),
    melds: c.melds.map((m) => ({ type: m.type, tiles: parseTiles(m.tiles) })),
    winTile: parseTiles(c.winTile)[0] as Tile,
    tsumo: c.tsumo,
    seatWind: c.seatWind,
    roundWind: c.roundWind,
    riichi: c.riichi,
    doubleRiichi: c.doubleRiichi,
    ippatsu: c.ippatsu,
    lastTile: c.lastTile,
    rinshan: c.rinshan,
    chankan: c.chankan,
    tenhou: c.tenhou,
    chiihou: c.chiihou,
    doraIndicators: c.doraIndicators.map((t) => parseTiles(t)[0]),
    uraIndicators: c.uraIndicators.map((t) => parseTiles(t)[0]),
    honba: c.honba,
    riichiSticks: c.riichiSticks,
  };
}

const cases = fixtures.cases as Case[];

describe(`Python mahjong (${fixtures.source}) との照合：役・符・点数 ${cases.length} 手`, () => {
  it('全ケース一致', () => {
    const failures: string[] = [];
    for (const c of cases) {
      const r = scoreWin(toInput(c));
      const e = c.expected;
      const label = `${c.hand} +[${c.melds.map((m) => `${m.type}:${m.tiles}`).join(' ')}] win=${c.winTile} ${c.tsumo ? 'tsumo' : 'ron'} seat=${c.seatWind} round=${c.roundWind}`;
      if ('error' in e) {
        if (r !== null) failures.push(`${label}: expected ${e.error}, got ${JSON.stringify(r.yaku)}`);
        continue;
      }
      if (!r) {
        failures.push(`${label}: expected ${e.yaku.join(',')} got null`);
        continue;
      }
      const pyYaku = e.yaku
        .filter((n) => n !== 'Dora' && n !== 'AkaDora')
        .map((n) => PY_YAKU[n] ?? `?${n}`)
        .sort();
      const ours = r.yaku.map((y) => y.id).sort();
      const han = r.yakuman > 0 ? r.yakuman * 13 : r.han;
      const main =
        r.payment.kind === 'ron' ? r.basePoints : r.payment.kind === 'tsumoDealer' ? r.basePoints / 3 : r.payment.dealer - 100 * c.honba;
      const additional =
        r.payment.kind === 'ron' ? 0 : r.payment.kind === 'tsumoDealer' ? r.basePoints / 3 : r.payment.child - 100 * c.honba;
      const problems: string[] = [];
      if (JSON.stringify(pyYaku) !== JSON.stringify(ours)) problems.push(`yaku py=${pyYaku} ours=${ours}`);
      if (han !== e.han) problems.push(`han py=${e.han} ours=${han}`);
      if (r.yakuman === 0 && r.fu !== e.fu) problems.push(`fu py=${e.fu} ours=${r.fu}`);
      if (main !== e.main || additional !== e.additional) problems.push(`cost py=${e.main}/${e.additional} ours=${main}/${additional}`);
      if (r.gain !== e.total) problems.push(`total py=${e.total} ours=${r.gain}`);
      if (problems.length) failures.push(`${label}: ${problems.join('; ')}`);
    }
    expect(failures.slice(0, 15).join('\n'), `${failures.length} 件の不一致`).toBe('');
  });
});
