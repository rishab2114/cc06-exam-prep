#!/usr/bin/env python3
"""Render the CampusBuddy markdown docs into a single PDF (fpdf2 + DejaVu)."""
import glob
import os
import re
from fpdf import FPDF

FONT_DIR = "/usr/share/fonts/truetype/dejavu"
ASTRAL = re.compile(r"[\U00010000-\U0010FFFF]")


def clean(s: str) -> str:
    s = s.replace("️", "").replace("‍", "")
    s = s.replace("✅", "✓").replace("⭐", "*").replace("★", "*").replace("☑", "✓")
    return ASTRAL.sub("", s)  # drop emoji the PDF font can't render


def inline(s: str) -> str:
    s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1 (\2)", s)  # links -> text (url)
    return s.replace("**", "").replace("__", "").replace("`", "")


def is_sep_row(cells):
    cs = [c.strip() for c in cells if c.strip() != ""]
    return cs and all(re.fullmatch(r":?-{1,}:?", c) for c in cs)


# --- assemble doc order: HANDOFF, positioning, then 00..17 ---
files = []
if os.path.exists("HANDOFF.md"):
    files.append("HANDOFF.md")
docs = sorted(glob.glob("docs/*.md"))
pos = "docs/positioning.md"
if pos in docs:
    files.append(pos)
files += [d for d in docs if d != pos]

pdf = FPDF(format="A4")
pdf.set_auto_page_break(True, margin=15)
pdf.set_margins(15, 15, 15)
for style, fname in [("", "DejaVuSans.ttf"), ("B", "DejaVuSans-Bold.ttf")]:
    pdf.add_font("DejaVu", style, os.path.join(FONT_DIR, fname))
pdf.add_font("Mono", "", os.path.join(FONT_DIR, "DejaVuSansMono.ttf"))
EPW = pdf.epw

# cover
pdf.add_page()
pdf.set_font("DejaVu", "B", 24)
pdf.ln(60)
pdf.multi_cell(EPW, 12, "CampusBuddy", align="C")
pdf.set_font("DejaVu", "", 13)
pdf.multi_cell(EPW, 8, "Product Documentation", align="C")
pdf.set_font("DejaVu", "", 10)
pdf.multi_cell(EPW, 6, "Verified-student services marketplace · generated from /docs", align="C")

HEAD = {1: ("B", 16, 8), 2: ("B", 13, 6), 3: ("B", 11, 5), 4: ("B", 10, 5)}


def flush_table(buf):
    data = []
    for r in buf:
        cells = [c.strip() for c in r.strip().strip("|").split("|")]
        if is_sep_row(cells):
            continue
        data.append([inline(c) for c in cells])
    if not data:
        return
    n = max(len(r) for r in data)
    data = [r + [""] * (n - len(r)) for r in data]
    pdf.set_font("DejaVu", "", 8)
    with pdf.table(width=EPW, line_height=5) as table:
        for r in data:
            row = table.row()
            for c in r:
                row.cell(c)
    pdf.ln(1)
    pdf.set_font("DejaVu", "", 10)


for path in files:
    pdf.add_page()
    pdf.set_font("DejaVu", "", 10)
    in_code = False
    tbuf = []
    for raw in clean(open(path, encoding="utf-8").read()).split("\n"):
        line = raw.rstrip()
        if line.strip().startswith("```"):
            if tbuf:
                flush_table(tbuf); tbuf = []
            in_code = not in_code
            continue
        if in_code:
            pdf.set_font("Mono", "", 8.5)
            pdf.multi_cell(EPW, 4.5, line if line else " ")
            pdf.set_font("DejaVu", "", 10)
            continue
        if line.strip().startswith("|"):
            tbuf.append(line); continue
        if tbuf:
            flush_table(tbuf); tbuf = []
        if line.strip() == "":
            pdf.ln(2); continue
        if re.fullmatch(r"(-{3,}|\*{3,}|_{3,})", line.strip()):
            pdf.ln(2); continue
        m = re.match(r"(#{1,6})\s+(.*)", line)
        if m:
            lvl = min(len(m.group(1)), 4)
            st, sz, sp = HEAD[lvl]
            pdf.ln(2)
            pdf.set_font("DejaVu", st, sz)
            pdf.multi_cell(EPW, sz * 0.5, inline(m.group(2)))
            pdf.set_font("DejaVu", "", 10)
            pdf.ln(1)
            continue
        if line.lstrip().startswith(("- ", "* ")):
            txt = inline(line.lstrip()[2:])
            pdf.set_x(18)
            pdf.multi_cell(EPW - 3, 5, "•  " + txt)
            continue
        mnum = re.match(r"\s*(\d+)\.\s+(.*)", line)
        if mnum:
            pdf.set_x(18)
            pdf.multi_cell(EPW - 3, 5, f"{mnum.group(1)}.  {inline(mnum.group(2))}")
            continue
        if line.lstrip().startswith(">"):
            txt = inline(line.lstrip().lstrip(">").strip())
            pdf.set_x(18)
            pdf.multi_cell(EPW - 3, 5, txt)
            continue
        pdf.multi_cell(EPW, 5, inline(line))
    if tbuf:
        flush_table(tbuf)

out = "CampusBuddy-Docs.pdf"
pdf.output(out)
print("WROTE", out, os.path.getsize(out), "bytes")
