import { EquityView } from "./EquityView";
import { Module } from "@/lib/accounting/modules";
import type { RegisterKind } from "@/lib/accounting/registers";
import { JournalView } from "./JournalView";
import { RegisterView } from "./RegisterView";
import { ReportView } from "./ReportView";
import { StockView } from "./StockView";
import { CalculatorView } from "./CalculatorView";
import { SettingsView } from "./SettingsView";
import { CostView } from "./CostView";
import type { CostType } from "@/lib/accounting/costs";
import { DocumentView } from "./DocumentView";
import { AuditView } from "./AuditView";
export function ModuleView({
  module: m,
  title,
}: {
  module: Module;
  title: string;
}) {
  switch (m.type) {
    case "equity":
      return <EquityView title={title} />;
    case "cost":
      return <CostView type={m.costType as CostType} />;
    case "document":
      return <DocumentView />;
    case "journal":
      return <JournalView title={title} kind={m.kind} />;
    case "register":
      return (
        <RegisterView
          title={title}
          kind={m.kind as RegisterKind}
          partyType={m.partyType}
        />
      );
    case "report":
      return (
        <ReportView
          title={title}
          report={m.report}
          view={m.view}
          costType={m.costType}
        />
      );
    case "stock":
      return (
        <StockView title={title} initialKind={m.kind} readOnly={m.readOnly} />
      );
    case "calculator":
      return (
        <CalculatorView type={m.kind as "weigh" | "import" | "depreciation"} />
      );
    case "settings":
      return <SettingsView />;
    case "audit":
      return <AuditView />;
  }
}
