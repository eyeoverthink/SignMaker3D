"""
QUANTUM RANDOM COLLIDER V7.2 (EVOLUTIONARY EDITION)

Features:
- Persistent universe (elements + learning survive restarts)
- Pair-level learning (attempts, successes, stability, phi alignment)
- Phi-biased physics
- Mass-pressure realism (heavy elements harder)
- Exploration vs exploitation (epsilon-greedy)
- META-LEARNING: system adapts its own parameters
- ASCII visualization
- Optional JSONL logging for plotting
"""

import os
import random
import json
import numpy as np
from datetime import datetime
from collections import defaultdict

PHI = 1.618033988749895


# ===============================
# JSON ENCODER
# ===============================
class QuantumJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, set):
            return list(obj)
        if isinstance(obj, (np.float32, np.float64, np.int32, np.int64)):
            return float(obj)
        return super().default(obj)


# ===============================
# CORE ENGINE
# ===============================
class QuantumRandomColliderV7:
    def __init__(self, seed=None, log_path="collisions.jsonl"):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.data_dir = os.path.join(self.base_dir, "data")
        os.makedirs(self.data_dir, exist_ok=True)

        self.log_path = log_path
        self.encoder = QuantumJSONEncoder

        if seed is not None:
            random.seed(seed)
            np.random.seed(seed)

        # -----------------------
        # BASE REALITY
        # -----------------------
        self.base_pool = {
            "H":  {"mass": 1.008,  "stability": 1.0},
            "He": {"mass": 4.003,  "stability": 1.0},
            "Li": {"mass": 6.941,  "stability": 0.95},
            "Be": {"mass": 9.012,  "stability": 0.90},
            "B":  {"mass": 10.811, "stability": 0.85},
            "C":  {"mass": 12.011, "stability": 1.0},
            "N":  {"mass": 14.007, "stability": 1.0},
            "O":  {"mass": 15.999, "stability": 1.0},
            "F":  {"mass": 18.998, "stability": 0.92},
            "Ne": {"mass": 20.180, "stability": 1.0},
            "Na": {"mass": 22.990, "stability": 0.88},
            "Mg": {"mass": 24.305, "stability": 0.91},
            "Al": {"mass": 26.982, "stability": 0.95},
            "Si": {"mass": 28.086, "stability": 0.98},
            "P":  {"mass": 30.974, "stability": 0.94},
            "S":  {"mass": 32.065, "stability": 0.96},
            "Cl": {"mass": 35.453, "stability": 0.93},
            "Ar": {"mass": 39.948, "stability": 1.0},
            "K":  {"mass": 39.098, "stability": 0.85},
            "Ca": {"mass": 40.078, "stability": 0.92},
        }

        # -----------------------
        # MEMORY
        # -----------------------
        self.discovered = {}
        self.pair_stats = {}
        self.recent_pairs = []

        # -----------------------
        # META-LEARNING STATE
        # -----------------------
        self.meta = {
            "total_attempts": 0,
            "total_successes": 0,
            "avg_success_rate": 0.0,
            "avg_stability": 0.0,
            "epsilon": 0.25,
            "phi_weight": 0.25,
            "chaos_min": 0.85,
            "chaos_max": 1.05,
        }

        self.load_state()

    # ===============================
    # PERSISTENCE
    # ===============================
    def load_state(self):
        try:
            with open(os.path.join(self.data_dir, "elements.json"), "r") as f:
                data = json.load(f)
                for k, v in data.items():
                    if k not in self.base_pool:
                        self.discovered[k] = v

            with open(os.path.join(self.data_dir, "pair_stats.json"), "r") as f:
                self.pair_stats = json.load(f)

            with open(os.path.join(self.data_dir, "meta.json"), "r") as f:
                self.meta = json.load(f)
        except Exception:
            pass

    def save_state(self):
        with open(os.path.join(self.data_dir, "elements.json"), "w") as f:
            json.dump({**self.base_pool, **self.discovered}, f, cls=self.encoder)

        with open(os.path.join(self.data_dir, "pair_stats.json"), "w") as f:
            json.dump(self.pair_stats, f, cls=self.encoder)

        with open(os.path.join(self.data_dir, "meta.json"), "w") as f:
            json.dump(self.meta, f, cls=self.encoder)

    # ===============================
    # PHYSICS
    # ===============================
    def get_elem(self, name):
        return self.base_pool.get(name) or self.discovered.get(name)

    def phi_score(self, m1, m2):
        lo, hi = min(m1, m2), max(m1, m2)
        ratio = lo / hi if hi else 0
        return max(0.0, 1.0 - abs(ratio - (1 / PHI)) / 0.25)

    def attempt_collision(self, a, b):
        e1, e2 = self.get_elem(a), self.get_elem(b)
        if not e1 or not e2:
            return False

        total_mass = e1["mass"] + e2["mass"]
        phi = self.phi_score(e1["mass"], e2["mass"])
        base_stability = (e1["stability"] + e2["stability"]) / 2

        chaos = random.uniform(self.meta["chaos_min"], self.meta["chaos_max"])
        mass_penalty = max(0.25, 1.0 - total_mass / 900)
        success_prob = (
            base_stability
            * chaos
            * mass_penalty
            * (1 + self.meta["phi_weight"] * phi)
            * 0.85
        )
        success_prob = min(0.98, max(0.0, success_prob))

        roll = random.random()
        success = roll < success_prob

        key = "|".join(sorted([a, b]))
        ps = self.pair_stats.get(key, {"a": 0, "s": 0, "avg": 0})
        ps["a"] += 1

        if success:
            ps["s"] += 1
            ps["avg"] += (success_prob - ps["avg"]) / ps["s"]
        self.pair_stats[key] = ps

        self.meta["total_attempts"] += 1
        if success:
            self.meta["total_successes"] += 1
            self.meta["avg_stability"] += (
                success_prob - self.meta["avg_stability"]
            ) / self.meta["total_successes"]

        self.meta["avg_success_rate"] = (
            self.meta["total_successes"] / max(1, self.meta["total_attempts"])
        )

        if success:
            name = self.generate_name(a, b)
            if name not in self.discovered:
                self.discovered[name] = {
                    "name": name,
                    "mass": total_mass * 0.99,
                    "stability": success_prob,
                    "parents": [a, b],
                    "phi": phi,
                    "time": datetime.now().isoformat(timespec="seconds"),
                }

        self.log_event(a, b, success, success_prob, phi)
        return success

    # ===============================
    # META-LEARNING
    # ===============================
    def meta_adjust(self):
        rate = self.meta["avg_success_rate"]

        if rate < 0.15:
            self.meta["epsilon"] = min(0.5, self.meta["epsilon"] * 1.05)
            self.meta["chaos_max"] = min(1.15, self.meta["chaos_max"] + 0.01)
        elif rate > 0.30:
            self.meta["epsilon"] = max(0.05, self.meta["epsilon"] * 0.95)
            self.meta["phi_weight"] = min(0.4, self.meta["phi_weight"] + 0.01)

    # ===============================
    # AI SELECTION
    # ===============================
    def select_pair(self):
        elems = list(self.base_pool) + list(self.discovered)

        if random.random() < self.meta["epsilon"] or len(self.pair_stats) < 10:
            return random.sample(elems, 2)

        scored = []
        for k, v in self.pair_stats.items():
            if v["a"] < 3:
                continue
            score = (v["s"] / v["a"]) * 0.7 + v["avg"] * 0.3
            scored.append((score, k))

        if not scored:
            return random.sample(elems, 2)

        scored.sort(reverse=True)
        a, b = random.choice(scored[:20])[1].split("|")
        if random.random() < 0.25:
            b = random.choice(elems)
        return a, b

    # ===============================
    # UTIL
    # ===============================
    def generate_name(self, a, b):
        return (a[: len(a) // 2 + 1] + b[-(len(b) // 2 + 1) :]).capitalize()

    def log_event(self, a, b, success, p, phi):
        if not self.log_path:
            return
        with open(self.log_path, "a") as f:
            f.write(
                json.dumps(
                    {
                        "a": a,
                        "b": b,
                        "success": success,
                        "prob": p,
                        "phi": phi,
                        "total": len(self.base_pool) + len(self.discovered),
                    }
                )
                + "\n"
            )

    def render(self):
        items = sorted(self.discovered.values(), key=lambda x: x["mass"])
        print("\n" + "=" * 95)
        print(f"TOTAL ELEMENTS: {len(self.base_pool) + len(items)}")
        print("=" * 95)
        for d in items[-8:]:
            print(
                f"{d['name']:<20} | {d['mass']:>8.2f} | {d['stability']:.3f} | φ={d['phi']:.3f} | {d['parents']}"
            )

    # ===============================
    # MAIN LOOP
    # ===============================
    def run(self, cycles=500):
        for i in range(cycles):
            a, b = self.select_pair()
            self.attempt_collision(a, b)

            if i % 10 == 0:
                os.system("cls" if os.name == "nt" else "clear")
                self.render()
                self.meta_adjust()
                self.save_state()
                print(
                    f"\nMETA | success={self.meta['avg_success_rate']:.3f} "
                    f"| ε={self.meta['epsilon']:.3f} "
                    f"| φw={self.meta['phi_weight']:.3f}"
                )


# ===============================
# ENTRY POINT
# ===============================
if __name__ == "__main__":
    sim = QuantumRandomColliderV7()
    sim.run(500)
