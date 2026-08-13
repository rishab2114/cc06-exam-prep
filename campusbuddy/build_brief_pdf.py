#!/usr/bin/env python3
"""Render a single markdown doc to PDF (shareable one-pager)."""
import os
import re
import sys
from fpdf import FPDF

FONT_DIR = "/usr/share/fonts/truetype/dejavu"
ASTRAL = re.compile(r"[\U00010000-\U0010FFFF]")
SRC = sys.argv[1] if len(sys.argv) > 1 else "docs/venture-brief.md"
OUT = sys.argv[2] if len(sys.argv) > 2 else "CampusBuddy-Venture-Brief.pdf"


def clean(s):
    s = s.replace("️", "").replace("‍", "")
    s = s.replace("✅", "✓").replace("⭐", "*").replace("★", "*")
    return ASTRAL.sub("", s)


def inline(s):
    s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1 (\2)", s)
    return s.replace("**", "").replace("__", "").replace("`", "")


def is_sep(cells):
    cs = [c.strip() for c in cells if c.strip()]
    return cs and all(re.fullmatch(r":?-{1,}:?", c) for c in cs)


pdf = FPDF(format="A4")
pdf.set_auto_page_break(True, margin=16)
pdf.set_margins(16, 16, 16)
for st, fn in [("", "DejaVuSans.ttf"), ("B", "DejaVuSans-Bold.ttf")]:
    pdf.add_font("DejaVu", st, os.path.join(FONT_DIR, fn))
EPW = pdf.epw
pdf.add_page()
pdf.set_font("DejaVu", "", 10)
HEAD = {1: ("B", 17, 7), 2: ("B", 12.5, 5), 3: ("B", 11, 4), 4: ("B", 10, 4)}


def flush(buf):
    data = []
    for r in buf:
        cells = [c.strip() for c in r.strip().strip("|").split("|")]
        if is_sep(cells):
            continue
        data.append([inline(c) for c in cells])
    if not data:
        return
    n = max(len(r) for r in data)
    data = [r + [""] * (n - len(r)) for r in data]
    pdf.set_font("DejaVu", "", 8.5)
    with pdf.table(width=EPW, line_height=5) as t:
        for r in data:
            row = t.row()
            for c in r:
                row.cell(c)
    pdf.ln(1)
    pdf.set_font("DejaVu", "", 10)


tbuf = []
for raw in clean(open(SRC, encoding="utf-8").read()).split("\n"):
    line = raw.rstrip()
    if line.strip().startswith("|"):
        tbuf.append(line); continue
    if tbuf:
        flush(tbuf); tbuf = []
    if line.strip() == "":
        pdf.ln(2); continue
    if re.fullmatch(r"-{3,}", line.strip()):
        pdf.ln(1); continue
    m = re.match(r"(#{1,6})\s+(.*)", line)
    if m:
        lvl = min(len(m.group(1)), 4); st, sz, sp = HEAD[lvl]
        pdf.ln(2); pdf.set_font("DejaVu", st, sz)
        pdf.multi_cell(EPW, sz * 0.52, inline(m.group(2)))
        pdf.set_font("DejaVu", "", 10); pdf.ln(1); continue
    if line.lstrip().startswith(("- ", "* ")):
        pdf.set_x(20); pdf.multi_cell(EPW - 4, 5, "•  " + inline(line.lstrip()[2:])); continue
    mn = re.match(r"\s*(\d+)\.\s+(.*)", line)
    if mn:
        pdf.set_x(20); pdf.multi_cell(EPW - 4, 5, f"{mn.group(1)}.  {inline(mn.group(2))}"); continue
    if line.lstrip().startswith(">"):
        pdf.set_x(20)
        pdf.multi_cell(EPW - 4, 5, inline(line.lstrip().lstrip(">").strip()))
        continue
    pdf.multi_cell(EPW, 5, inline(line))
if tbuf:
    flush(tbuf)
pdf.output(OUT)
print("WROTE", OUT, os.path.getsize(OUT), "bytes")
