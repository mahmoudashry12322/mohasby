// Fixed-point arithmetic in browser validation; authoritative validation stays on the server.
export function decimalUnits(value: string): bigint | null {
  const text = value.trim() || "0";
  if (!/^\d{1,15}(\.\d{1,6})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  return BigInt(whole) * 1000000n + BigInt(fraction.padEnd(6, "0"));
}
export function journalIssues(
  lines: { accountCode: string; debit: string; credit: string }[],
) {
  const issues: Record<number, string> = {};
  let debit = 0n,
    credit = 0n;
  lines.forEach((line, i) => {
    const d = decimalUnits(line.debit),
      c = decimalUnits(line.credit);
    if (!line.accountCode) issues[i] = "اختر اسم الحساب لهذا السطر";
    else if (d === null || c === null || d % 10000n !== 0n || c % 10000n !== 0n)
      issues[i] = "أدخل مبلغًا موجبًا بدقة منزلتين عشريتين";
    else if ((d === 0n && c === 0n) || (d > 0n && c > 0n))
      issues[i] = "اكتب مبلغًا في المدين أو الدائن فقط";
    debit += d ?? 0n;
    credit += c ?? 0n;
  });
  return { issues, balanced: debit === credit && debit > 0n };
}
