// A workbook may have an input on a row omitted from the extracted label list.
// Keep it editable at its real coordinate instead of dropping it from the UI.
export function costSheetRows(template: {
  rows: { row: number; label: string }[];
  inputs: Record<string, string>;
}) {
  const rows = new Map(template.rows.map((r) => [r.row, r]));
  for (const [cell, label] of Object.entries(template.inputs)) {
    const row = Number(cell.slice(1));
    if (!rows.has(row)) rows.set(row, { row, label });
  }
  return [...rows.values()].sort((a, b) => a.row - b.row);
}
