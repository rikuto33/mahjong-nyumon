"""
Python の mahjong パッケージで役・符・点数の期待値を作り、
src/engine/fixtures/python-score.json に書き出す。

雀魂 段位戦ルールに合わせた設定：喰いタンあり・赤ドラあり・ダブル役満あり・
数え役満あり・切り上げ満貫なし・喰い平和形ロン 30 符・平和ツモ 20 符・人和なし。

  venv/bin/python tools/gen_score_fixtures.py
"""
import json
import random
from pathlib import Path

from mahjong.hand_calculating.hand import HandCalculator
from mahjong.hand_calculating.hand_config import HandConfig, OptionalRules
from mahjong.meld import Meld

SEED = 20261014
N = 2500
rng = random.Random(SEED)
calc = HandCalculator()
RULES = OptionalRules(
    has_open_tanyao=True,
    has_aka_dora=True,
    has_double_yakuman=True,
    kiriage=False,
    fu_for_open_pinfu=True,
    fu_for_pinfu_tsumo=False,
    renhou_as_yakuman=False,
)
SUITS = "mpsz"
RED_ID = {4: 16, 13: 52, 22: 88}  # 5m 5p 5s の赤


def tile_str(kind, red=False):
    s = kind // 9
    return ("0" if red else str(kind % 9 + 1)) + SUITS[s]


# ---------- 手の生成 ----------
def pick_kind(style):
    if style == "honor":
        return rng.choice(range(27, 34)) if rng.random() < 0.6 else rng.randrange(27)
    if style == "terminal":
        return rng.choice([0, 8, 9, 17, 18, 26] + list(range(27, 34)))
    if style == "one_suit":
        return STYLE_SUIT * 9 + rng.randrange(9) if rng.random() < 0.85 else rng.randrange(27, 34)
    if style == "pure_suit":
        return STYLE_SUIT * 9 + rng.randrange(9)
    return rng.randrange(34)


def make_group(style):
    r = rng.random()
    if r < 0.55:
        for _ in range(20):
            k = pick_kind(style)
            if style == "terminal" and k < 27:
                k = (k // 9) * 9 + rng.choice([0, 6])
            if k < 27 and k % 9 <= 6:
                return ("shuntsu", k)
    k = pick_kind(style)
    return ("kantsu" if r > 0.94 else "koutsu", k)


def group_kinds(g):
    t, k = g
    return [k, k + 1, k + 2] if t == "shuntsu" else [k] * (4 if t == "kantsu" else 3)


def gen_regular(style):
    while True:
        groups = [make_group(style) for _ in range(4)]
        pair = pick_kind(style)
        counts = [0] * 34
        for g in groups:
            for k in group_kinds(g):
                counts[k] += 1
        counts[pair] += 2
        if max(counts) <= 4:
            return groups, pair, counts


def gen_chiitoitsu():
    kinds = rng.sample(range(34), 7)
    return kinds


def assign_reds(kind_list):
    """kind のリスト → (kind, red) のリスト。5 が 4 枚なら 1 枚は必ず赤"""
    out = [(k, False) for k in kind_list]
    for k5 in RED_ID:
        idx = [i for i, (k, _) in enumerate(out) if k == k5]
        if idx and (len(idx) == 4 or rng.random() < 0.4):
            i = rng.choice(idx)
            out[i] = (k5, True)
    return out


class Ids:
    def __init__(self):
        self.used = set()

    def get(self, kind, red):
        if red:
            i = RED_ID[kind]
            assert i not in self.used
            self.used.add(i)
            return i
        for i in range(kind * 4, kind * 4 + 4):
            if i in self.used or (kind in RED_ID and i == RED_ID[kind]):
                continue
            self.used.add(i)
            return i
        raise ValueError("no id")


def build_case():
    global STYLE_SUIT
    STYLE_SUIT = rng.randrange(3)
    style = rng.choice(["any", "any", "any", "honor", "terminal", "one_suit", "pure_suit"])
    special = rng.random()
    melds = []
    if special < 0.08:
        kinds = gen_chiitoitsu()
        concealed = assign_reds([k for k in kinds for _ in range(2)])
    elif special < 0.11:
        th = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33]
        concealed = assign_reds(th + [rng.choice(th)])
    elif special < 0.14:
        s = rng.randrange(3)
        base = [s * 9 + r for r in [0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 8]]
        concealed = assign_reds(base + [s * 9 + rng.randrange(9)])
    else:
        groups, pair, _ = gen_regular(style)
        open_hand = rng.random() < 0.4
        concealed_kinds = [pair, pair]
        for g in groups:
            t, k = g
            ks = group_kinds(g)
            if t == "kantsu":
                melds.append(("ankan" if rng.random() < 0.5 else rng.choice(["minkan", "kakan"]), ks))
            elif open_hand and rng.random() < 0.5:
                melds.append(("chi" if t == "shuntsu" else "pon", ks))
            else:
                concealed_kinds += ks
        all_list = assign_reds(concealed_kinds + [k for _, ks in melds for k in ks])
        concealed = all_list[: len(concealed_kinds)]
        rest = all_list[len(concealed_kinds):]
        new_melds = []
        for t, ks in melds:
            new_melds.append((t, rest[: len(ks)]))
            rest = rest[len(ks):]
        melds = new_melds

    ids = Ids()
    concealed_ids = [ids.get(k, r) for k, r in concealed]
    meld_objs = []
    meld_out = []
    meld_ids_all = []
    for t, tiles in melds:
        tid = [ids.get(k, r) for k, r in tiles]
        meld_ids_all += tid
        if t == "chi":
            m = Meld(Meld.CHI, tid, opened=True)
        elif t == "pon":
            m = Meld(Meld.PON, tid, opened=True)
        elif t == "kakan":
            m = Meld(Meld.SHOUMINKAN, tid, opened=True)
        else:
            m = Meld(Meld.KAN, tid, opened=(t == "minkan"))
        meld_objs.append(m)
        meld_out.append({"type": t, "tiles": "".join(tile_str(k, r) for k, r in tiles)})

    menzen = all(t == "ankan" for t, _ in melds)
    has_kan = any(t in ("ankan", "minkan", "kakan") for t, _ in melds)
    wi = rng.randrange(len(concealed))
    win_kind, win_red = concealed[wi]
    tsumo = rng.random() < 0.5
    seat = rng.randint(1, 4)
    rnd = rng.randint(1, 2)
    riichi = menzen and rng.random() < 0.45
    double_riichi = riichi and rng.random() < 0.08
    ippatsu = riichi and rng.random() < 0.2
    last = rng.random() < 0.05
    rinshan = tsumo and has_kan and rng.random() < 0.3
    chankan = (not tsumo) and (not last) and rng.random() < 0.03
    tenhou = tsumo and menzen and not melds and seat == 1 and rng.random() < 0.02
    chiihou = tsumo and menzen and not melds and seat != 1 and rng.random() < 0.02
    if tenhou or chiihou:
        riichi = double_riichi = ippatsu = False
    n_ind = 1 + sum(1 for t, _ in melds if t in ("ankan", "minkan", "kakan"))

    def random_indicators():
        out = []
        for _ in range(n_ind):
            k = rng.randrange(34)
            red = k in RED_ID and rng.random() < 0.2
            out.append((k, red))
        return out

    dora_ind = random_indicators()
    ura_ind = random_indicators() if riichi else []
    honba = rng.randint(0, 3)
    sticks = rng.randint(0, 2)

    # python 側のドラ表示牌 id（手牌と重複しない必要はない：表示牌の id は判定に kind しか使われない）
    def ind_ids(lst):
        return [k * 4 + (0 if not (k in RED_ID and r) else 0) for k, r in lst]

    config = HandConfig(
        is_tsumo=tsumo,
        is_riichi=riichi or double_riichi,
        is_daburu_riichi=double_riichi,
        is_ippatsu=ippatsu,
        is_haitei=last and tsumo and not rinshan,
        is_houtei=last and not tsumo,
        is_rinshan=rinshan,
        is_chankan=chankan,
        is_tenhou=tenhou,
        is_chiihou=chiihou,
        player_wind=27 + seat - 1,
        round_wind=27 + rnd - 1,
        kyoutaku_number=sticks,
        tsumi_number=honba,
        options=RULES,
    )
    all_ids = concealed_ids + meld_ids_all
    res = calc.estimate_hand_value(
        all_ids,
        concealed_ids[wi],
        melds=meld_objs or None,
        dora_indicators=ind_ids(dora_ind) + ind_ids(ura_ind),
        config=config,
    )
    case = {
        "hand": "".join(tile_str(k, r) for k, r in concealed),
        "melds": meld_out,
        "winTile": tile_str(win_kind, win_red),
        "tsumo": tsumo,
        "seatWind": seat,
        "roundWind": rnd,
        "riichi": riichi and not double_riichi,
        "doubleRiichi": double_riichi,
        "ippatsu": ippatsu,
        "lastTile": last and not rinshan,
        "rinshan": rinshan,
        "chankan": chankan,
        "tenhou": tenhou,
        "chiihou": chiihou,
        "doraIndicators": [tile_str(k, r) for k, r in dora_ind],
        "uraIndicators": [tile_str(k, r) for k, r in ura_ind],
        "honba": honba,
        "riichiSticks": sticks,
    }
    if res.error:
        case["expected"] = {"error": res.error}
    else:
        case["expected"] = {
            "han": res.han,
            "fu": res.fu,
            "yaku": sorted(type(y).__name__ for y in res.yaku),
            "doraHan": sum(y.han_closed if True else 0 for y in res.yaku if type(y).__name__ == "Dora"),
            "akaHan": sum(y.han_closed for y in res.yaku if type(y).__name__ == "AkaDora"),
            "main": res.cost["main"],
            "additional": res.cost["additional"],
            "total": res.cost["total"],
            "yakuLevel": res.cost.get("yaku_level", ""),
        }
    return case


cases = [build_case() for _ in range(N)]
out = Path(__file__).resolve().parent.parent / "src/engine/fixtures/python-score.json"
out.write_text(json.dumps({"source": "mahjong==1.4.0", "seed": SEED, "cases": cases}, ensure_ascii=False, separators=(",", ":")))
errs = {}
for c in cases:
    e = c["expected"].get("error")
    errs[e] = errs.get(e, 0) + 1
print(f"wrote {len(cases)} cases", errs)
from collections import Counter
cnt = Counter(y for c in cases if "yaku" in c["expected"] for y in c["expected"]["yaku"])
print(sorted(cnt.items(), key=lambda x: -x[1]))
