"""
Python の mahjong パッケージ（https://pypi.org/project/mahjong/）で
向聴数・和了判定・待ちの期待値を作り、src/engine/fixtures/python-mahjong.json に書き出す。

  python3 -m venv venv && venv/bin/pip install mahjong==1.4.0
  venv/bin/python tools/gen_engine_fixtures.py
"""
import json
import random
from pathlib import Path

from mahjong.agari import Agari
from mahjong.shanten import Shanten

SEED = 20261013
N_RANDOM = 600   # 完全ランダム
N_NEAR = 900     # 和了形から 1〜2 枚入れ替えた手（聴牌・和了付近を厚くする）
N_SPECIAL = 150  # 七対子・国士寄りの手

rng = random.Random(SEED)
shanten = Shanten()
agari = Agari()
SUITS = "mpsz"


def to_str(counts):
    out = ""
    for s in range(4):
        digits = "".join(str(r + 1) * counts[s * 9 + r] for r in range(9 if s < 3 else 7))
        if digits:
            out += digits + SUITS[s]
    return out


def wall():
    return [k for k in range(34) for _ in range(4)]


def random_hand(n):
    w = wall()
    rng.shuffle(w)
    c = [0] * 34
    for k in w[:n]:
        c[k] += 1
    return c


def random_complete():
    while True:
        c = [0] * 34
        ok = True
        for _ in range(4):
            if rng.random() < 0.6:
                s = rng.randrange(3)
                r = rng.randrange(7)
                ks = [s * 9 + r + i for i in range(3)]
            else:
                ks = [rng.randrange(34)] * 3
            for k in ks:
                c[k] += 1
        c[rng.randrange(34)] += 2
        if max(c) <= 4:
            return c


def perturb(c, n_swaps):
    c = list(c)
    for _ in range(n_swaps):
        out = rng.choice([k for k in range(34) if c[k] > 0])
        c[out] -= 1
        while True:
            k = rng.randrange(34)
            if c[k] < 4:
                c[k] += 1
                break
    return c


def drop_one(c):
    c = list(c)
    k = rng.choice([k for k in range(34) if c[k] > 0])
    c[k] -= 1
    return c


def special_hand():
    c = [0] * 34
    if rng.random() < 0.5:
        for k in rng.sample(range(34), 7):
            c[k] = 2
    else:
        th = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33]
        for k in th:
            c[k] = 1
        c[rng.choice(th)] += 1
    return perturb(c, rng.randrange(0, 3))


def record(c):
    n = sum(c)
    rec = {
        "hand": to_str(c),
        "regular": shanten.calculate_shanten_for_regular_hand(c),
        "chiitoitsu": shanten.calculate_shanten_for_chiitoitsu_hand(c),
        "kokushi": shanten.calculate_shanten_for_kokushi_hand(c),
    }
    if n == 14:
        rec["agari"] = bool(agari.is_agari(c))
    if n == 13:
        ws = []
        for k in range(34):
            if c[k] >= 4:
                continue
            c[k] += 1
            if agari.is_agari(c):
                ws.append(k)
            c[k] -= 1
        rec["waits"] = ws
    return rec


cases = []
for _ in range(N_RANDOM):
    cases.append(record(random_hand(rng.choice([13, 14]))))
for _ in range(N_NEAR):
    c = perturb(random_complete(), rng.choice([0, 0, 1, 1, 2]))
    if rng.random() < 0.5:
        c = drop_one(c)
    cases.append(record(c))
for _ in range(N_SPECIAL):
    c = special_hand()
    if rng.random() < 0.5:
        c = drop_one(c)
    cases.append(record(c))

out = Path(__file__).resolve().parent.parent / "src/engine/fixtures/python-mahjong.json"
out.write_text(json.dumps({"source": "mahjong==1.4.0", "seed": SEED, "cases": cases}, separators=(",", ":")))
print(f"wrote {len(cases)} cases to {out}")
