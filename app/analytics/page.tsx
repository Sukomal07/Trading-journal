"use client";

import {
  Analytics,
  TradingPageShell,
  useTradingJournal,
} from "@/components/TradingApp";

export default function AnalyticsPage() {
  const journal = useTradingJournal();

  return (
    <TradingPageShell
      activeView="analytics"
      trades={journal.trades}
      settings={journal.settings}
      loading={journal.loading}
      showForm={journal.showForm}
      editTrade={journal.editTrade}
      setShowForm={journal.setShowForm}
      setEditTrade={journal.setEditTrade}
      saveTrade={journal.saveTrade}
    >
      <Analytics trades={journal.trades} />
    </TradingPageShell>
  );
}
