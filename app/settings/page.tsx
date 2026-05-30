"use client";

import {
  SettingsPanel,
  TradingPageShell,
  useTradingJournal,
} from "@/components/TradingApp";

export default function SettingsPage() {
  const journal = useTradingJournal();

  return (
    <TradingPageShell
      activeView="settings"
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
      <SettingsPanel
        settings={journal.settings}
        onSave={journal.saveSettings}
        onReset={journal.resetAll}
      />
    </TradingPageShell>
  );
}
