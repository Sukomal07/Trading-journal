"use client";

import {
  BalanceTracker,
  CalculatorView,
  TradingPageShell,
  useTradingJournal,
} from "@/components/TradingApp";

export default function CalculatorPage() {
  const journal = useTradingJournal();

  return (
    <TradingPageShell
      activeView="calculator"
      trades={journal.trades}
      settings={journal.settings}
      loading={journal.loading}
      toast={journal.toast}
      showForm={journal.showForm}
      editTrade={journal.editTrade}
      setShowForm={journal.setShowForm}
      setEditTrade={journal.setEditTrade}
      setToast={journal.setToast}
      saveTrade={journal.saveTrade}
    >
      <div className="grid grid-cols-2 items-start gap-6 max-[1100px]:grid-cols-1">
        <CalculatorView settings={journal.settings} />
        <BalanceTracker
          settings={journal.settings}
          onSettingsUpdate={journal.updateSettings}
          onToast={journal.setToast}
        />
      </div>
    </TradingPageShell>
  );
}
