import { describe, expect, it } from 'vitest';
import { doraFromIndicator, scoreWin, type CalledMeld, type WinInput } from './score';
import { kindOf, parseTiles, type Tile } from './tile';

const T = (s: string) => parseTiles(s);
const t1 = (s: string) => parseTiles(s)[0] as Tile;

/** hand13 は和了牌を除いた手の内（副露があれば 3 枚ずつ少ない） */
function win(hand13: string, winTile: string, opts: Partial<WinInput> = {}) {
  return scoreWin({
    hand: [...T(hand13), t1(winTile)],
    winTile: t1(winTile),
    tsumo: false,
    seatWind: 2,
    roundWind: 1,
    ...opts,
  });
}
const ids = (r: ReturnType<typeof scoreWin>) => r?.yaku.map((y) => y.id).sort();
const meld = (type: CalledMeld['type'], tiles: string): CalledMeld => ({ type, tiles: T(tiles) });

describe('ドラ表示牌', () => {
  it('次の牌がドラ（9→1、北→東、中→白）', () => {
    expect(doraFromIndicator('9m')).toBe(kindOf('1m'));
    expect(doraFromIndicator('0p')).toBe(kindOf('6p'));
    expect(doraFromIndicator('4z')).toBe(kindOf('1z'));
    expect(doraFromIndicator('7z')).toBe(kindOf('5z'));
    expect(doraFromIndicator('5z')).toBe(kindOf('6z'));
  });
});

describe('1 翻縛り', () => {
  it('役がなくドラだけでは和了れない', () => {
    const r = win('234m567p66p78s', '9s', { melds: [meld('chi', '345s')], doraIndicators: [t1('5p')] });
    expect(r).toBeNull();
  });
});

describe('符（雀魂ルール）', () => {
  it('連風牌の雀頭は 4 符', () => {
    // 東場の東家：東の雀頭 = 場風 2 ＋ 自風 2
    const tsumo = win('234m567p345s11z78s', '9s', { seatWind: 1, roundWind: 1, tsumo: true, riichi: true });
    expect(ids(tsumo)).toEqual(['menzenTsumo', 'riichi']); // 雀頭が役牌なので平和なし
    expect(tsumo?.fu).toBe(30); // 20 + ツモ 2 + 雀頭 4 = 26 → 30
    const ron = win('234m567p345s11z78s', '9s', { seatWind: 1, roundWind: 1, riichi: true });
    expect(ron?.fu).toBe(40); // 20 + 門前ロン 10 + 雀頭 4 = 34 → 40
  });

  it('平和ツモ 20 符・平和ロン 30 符', () => {
    expect(win('234m567p345s55p78s', '9s', { tsumo: true })?.fu).toBe(20);
    expect(win('234m567p345s55p78s', '9s', { riichi: true })?.fu).toBe(30);
  });

  it('喰い平和形のロンは 30 符', () => {
    const r = win('234m567p66p67s', '8s', { melds: [meld('chi', '345s')] });
    expect(ids(r)).toEqual(['tanyao']);
    expect(r?.fu).toBe(30);
    expect(r?.payment).toEqual({ kind: 'ron', total: 1000 });
  });

  it('七対子は 25 符・2 翻', () => {
    const r = win('1122m3344p5566s7z', '7z');
    expect(r?.form).toBe('chiitoitsu');
    expect(r?.fu).toBe(25);
    expect(ids(r)).toEqual(['chiitoitsu']);
    expect(r?.payment).toEqual({ kind: 'ron', total: 1600 });
  });

  it('嶺上開花のツモも 2 符', () => {
    const r = win('234m567p55p78s', '9s', { melds: [meld('ankan', '1111z')], tsumo: true, rinshan: true });
    // 20 + ツモ 2 + 暗槓（字牌）32 = 54 → 60 符。役：門前ツモ・嶺上開花・場風（東）
    expect(r?.fu).toBe(60);
    expect(ids(r)).toEqual(['menzenTsumo', 'rinshan', 'roundWind']);
  });
});

describe('点数', () => {
  it('子 2 翻 30 符ロン 2,000、親は本場・供託込み', () => {
    expect(win('234m567p345s55p78s', '9s', { riichi: true })?.payment).toEqual({ kind: 'ron', total: 2000 });
    const r = win('234m567p345s55p78s', '9s', { riichi: true, seatWind: 1, honba: 2, riichiSticks: 1 });
    expect(r?.payment).toEqual({ kind: 'ron', total: 3500 }); // 2900 + 600
    expect(r?.gain).toBe(4500); // ＋供託 1000
  });

  it('子のツモ：親・子の支払い', () => {
    const r = win('234m567p345s55p78s', '9s', { tsumo: true, riichi: true, honba: 1 });
    // 立直・門前ツモ・平和 3 翻 20 符 = 1300/700 ＋ 本場 100 ずつ
    expect(r?.payment).toEqual({ kind: 'tsumoChild', dealer: 1400, child: 800, total: 3000 });
  });

  it('切り上げ満貫なし：子 4 翻 30 符は 7,700', () => {
    const r = win('234m567p345s55p78s', '9s', { riichi: true, doraIndicators: [t1('3m'), t1('6p')] });
    expect(r?.han).toBe(4); // 立直・平和・ドラ 2（4m・7p）
    expect(r?.limit).toBeNull();
    expect(r?.payment).toEqual({ kind: 'ron', total: 7700 });
  });

  it('数え役満（13 翻以上）', () => {
    const k = win('2233445566778p', '8p', { riichi: true, tsumo: true, doraIndicators: [t1('1p')] });
    // 立直1 門前ツモ1 断幺九1 平和1 二盃口3 清一色6 ＋ ドラ2 = 15 翻
    expect(k?.limit).toBe('kazoeYakuman');
    expect(k?.payment).toEqual({ kind: 'tsumoChild', dealer: 16000, child: 8000, total: 32000 });
  });
});

describe('役満', () => {
  it('純正九蓮宝燈はダブル役満', () => {
    const r = win('1112345678999p', '5p', { riichi: true });
    expect(ids(r)).toEqual(['junseiChuuren']);
    expect(r?.payment).toEqual({ kind: 'ron', total: 64000 });
  });

  it('大四喜はダブル役満（四暗刻単騎と複合）', () => {
    const r = win('111222333444z5m', '5m');
    expect(ids(r)).toEqual(['daisuushi', 'suuankouTanki']);
    expect(r?.yakuman).toBe(4);
  });

  it('小四喜＋字一色（ロンで完成した刻子は暗刻にならない）', () => {
    const r = win('11122233344z55z', '5z');
    expect(ids(r)).toEqual(['shousuushi', 'tsuuiisou']);
    expect(r?.yakuman).toBe(2);
  });

  it('緑一色は發なしでも成立', () => {
    expect(ids(win('2222334466688s', '8s'))).toContain('ryuuiisou');
    expect(ids(win('234234666888s6z', '6z'))).toContain('ryuuiisou');
  });

  it('清老頭（＋四暗刻単騎）', () => {
    expect(ids(win('111m999m111p999p1s', '1s'))).toEqual(['chinroutou', 'suuankouTanki']);
  });

  it('字一色の七対子', () => {
    expect(ids(win('1122334455667z', '7z'))).toEqual(['tsuuiisou']);
  });

  it('四槓子', () => {
    const r = win('5z', '5z', {
      melds: [meld('minkan', '1111m'), meld('ankan', '2222p'), meld('minkan', '3333s'), meld('kakan', '4444s')],
      tsumo: true,
    });
    expect(ids(r)).toEqual(['suukantsu']);
  });

  it('国士無双：十三面待ちはダブル役満', () => {
    expect(ids(win('19m19p19s1234567z', '7z'))).toEqual(['kokushi13']);
    expect(ids(win('9m19p19s12345677z', '1m'))).toEqual(['kokushi']);
  });
});

describe('2 翻役', () => {
  it('三色同刻', () => {
    const r = win('333m333p333s567p2z', '2z', { tsumo: true });
    expect(ids(r)).toContain('sanshokuDoukou');
    expect(ids(r)).toContain('sanankou');
  });
});
