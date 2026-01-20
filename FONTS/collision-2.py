"""
QUANTUM RANDOM COLLIDER V7.1 (STANDALONE)
- Actual learning via pair statistics (attempts/successes/avg stability)
- Uses golden ratio (phi) preference in physics probability
- Epsilon-greedy selection (explore vs exploit)
- Optional log file output for plotting/debug
"""

import os
import random
import json
import numpy as np
from datetime import datetime
from collections import defaultdict

PHI = 1.618033988749895


class QuantumJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, set):
            return list(obj)
        if isinstance(obj, (np.int64, np.int32, np.float64, np.float32)):
            return float(obj)
        return json.JSONEncoder.default(self, obj)


class QuantumRandomColliderV7:
    def __init__(self, seed=None, allow_self_collision=False, log_path=None):
        # 1) STORAGE
        self.data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
        os.makedirs(self.data_dir, exist_ok=True)
        self.json_encoder = QuantumJSONEncoder

        # 2) BASE REALITY
        self.base_pool = {
            "H":  {"mass": 1.008,  "name": "H",  "stability": 1.0},
            "He": {"mass": 4.003,  "name": "He", "stability": 1.0},
            "Li": {"mass": 6.941,  "name": "Li", "stability": 0.95},
            "Be": {"mass": 9.012,  "name": "Be", "stability": 0.90},
            "B":  {"mass": 10.811, "name": "B",  "stability": 0.85},
            "C":  {"mass": 12.011, "name": "C",  "stability": 1.0},
            "N":  {"mass": 14.007, "name": "N",  "stability": 1.0},
            "O":  {"mass": 15.999, "name": "O",  "stability": 1.0},
            "F":  {"mass": 18.998, "name": "F",  "stability": 0.92},
            "Ne": {"mass": 20.180, "name": "Ne", "stability": 1.0},
            "Na": {"mass": 22.990, "name": "Na", "stability": 0.88},
            "Mg": {"mass": 24.305, "name": "Mg", "stability": 0.91},
            "Al": {"mass": 26.982, "name": "Al", "stability": 0.95},
            "Si": {"mass": 28.086, "name": "Si", "stability": 0.98},
            "P":  {"mass": 30.974, "name": "P",  "stability": 0.94},
            "S":  {"mass": 32.065, "name": "S",  "stability": 0.96},
            "Cl": {"mass": 35.453, "name": "Cl", "stability": 0.93},
            "Ar": {"mass": 39.948, "name": "Ar", "stability": 1.0},
            "K":  {"mass": 39.098, "name": "K",  "stability": 0.85},
            "Ca": {"mass": 40.078, "name": "Ca", "stability": 0.92},
        }

        # 3) MEMORY
        self.discovered_pool = {}

        # pair_stats key is "A|B" sorted for symmetry
        # value = {"attempts": int, "successes": int, "avg_stability": float, "avg_phi": float}
        self.pair_stats = {}

        # Track recent collisions to discourage repeating the exact same pair
        self.recent_pairs = []

        self.allow_self_collision = allow_self_collision
        self.log_path = log_path

        if seed is not None:
            random.seed(seed)
            np.random.seed(seed)

        self.load_data()

    # --------------------------
    # DATA MANAGEMENT
    # --------------------------
    def _pair_key(self, a, b):
        x, y = sorted([a, b])
        return f"{x}|{y}"

    def load_data(self):
        try:
            ps_file = os.path.join(self.data_dir, "pair_stats.json")
            if os.path.exists(ps_file):
                with open(ps_file, "r") as f:
                    self.pair_stats = json.load(f)

            d_file = os.path.join(self.data_dir, "discovered_elements.json")
            if os.path.exists(d_file):
                data = json.load(f)
                for k, v in data.items():
                    if k not in self.base_pool:
                        self.discovered_pool[k] = v
        except Exception as e:
            print(f"Note: Starting fresh (No save data found). {e}")

    def save_data(self):
        with open(os.path.join(self.data_dir, "pair_stats.json"), "w") as f:
            json.dump(self.pair_stats, f, cls=self.json_encoder)

        all_elements = {**self.base_pool, **self.discovered_pool}
        with open(os.path.join(self.data_dir, "discovered_elements.json"), "w") as f:
            json.dump(all_elements, f, cls=self.json_encoder)

    # --------------------------
    # PHYSICS / SCORING
    # --------------------------
    def get_element_data(self, name):
        if name in self.base_pool:
            return self.base_pool[name]
        if name in self.discovered_pool:
            return self.discovered_pool[name]
        return None

    def _mass_ratio_small_over_large(self, m1, m2):
        lo, hi = (m1, m2) if m1 <= m2 else (m2, m1)
        return lo / hi if hi > 0 else 0.0

    def _phi_score(self, ratio):
        """
        ratio here is (smaller/larger) in (0,1].
        Perfect phi relationship for smaller/larger is 1/phi (~0.618).
        Score in [0,1], higher is closer to 1/phi.
        """
        target = 1.0 / PHI  # ~0.618
        # Smooth closeness; adjust 0.25 to make preference stronger/weaker
        dist = abs(ratio - target)
        score = max(0.0, 1.0 - (dist / 0.25))
        return score

    def attempt_collision(self, e1_name, e2_name):
        p1 = self.get_element_data(e1_name)
        p2 = self.get_element_data(e2_name)
        if not p1 or not p2:
            return False

        if (not self.allow_self_collision) and (e1_name == e2_name):
            return False

        total_mass = p1["mass"] + p2["mass"]
        ratio = self._mass_ratio_small_over_large(p1["mass"], p2["mass"])
        phi_bonus = self._phi_score(ratio)  # 0..1

        # Base stability: average parents
        base_stability = (p1["stability"] + p2["stability"]) / 2.0

        # Quantum uncertainty
        chaos = random.uniform(0.85, 1.05)

        # Heavy elements are harder (simple penalty curve)
        mass_penalty = max(0.25, 1.0 - (total_mass / 900.0))  # tune 900 as you like

        # Phi preference multiplier: up to +25% if very phi-aligned
        phi_multiplier = 1.0 + 0.25 * phi_bonus

        # Repetition penalty if we just spam the same pair
        key = self._pair_key(e1_name, e2_name)
        recent_hits = self.recent_pairs.count(key)
        repeat_penalty = 0.95 ** recent_hits  # each repeat knocks it down

        # Final success probability (clamped)
        success_prob = base_stability * chaos * mass_penalty * phi_multiplier * repeat_penalty * 0.85
        success_prob = max(0.0, min(0.98, success_prob))  # keep sane

        roll = random.random()
        is_success = roll < success_prob

        # Update recent pairs memory
        self.recent_pairs.append(key)
        if len(self.recent_pairs) > 60:
            self.recent_pairs.pop(0)

        # Update pair stats (learning)
        ps = self.pair_stats.get(key, {"attempts": 0, "successes": 0, "avg_stability": 0.0, "avg_phi": 0.0})
        ps["attempts"] += 1
        # running average updates
        ps["avg_phi"] = ps["avg_phi"] + (phi_bonus - ps["avg_phi"]) / ps["attempts"]

        if is_success:
            ps["successes"] += 1
            ps["avg_stability"] = ps["avg_stability"] + (success_prob - ps["avg_stability"]) / ps["successes"]
        self.pair_stats[key] = ps

        if is_success:
            new_name = self._generate_name(e1_name, e2_name)
            new_element = {
                "name": new_name,
                "mass": total_mass * 0.99,  # binding energy loss
                "stability": float(success_prob),
                "parents": [e1_name, e2_name],
                "phi_score": float(phi_bonus),
                "timestamp": datetime.now().isoformat(timespec="seconds"),
            }
            if new_name not in self.discovered_pool:
                self.discovered_pool[new_name] = new_element

            self._log_event(e1_name, e2_name, True, new_element)
            return True

        self._log_event(e1_name, e2_name, False, {"success_prob": float(success_prob), "phi_score": float(phi_bonus)})
        return False

    def _generate_name(self, n1, n2):
        # same as you, but make collisions symmetric stable-ish and reduce duplicates a bit
        a, b = (n1, n2) if len(n1) <= len(n2) else (n2, n1)
        len1 = len(a) // 2 + 1
        len2 = len(b) // 2 + 1
        return (a[:len1] + b[-len2:]).capitalize()

    # --------------------------
    # AI CONTROLLER (ACTUAL LEARNING)
    # --------------------------
    def select_collision_candidates(self, epsilon=0.25):
        """
        epsilon-greedy:
        - with prob epsilon -> explore random pair
        - else -> exploit top-performing pairs by score
        """
        available = list(self.base_pool.keys()) + list(self.discovered_pool.keys())
        if len(available) < 2:
            return random.choice(available), random.choice(available)

        # Explore
        if random.random() < epsilon or len(self.pair_stats) < 10:
            e1 = random.choice(available)
            e2 = random.choice(available)
            if (not self.allow_self_collision) and e1 == e2:
                e2 = random.choice([x for x in available if x != e1])
            return e1, e2

        # Exploit: score known pairs
        # Score = success_rate * 0.7 + avg_stability * 0.3 + avg_phi*0.1 (small extra)
        scored = []
        for key, ps in self.pair_stats.items():
            attempts = ps.get("attempts", 0)
            if attempts < 3:
                continue
            successes = ps.get("successes", 0)
            success_rate = successes / attempts if attempts else 0.0
            avg_stab = ps.get("avg_stability", 0.0)
            avg_phi = ps.get("avg_phi", 0.0)
            score = (0.7 * success_rate) + (0.3 * avg_stab) + (0.1 * avg_phi)
            scored.append((score, key))

        if not scored:
            # fallback
            e1 = random.choice(available)
            e2 = random.choice(available)
            if (not self.allow_self_collision) and e1 == e2:
                e2 = random.choice([x for x in available if x != e1])
            return e1, e2

        scored.sort(reverse=True, key=lambda x: x[0])

        # pick from top-K to avoid getting stuck (soft exploitation)
        top_k = scored[: min(25, len(scored))]
        _, chosen_key = random.choice(top_k)
        a, b = chosen_key.split("|")

        # slight variation: sometimes swap in a random partner to explore around a good parent
        if random.random() < 0.25:
            a = random.choice([a, b])
            b = random.choice(available)
            if (not self.allow_self_collision) and a == b:
                b = random.choice([x for x in available if x != a])

        return a, b

    # --------------------------
    # LOGGING / UI
    # --------------------------
    def _log_event(self, e1, e2, success, payload):
        if not self.log_path:
            return
        line = {
            "ts": datetime.now().isoformat(timespec="seconds"),
            "e1": e1,
            "e2": e2,
            "success": bool(success),
            "payload": payload,
            "total_elements": int(len(self.base_pool) + len(self.discovered_pool)),
        }
        try:
            with open(self.log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(line, cls=self.json_encoder) + "\n")
        except Exception:
            pass

    def render_table(self):
        new_items = sorted(self.discovered_pool.values(), key=lambda x: x["mass"])
        print("\n" + "=" * 95)
        print(f"||  QUANTUM DISCOVERY LOG | Total Elements: {len(self.base_pool) + len(new_items)}")
        print("=" * 95)
        print(f"| {'NAME':<25} | {'MASS (u)':<12} | {'STABILITY':<10} | {'PHI':<6} | {'PARENTS'}")
        print("-" * 95)

        for d in new_items[-8:]:
            parents = f"{d['parents'][0]} + {d['parents'][1]}"
            phi_s = d.get("phi_score", 0.0)
            print(f"| {d['name']:<25} | {d['mass']:>12.3f} | {d['stability']:>10.3f} | {phi_s:>6.3f} | {parents}")
        print("=" * 95 + "\n")

    def run(self, cycles=500, epsilon=0.25):
        print("INITIALIZING QUANTUM RANDOM COLLIDER V7.1...")
        print(f"Base Reality: {len(self.base_pool)} elements loaded.")
        if self.log_path:
            print(f"Logging to: {self.log_path}")

        for i in range(cycles):
            e1, e2 = self.select_collision_candidates(epsilon=epsilon)
            success = self.attempt_collision(e1, e2)

            if i % 10 == 0:
                os.system("cls" if os.name == "nt" else "clear")
                self.render_table()
                print(f"Collision {i}/{cycles} | Attempting: {e1} + {e2} ... {'SUCCESS' if success else 'FIZZLE'}")
                self.save_data()


if __name__ == "__main__":
    # You can set log_path to something like "collisions.jsonl"
    collider = QuantumRandomColliderV7(seed=None, allow_self_collision=False, log_path="collisions.jsonl")
    collider.run(cycles=500, epsilon=0.25)
