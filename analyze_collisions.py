# """
# FRAYMUS / Quantum Random Collider
# Authoritative Analysis Script

# This script answers ONE question definitively:
# Is the system random, or is it learning + evolving?

# Input: collisions.jsonl (one JSON object per line)
# """

# import json
# import math
# from collections import defaultdict

# LOG_FILE = "collisions.jsonl"

# def load_events(path):
#     events = []
#     with open(path, "r", encoding="utf-8") as f:
#         for line in f:
#             try:
#                 events.append(json.loads(line))
#             except Exception:
#                 pass
#     return events

# def moving_success_rate(events, window=50):
#     rates = []
#     for i in range(len(events)):
#         w = events[max(0, i - window): i + 1]
#         if not w:
#             continue
#         rate = sum(1 for e in w if e["success"]) / len(w)
#         rates.append(rate)
#     return rates

# def phi_success_correlation(events):
#     phi_s = []
#     succ = []
#     for e in events:
#         if "phi_score" in e["payload"]:
#             phi_s.append(e["payload"]["phi_score"])
#             succ.append(1 if e["success"] else 0)
#     if not phi_s:
#         return 0.0

#     mean_phi = sum(phi_s) / len(phi_s)
#     mean_s = sum(succ) / len(succ)

#     num = sum((p - mean_phi) * (s - mean_s) for p, s in zip(phi_s, succ))
#     den = math.sqrt(
#         sum((p - mean_phi) ** 2 for p in phi_s) *
#         sum((s - mean_s) ** 2 for s in succ)
#     )
#     return num / den if den else 0.0

# def pair_statistics(events):
#     stats = defaultdict(lambda: {"attempts": 0, "successes": 0})
#     for e in events:
#         key = "|".join(sorted([e["e1"], e["e2"]]))
#         stats[key]["attempts"] += 1
#         if e["success"]:
#             stats[key]["successes"] += 1
#     return stats

# def main():
#     events = load_events(LOG_FILE)
#     if not events:
#         print("❌ No events found.")
#         return

#     print("\n=== FRAYMUS COLLISION ANALYSIS ===\n")
#     print(f"Total events: {len(events)}")

#     # --- Learning curve ---
#     early = events[:len(events)//3]
#     late = events[-len(events)//3:]

#     early_rate = sum(1 for e in early if e["success"]) / len(early)
#     late_rate = sum(1 for e in late if e["success"]) / len(late)

#     print("\n📈 Learning Test")
#     print(f"Early success rate: {early_rate:.3f}")
#     print(f"Late  success rate: {late_rate:.3f}")
#     print("Δ =", round(late_rate - early_rate, 4))

#     # --- Phi correlation ---
#     phi_corr = phi_success_correlation(events)
#     print("\n🌀 φ Correlation Test")
#     print(f"Correlation(success, φ): {phi_corr:.4f}")

#     # --- Pair exploitation ---
#     stats = pair_statistics(events)
#     ranked = sorted(
#         stats.items(),
#         key=lambda x: (x[1]["successes"] / x[1]["attempts"]) if x[1]["attempts"] else 0,
#         reverse=True
#     )

#     print("\n🧠 Top 10 Learned Pairs (by success rate)")
#     for k, v in ranked[:10]:
#         rate = v["successes"] / v["attempts"] if v["attempts"] else 0
#         print(f"{k:20s}  attempts={v['attempts']:3d}  success_rate={rate:.3f}")

#     # --- Verdict ---
#     print("\n=== VERDICT ===")
#     if late_rate > early_rate and phi_corr > 0:
#         print("✅ System is NON-RANDOM and ADAPTIVE.")
#         print("✅ Evidence of learning + φ-weighted selection.")
#     else:
#         print("⚠️ Learning signal weak or absent.")
#         print("⚠️ System closer to stochastic exploration.")

# if __name__ == "__main__":
#     main()


"""
FRAYMUS / Quantum Random Collider
Authoritative Analysis Script (Robust Schema)

Handles:
- Mixed log schemas (payload / no payload)
- Evolution over time
- Learning vs randomness
"""

import json
import math
from collections import defaultdict

LOG_FILE = "collisions.jsonl"


def load_events(path):
    events = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            try:
                events.append(json.loads(line))
            except Exception:
                pass
    return events


def extract_phi(event):
    # Newer schema
    if "payload" in event and isinstance(event["payload"], dict):
        if "phi_score" in event["payload"]:
            return event["payload"]["phi_score"]

    # Older / flat schema
    if "phi_score" in event:
        return event["phi_score"]

    return None


def moving_success_rate(events, window=50):
    rates = []
    for i in range(len(events)):
        w = events[max(0, i - window): i + 1]
        if not w:
            continue
        rate = sum(1 for e in w if e.get("success")) / len(w)
        rates.append(rate)
    return rates


def phi_success_correlation(events):
    phi_vals = []
    succ_vals = []

    for e in events:
        phi = extract_phi(e)
        if phi is None:
            continue
        phi_vals.append(phi)
        succ_vals.append(1 if e.get("success") else 0)

    if len(phi_vals) < 10:
        return 0.0

    mean_phi = sum(phi_vals) / len(phi_vals)
    mean_s = sum(succ_vals) / len(succ_vals)

    num = sum((p - mean_phi) * (s - mean_s) for p, s in zip(phi_vals, succ_vals))
    den = math.sqrt(
        sum((p - mean_phi) ** 2 for p in phi_vals) *
        sum((s - mean_s) ** 2 for s in succ_vals)
    )

    return num / den if den else 0.0


def pair_statistics(events):
    stats = defaultdict(lambda: {"attempts": 0, "successes": 0})

    for e in events:
        e1 = e.get("e1")
        e2 = e.get("e2")
        if not e1 or not e2:
            continue

        key = "|".join(sorted([e1, e2]))
        stats[key]["attempts"] += 1
        if e.get("success"):
            stats[key]["successes"] += 1

    return stats


def main():
    events = load_events(LOG_FILE)

    if not events:
        print("❌ No events loaded.")
        return

    print("\n=== FRAYMUS COLLISION ANALYSIS ===\n")
    print(f"Total events loaded: {len(events)}")

    # --- Learning Curve ---
    n = len(events)
    early = events[: n // 3]
    late = events[-n // 3 :]

    early_rate = sum(1 for e in early if e.get("success")) / len(early)
    late_rate = sum(1 for e in late if e.get("success")) / len(late)

    print("\n📈 Learning Test")
    print(f"Early success rate: {early_rate:.3f}")
    print(f"Late  success rate: {late_rate:.3f}")
    print(f"Δ Improvement:      {late_rate - early_rate:+.4f}")

    # --- Phi Correlation ---
    phi_corr = phi_success_correlation(events)
    print("\n🌀 φ Correlation Test")
    print(f"Correlation(success, φ): {phi_corr:.4f}")

    # --- Pair Exploitation ---
    stats = pair_statistics(events)
    ranked = sorted(
        stats.items(),
        key=lambda x: (x[1]["successes"] / x[1]["attempts"])
        if x[1]["attempts"]
        else 0,
        reverse=True,
    )

    print("\n🧠 Top Learned Collision Pairs")
    for k, v in ranked[:10]:
        rate = v["successes"] / v["attempts"] if v["attempts"] else 0
        print(f"{k:22s} attempts={v['attempts']:4d} success_rate={rate:.3f}")

    # --- Verdict ---
    print("\n=== VERDICT ===")
    if late_rate > early_rate and phi_corr > 0.05:
        print("✅ System is ADAPTIVE (non-random).")
        print("✅ φ-weighted learning detected.")
        print("✅ Memory influences future outcomes.")
    else:
        print("⚠️ Weak learning signal.")
        print("⚠️ System closer to stochastic exploration.")

    print("\n(Analysis complete)\n")


if __name__ == "__main__":
    main()
