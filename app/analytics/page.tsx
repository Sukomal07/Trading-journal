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
      accountType={journal.accountType}
      setAccountType={journal.setAccountType}
      loading={journal.loading}
      toast={journal.toast}
      showForm={journal.showForm}
      editTrade={journal.editTrade}
      setShowForm={journal.setShowForm}
      setEditTrade={journal.setEditTrade}
      setToast={journal.setToast}
      saveTrade={journal.saveTrade}
    >
      <Analytics trades={journal.trades} />
    </TradingPageShell>
  );
}
