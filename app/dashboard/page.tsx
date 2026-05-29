"use client";

import {
  Dashboard,
  TradingPageShell,
  useTradingJournal,
} from "@/components/TradingApp";

export default function DashboardPage() {
  const journal = useTradingJournal();

  return (
    <TradingPageShell
      activeView="dashboard"
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
      <Dashboard trades={journal.trades} settings={journal.settings} />
    </TradingPageShell>
  );
}
