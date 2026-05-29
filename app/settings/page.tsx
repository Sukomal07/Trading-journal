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
      loading={journal.loading}
      showForm={journal.showForm}
      editTrade={journal.editTrade}
      setShowForm={journal.setShowForm}
      setEditTrade={journal.setEditTrade}
      saveTrade={journal.saveTrade}
    >
      <SettingsPanel
        settings={journal.settings}
        onSave={journal.saveSettings}
      />
    </TradingPageShell>
  );
}
