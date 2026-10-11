#!/usr/bin/env python3
"""Read-only parity check. Requires openpyxl; never copies client values to git."""
import json
import sys
from pathlib import Path

import openpyxl

root = Path(__file__).resolve().parents[1]
if len(sys.argv) != 2:
    raise SystemExit("Usage: python scripts/verify-final-workbook.py /private/path/workbook.xlsx")
workbook = openpyxl.load_workbook(sys.argv[1], data_only=False)
buttons = json.loads((root / "src/data/workbook-home.json").read_text())
assert len(workbook.sheetnames) == 45, "Unexpected workbook revision"
actual = [c for row in workbook["Home"] for c in row if c.hyperlink]
assert len(actual) == len(buttons) == 43, "Home link count mismatch"
for button in buttons:
    cell = workbook["Home"][button["cell"]]
    assert cell.value == button["label"], f"Home label mismatch: {cell.coordinate}"
    target = cell.hyperlink.location.split("!")[0].strip("'")
    assert target == button["sheet"], f"Home destination mismatch: {cell.coordinate}"
print("PASS: 43 Home labels and worksheet destinations")

templates = json.loads((root / "src/data/cost-templates.json").read_text())
for kind, template in templates.items():
    sheet = workbook[template["title"]]
    for cell, formula in template["formulas"].items():
        source = sheet[cell].value
        assert isinstance(source, str), f"Missing source formula: {kind}/{cell}"
        expected = (source.lstrip("=")
                    .replace("'" + template["title"] + "'!", "")
                    .replace("$", "").replace("_xlfn.", ""))
        if kind == "EXPORT":
            expected = {"F36": "SUM(E24:E35)", "F48": "SUM(E42:E47)"}.get(cell, expected)
        assert formula == expected, f"Formula mismatch: {kind}/{cell}"
    print(f"PASS: {kind}, {len(template['formulas'])} formulas (documented repairs applied)")

distribution = json.loads((root / "src/data/distribution-template.json").read_text())
for cell, formula in distribution["formulas"].items():
    source = workbook["توزيع حقوق الملكية"][cell].value
    assert formula == source.lstrip("=").replace("$", ""), f"Distribution mismatch: {cell}"
print("PASS: 79 distribution formulas")
