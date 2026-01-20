# # #!/usr/bin/env python3
# # """
# # FRAYMUS / V7 Universe Visualizer
# # Plots Mass vs Stability from a growing-element simulation log.

# # Usage:
# #   python plot_island.py path/to/your_log.txt

# # Optional:
# #   python plot_island.py path/to/your_log.txt --save island.png
# # """

# # import argparse
# # import re
# # from pathlib import Path

# # import matplotlib.pyplot as plt


# # # --- Pattern helpers (edit these if your log uses different labels) ---

# # # Pattern A: element blocks like:
# # #   Element: Hf
# # #   Mass: 178.49
# # #   Stability: 0.684
# # RE_ELEM = re.compile(r"^\s*(?:Element|Name)\s*[:=]\s*([A-Za-z0-9_\-]+)\s*$", re.I)
# # RE_MASS = re.compile(r"^\s*Mass\s*[:=]\s*([0-9]*\.?[0-9]+)\s*$", re.I)
# # RE_STAB = re.compile(r"^\s*(?:Stability|Stable|StabilityScore)\s*[:=]\s*([0-9]*\.?[0-9]+)\s*$", re.I)

# # # Pattern B: single-line summaries like:
# # #   Hf | mass=178.49 | stability=0.684
# # RE_INLINE = re.compile(
# #     r"^\s*([A-Za-z0-9_\-]+)\s*\|\s*.*?\bmass\s*[:=]\s*([0-9]*\.?[0-9]+)\b.*?\bstab(?:ility)?\s*[:=]\s*([0-9]*\.?[0-9]+)\b",
# #     re.I,
# # )


# # def parse_log(text: str):
# #     """
# #     Returns list of dicts:
# #       [{"name": str, "mass": float, "stability": float, "idx": int}, ...]
# #     """
# #     elements = []
# #     current = {"name": None, "mass": None, "stability": None}
# #     idx = 0

# #     for line in text.splitlines():
# #         line = line.rstrip("\n")

# #         # Try inline format first
# #         m = RE_INLINE.match(line)
# #         if m:
# #             name = m.group(1)
# #             mass = float(m.group(2))
# #             stab = float(m.group(3))
# #             elements.append({"name": name, "mass": mass, "stability": stab, "idx": idx})
# #             idx += 1
# #             continue

# #         # Block format
# #         m = RE_ELEM.match(line)
# #         if m:
# #             # If we were already collecting one and it's complete, store it
# #             if current["name"] and current["mass"] is not None and current["stability"] is not None:
# #                 elements.append({"name": current["name"], "mass": current["mass"], "stability": current["stability"], "idx": idx})
# #                 idx += 1
# #             current = {"name": m.group(1), "mass": None, "stability": None}
# #             continue

# #         m = RE_MASS.match(line)
# #         if m and current["name"]:
# #             current["mass"] = float(m.group(1))
# #             continue

# #         m = RE_STAB.match(line)
# #         if m and current["name"]:
# #             current["stability"] = float(m.group(1))
# #             continue

# #     # Final flush
# #     if current["name"] and current["mass"] is not None and current["stability"] is not None:
# #         elements.append({"name": current["name"], "mass": current["mass"], "stability": current["stability"], "idx": idx})

# #     return elements


# # def rolling_average(values, window=25):
# #     if window <= 1:
# #         return values[:]
# #     out = []
# #     for i in range(len(values)):
# #         lo = max(0, i - window + 1)
# #         chunk = values[lo:i+1]
# #         out.append(sum(chunk) / len(chunk))
# #     return out


# # def main():
# #     ap = argparse.ArgumentParser()
# #     ap.add_argument("logfile", type=str, help="Path to your simulation log .txt")
# #     ap.add_argument("--save", type=str, default="", help="Optional: save plot to file (png/jpg/etc)")
# #     ap.add_argument("--window", type=int, default=25, help="Rolling average window size")
# #     args = ap.parse_args()

# #     p = Path(args.logfile)
# #     if not p.exists():
# #         raise FileNotFoundError(f"Log file not found: {p}")

# #     text = p.read_text(errors="ignore")
# #     elements = parse_log(text)

# #     if not elements:
# #         raise RuntimeError(
# #             "No elements parsed.\n"
# #             "Your log format probably uses different labels.\n"
# #             "Open this script and adjust RE_ELEM / RE_MASS / RE_STAB / RE_INLINE patterns."
# #         )

# #     masses = [e["mass"] for e in elements]
# #     stabs = [e["stability"] for e in elements]
# #     names = [e["name"] for e in elements]

# #     # --- Plot 1: Mass vs Stability ---
# #     plt.figure()
# #     plt.title("FRAYMUS V7 — Island of Stability (Mass vs Stability)")
# #     plt.xlabel("Mass")
# #     plt.ylabel("Stability")
# #     plt.scatter(masses, stabs)

# #     # Label a few extremes (optional, but helpful)
# #     # highest stability, lowest stability, heaviest mass
# #     hi = max(range(len(elements)), key=lambda i: stabs[i])
# #     lo = min(range(len(elements)), key=lambda i: stabs[i])
# #     hm = max(range(len(elements)), key=lambda i: masses[i])

# #     for i in {hi, lo, hm}:
# #         plt.annotate(names[i], (masses[i], stabs[i]))

# #     plt.grid(True, alpha=0.25)

# #     if args.save:
# #         plt.savefig(args.save, dpi=200, bbox_inches="tight")

# #     # --- Plot 2: Stability over discovery order (shows “decay / difficulty”) ---
# #     plt.figure()
# #     plt.title("FRAYMUS V7 — Stability Over Time (Discovery Order)")
# #     plt.xlabel("Discovery Index")
# #     plt.ylabel("Stability")
# #     x = list(range(len(stabs)))
# #     plt.plot(x, stabs, linewidth=1.0)
# #     plt.plot(x, rolling_average(stabs, window=args.window), linewidth=2.0)
# #     plt.grid(True, alpha=0.25)

# #     if args.save:
# #         stem = Path(args.save)
# #         plt.savefig(stem.with_name(stem.stem + "_stability_over_time" + stem.suffix), dpi=200, bbox_inches="tight")

# #     plt.show()


# # if __name__ == "__main__":
# #     main()
# #!/usr/bin/env python3
# """
# FRAYMUS / V7 Universe Visualizer (Robust)
# - Reads a log file
# - Extracts element name + mass + stability
# - Plots Mass vs Stability + Stability over discovery time

# Usage:
#   python plot_island.py "C:\\path\\to\\log.txt"
#   python plot_island.py log.txt --debug
#   python plot_island.py log.txt --save island.png

# If your log uses different labels, pass them:
#   python plot_island.py log.txt --name Element,Name --mass Mass,AtomicMass --stability Stability,StabilityScore
# """

# import argparse
# import re
# from pathlib import Path
# import matplotlib.pyplot as plt


# def build_kv_regex(keys):
#     # Matches lines like: "Mass: 20.180" or "mass = 20.180"
#     # Returns regex capturing value as group(1)
#     escaped = [re.escape(k.strip()) for k in keys if k.strip()]
#     if not escaped:
#         return None
#     pat = r"^\s*(?:%s)\s*[:=]\s*([+-]?[0-9]*\.?[0-9]+)\s*$" % "|".join(escaped)
#     return re.compile(pat, re.I)


# def build_name_regex(keys):
#     escaped = [re.escape(k.strip()) for k in keys if k.strip()]
#     if not escaped:
#         return None
#     pat = r"^\s*(?:%s)\s*[:=]\s*([A-Za-z0-9_\-]+)\s*$" % "|".join(escaped)
#     return re.compile(pat, re.I)


# # Inline pattern for lines like:
# # "Hf | mass=178.49 | stability=0.684"
# RE_INLINE_GENERIC = re.compile(
#     r"^\s*([A-Za-z0-9_\-]+)\s*\|.*?\b([A-Za-z_]+)\s*[:=]\s*([+-]?[0-9]*\.?[0-9]+)\b.*?\b([A-Za-z_]+)\s*[:=]\s*([+-]?[0-9]*\.?[0-9]+)\b",
#     re.I,
# )


# def parse_log(text, name_keys, mass_keys, stab_keys, debug=False):
#     re_name = build_name_regex(name_keys)
#     re_mass = build_kv_regex(mass_keys)
#     re_stab = build_kv_regex(stab_keys)

#     # Also accept compact numeric lines like: "Mass(Ne)=20.180"
#     # You can extend these if needed.
#     re_mass_fuzzy = re.compile(r"\bmass\b.*?([+-]?[0-9]*\.?[0-9]+)", re.I)
#     re_stab_fuzzy = re.compile(r"\bstab(?:ility)?\b.*?([+-]?[0-9]*\.?[0-9]+)", re.I)

#     elements = []
#     current = {"name": None, "mass": None, "stability": None}
#     idx = 0

#     lines = text.splitlines()

#     if debug:
#         print("\n--- DEBUG: First 200 lines of file ---")
#         for i, ln in enumerate(lines[:200], start=1):
#             print(f"{i:03d}: {ln}")
#         print("--- END DEBUG ---\n")

#     def flush():
#         nonlocal idx, current
#         if current["name"] and current["mass"] is not None and current["stability"] is not None:
#             elements.append({"idx": idx, **current})
#             idx += 1
#         current = {"name": None, "mass": None, "stability": None}

#     for line in lines:
#         s = line.strip()

#         # 1) Inline generic lines
#         m = RE_INLINE_GENERIC.match(s)
#         if m:
#             # We don't know which captured keys correspond to mass/stability,
#             # so map by keyword match.
#             name = m.group(1)
#             k1, v1 = m.group(2).lower(), float(m.group(3))
#             k2, v2 = m.group(4).lower(), float(m.group(5))

#             mass_val = None
#             stab_val = None
#             if "mass" in k1:
#                 mass_val = v1
#             if "stab" in k1:
#                 stab_val = v1
#             if "mass" in k2:
#                 mass_val = v2
#             if "stab" in k2:
#                 stab_val = v2

#             if mass_val is not None and stab_val is not None:
#                 elements.append({"name": name, "mass": mass_val, "stability": stab_val, "idx": idx})
#                 idx += 1
#             continue

#         # 2) Block format using explicit labels
#         if re_name:
#             m = re_name.match(s)
#             if m:
#                 flush()
#                 current["name"] = m.group(1)
#                 continue

#         if re_mass and current["name"]:
#             m = re_mass.match(s)
#             if m:
#                 current["mass"] = float(m.group(1))
#                 continue
#         if re_stab and current["name"]:
#             m = re_stab.match(s)
#             if m:
#                 current["stability"] = float(m.group(1))
#                 continue

#         # 3) Fuzzy fallback within a block
#         if current["name"]:
#             if current["mass"] is None:
#                 fm = re_mass_fuzzy.search(s)
#                 if fm:
#                     current["mass"] = float(fm.group(1))
#             if current["stability"] is None:
#                 fs = re_stab_fuzzy.search(s)
#                 if fs:
#                     current["stability"] = float(fs.group(1))

#             # If we got all fields, flush immediately
#             if current["mass"] is not None and current["stability"] is not None:
#                 flush()

#     flush()
#     return elements


# def rolling_average(values, window=25):
#     out = []
#     for i in range(len(values)):
#         lo = max(0, i - window + 1)
#         chunk = values[lo:i+1]
#         out.append(sum(chunk) / len(chunk))
#     return out


# def main():
#     ap = argparse.ArgumentParser()
#     ap.add_argument("logfile", help="Path to your simulation log (.txt/.log)")
#     ap.add_argument("--save", default="", help="Save first plot to file (png/jpg/etc)")
#     ap.add_argument("--window", type=int, default=25, help="Rolling avg window for stability-over-time")
#     ap.add_argument("--debug", action="store_true", help="Print first 200 lines for troubleshooting")
#     ap.add_argument("--name", default="Element,Name",
#                     help="Comma-separated label keys for element name lines")
#     ap.add_argument("--mass", default="Mass,AtomicMass",
#                     help="Comma-separated label keys for mass lines")
#     ap.add_argument("--stability", default="Stability,StabilityScore,Stable",
#                     help="Comma-separated label keys for stability lines")
#     args = ap.parse_args()

#     p = Path(args.logfile)
#     if not p.exists():
#         raise FileNotFoundError(f"Log file not found: {p.resolve()}")

#     text = p.read_text(errors="ignore")

#     name_keys = [x.strip() for x in args.name.split(",")]
#     mass_keys = [x.strip() for x in args.mass.split(",")]
#     stab_keys = [x.strip() for x in args.stability.split(",")]

#     elements = parse_log(text, name_keys, mass_keys, stab_keys, debug=args.debug)

#     if not elements:
#         raise RuntimeError(
#             "No elements parsed.\n"
#             "Run with --debug and paste me the first ~60 lines, OR tell me what your log labels are.\n"
#             "Example: does it say 'Element:' or 'New Element:' or 'Created:' etc?"
#         )

#     masses = [e["mass"] for e in elements]
#     stabs = [e["stability"] for e in elements]
#     names = [e["name"] for e in elements]
#     x = list(range(len(elements)))

#     # Plot 1
#     plt.figure()
#     plt.title("FRAYMUS — Island of Stability (Mass vs Stability)")
#     plt.xlabel("Mass")
#     plt.ylabel("Stability")
#     plt.scatter(masses, stabs)
#     plt.grid(True, alpha=0.25)

#     # Label 3 interesting points
#     hi = max(range(len(elements)), key=lambda i: stabs[i])
#     lo = min(range(len(elements)), key=lambda i: stabs[i])
#     hm = max(range(len(elements)), key=lambda i: masses[i])
#     for i in {hi, lo, hm}:
#         plt.annotate(names[i], (masses[i], stabs[i]))

#     if args.save:
#         plt.savefig(args.save, dpi=200, bbox_inches="tight")

#     # Plot 2
#     plt.figure()
#     plt.title("FRAYMUS — Stability Over Time (Discovery Order)")
#     plt.xlabel("Discovery Index")
#     plt.ylabel("Stability")
#     plt.plot(x, stabs, linewidth=1.0)
#     plt.plot(x, rolling_average(stabs, args.window), linewidth=2.0)
#     plt.grid(True, alpha=0.25)

#     if args.save:
#         out2 = Path(args.save)
#         plt.savefig(out2.with_name(out2.stem + "_stability_over_time" + out2.suffix),
#                     dpi=200, bbox_inches="tight")

#     plt.show()


# if __name__ == "__main__":
#     main()
#!/usr/bin/env python3
"""
FRAYMUS / V7 Universe Visualizer (AUTO-PARSER)
Usage:
  python plot_island.py path\to\log.txt
  python plot_island.py path\to\log.txt --save island.png
"""

import argparse
import re
from pathlib import Path
import matplotlib.pyplot as plt


# --- Broad patterns (handles many log styles) ---
# Matches things like:
#   Element: Hf
#   Name = Arrinao
RE_NAME_LABELED = re.compile(r"^\s*(?:element|name|symbol)\s*[:=]\s*([A-Za-z][A-Za-z0-9_\-]{0,40})\s*$", re.I)

# Matches any token that looks like an element name in contexts like:
#   "Created: Arrinao"  "New Element -> Nerna"
RE_NAME_CONTEXT = re.compile(r"(?:created|new\s+element|discovered|formed|result)\s*[:=\-\>]*\s*([A-Za-z][A-Za-z0-9_\-]{0,40})", re.I)

# Mass/stability numbers in many forms:
#   Mass: 81.664
#   mass=81.664
#   total mass 81.664
RE_MASS = re.compile(r"\bmass\b\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)", re.I)

#   Stability: 0.372
#   stable=0.684
#   stability score 0.684
RE_STAB = re.compile(r"\bstab(?:ility)?(?:\s*score)?\b\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)", re.I)

# Inline “triples” in one line:
#   Arrinao ... mass 123.45 ... stability 0.33
RE_INLINE_TRIPLE = re.compile(
    r"([A-Za-z][A-Za-z0-9_\-]{0,40}).*?\bmass\b\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)"
    r".*?\bstab(?:ility)?(?:\s*score)?\b\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)",
    re.I
)


def parse_log_auto(text: str):
    """
    Attempts multiple strategies to extract:
      name, mass, stability
    Returns list of dicts.
    """
    elements = []
    idx = 0

    current_name = None
    current_mass = None
    current_stab = None

    for line in text.splitlines():
        line_stripped = line.strip()

        # Strategy 1: inline triple
        m = RE_INLINE_TRIPLE.search(line_stripped)
        if m:
            name = m.group(1)
            mass = float(m.group(2))
            stab = float(m.group(3))
            elements.append({"name": name, "mass": mass, "stability": stab, "idx": idx})
            idx += 1
            continue

        # Strategy 2: block-ish accumulation
        m = RE_NAME_LABELED.match(line_stripped)
        if m:
            # flush previous if complete
            if current_name and current_mass is not None and current_stab is not None:
                elements.append({"name": current_name, "mass": current_mass, "stability": current_stab, "idx": idx})
                idx += 1
            current_name = m.group(1)
            current_mass = None
            current_stab = None
            continue

        # Strategy 3: name in context (“Created: X”, “Result -> X”)
        m = RE_NAME_CONTEXT.search(line_stripped)
        if m:
            # flush previous if complete
            if current_name and current_mass is not None and current_stab is not None:
                elements.append({"name": current_name, "mass": current_mass, "stability": current_stab, "idx": idx})
                idx += 1
            current_name = m.group(1)
            current_mass = None
            current_stab = None
            # don't continue; line might also contain mass/stability
            # fall through

        m = RE_MASS.search(line_stripped)
        if m:
            current_mass = float(m.group(1))

        m = RE_STAB.search(line_stripped)
        if m:
            current_stab = float(m.group(1))

        # If we have a complete record, commit it immediately
        if current_name and current_mass is not None and current_stab is not None:
            elements.append({"name": current_name, "mass": current_mass, "stability": current_stab, "idx": idx})
            idx += 1
            current_name = None
            current_mass = None
            current_stab = None

    return elements


def rolling_average(values, window=25):
    if window <= 1:
        return values[:]
    out = []
    for i in range(len(values)):
        lo = max(0, i - window + 1)
        chunk = values[lo:i+1]
        out.append(sum(chunk) / len(chunk))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("logfile", type=str, help="Path to your simulation log .txt")
    ap.add_argument("--save", type=str, default="", help="Optional: save plot to file (png/jpg/etc)")
    ap.add_argument("--window", type=int, default=25, help="Rolling average window size")
    ap.add_argument("--preview", type=int, default=12, help="How many parsed rows to print")
    args = ap.parse_args()

    p = Path(args.logfile)

    print(f"[INFO] Current working dir: {Path.cwd()}")
    print(f"[INFO] Looking for log at:  {p.resolve()}")

    if not p.exists():
        raise FileNotFoundError(f"Log file not found: {p.resolve()}")

    text = p.read_text(errors="ignore")
    elements = parse_log_auto(text)

    if not elements:
        raise RuntimeError(
            "No elements parsed.\n"
            "Your log might not include explicit 'mass'/'stability' keywords.\n"
            "If so, run:  findstr /i /n \"mass stab element created result\" your_log.txt\n"
            "and paste a few matching lines."
        )

    # Preview so you immediately know it worked
    print(f"[OK] Parsed {len(elements)} elements. Preview:")
    for e in elements[: args.preview]:
        print(f"  idx={e['idx']:>4}  name={e['name']:<12}  mass={e['mass']:<10}  stability={e['stability']}")

    masses = [e["mass"] for e in elements]
    stabs = [e["stability"] for e in elements]
    names = [e["name"] for e in elements]

    # --- Plot 1: Mass vs Stability ---
    plt.figure()
    plt.title("FRAYMUS V7 — Island of Stability (Mass vs Stability)")
    plt.xlabel("Mass")
    plt.ylabel("Stability")
    plt.scatter(masses, stabs)
    plt.grid(True, alpha=0.25)

    # Label a few extremes
    hi = max(range(len(elements)), key=lambda i: stabs[i])
    lo = min(range(len(elements)), key=lambda i: stabs[i])
    hm = max(range(len(elements)), key=lambda i: masses[i])
    for i in {hi, lo, hm}:
        plt.annotate(names[i], (masses[i], stabs[i]))

    if args.save:
        plt.savefig(args.save, dpi=200, bbox_inches="tight")
        print(f"[SAVED] {args.save}")

    # --- Plot 2: Stability over discovery order ---
    plt.figure()
    plt.title("FRAYMUS V7 — Stability Over Time (Discovery Order)")
    plt.xlabel("Discovery Index")
    plt.ylabel("Stability")
    x = list(range(len(stabs)))
    plt.plot(x, stabs, linewidth=1.0)
    plt.plot(x, rolling_average(stabs, window=args.window), linewidth=2.0)
    plt.grid(True, alpha=0.25)

    if args.save:
        out2 = str(Path(args.save).with_name(Path(args.save).stem + "_stability_over_time" + Path(args.save).suffix))
        plt.savefig(out2, dpi=200, bbox_inches="tight")
        print(f"[SAVED] {out2}")

    plt.show()


if __name__ == "__main__":
    main()
