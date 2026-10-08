import { EquityView } from "./EquityView";
import { PayrollView } from "./PayrollView";
import { DistributionView } from "./DistributionView";
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
import { AccountListsView } from "./AccountListsView";
import { SupportingTools } from "./SupportingTools";
export function ModuleView({
  module: m,
  title,
}: {
  module: Module;
  title: string;
}) {
  switch (m.type) {
    case "payroll":
      return <PayrollView title={title} view={m.view || "statement"} />;
    case "equity":
      return m.view === "distribution" ? (
        <DistributionView />
      ) : (
        <EquityView title={title} />
      );
    case "cost":
      return <CostView type={m.costType as CostType} />;
    case "document":
      return <DocumentView />;
    case "journal":
      return (
        <>
          <JournalView title={title} kind={m.kind} />
          {!m.kind && (
            <SupportingTools tools={[["documents", "المستندات والوزن"]]} />
          )}
        </>
      );
    case "register":
      if (m.view === "account-lists") return <AccountListsView title={title} />;
      return (
        <>
          <RegisterView
            title={title}
            kind={m.kind as RegisterKind}
            partyType={m.partyType}
          />
          {m.kind === "cost-items" && (
            <SupportingTools
              tools={[
                ["centers", "مراكز التكلفة"],
                ["farms", "المزارع والمواسم"],
              ]}
            />
          )}
        </>
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
        <StockView
          title={title}
          initialKind={m.kind}
          readOnly={m.readOnly}
          coldOnly={m.view === "cold"}
        />
      );
    case "calculator":
      return (
        <CalculatorView type={m.kind as "weigh" | "import" | "depreciation"} />
      );
    case "settings":
      return (
        <>
          <SettingsView />
          <SupportingTools tools={[["audit", "سجل المراجعة"]]} />
        </>
      );
    case "audit":
      return <AuditView />;
  }
}
