"use client";

import { BookOpen } from "lucide-react";
import {
  S,
  TradeRow,
  TradingPageShell,
  useTradingJournal,
} from "@/components/TradingApp";

export default function JournalPage() {
  const journal = useTradingJournal();

  return (
    <TradingPageShell
      activeView="journal"
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
      <div>
        <div
          style={{ display: "flex", gap: 12, marginBottom: 20 }}
          className="max-[640px]:!items-stretch max-[640px]:!flex-col"
        >
          <input
            style={{ ...S.input, maxWidth: 300 }}
            className="max-[640px]:!max-w-none max-[640px]:!w-full"
            placeholder="Search trades..."
            value={journal.searchText}
            onChange={(e) => journal.setSearchText(e.target.value)}
          />
          <select
            style={{ ...S.select, width: 140 }}
            className="max-[640px]:!w-full"
            value={journal.filterStatus}
            onChange={(e) => journal.setFilterStatus(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>
          <div
            style={{
              fontFamily: "DM Mono",
              fontSize: 13,
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
            }}
          >
            {journal.filteredTrades.length} trades
          </div>
        </div>
        <div className="overflow-x-auto pb-1">
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "90px 80px 60px 100px 100px 80px 80px 80px 1fr 80px",
              gap: 12,
              padding: "8px 20px",
              marginBottom: 4,
            }}
            className="min-w-[980px]"
          >
            {[
              "Date",
              "Symbol",
              "Dir",
              "Lot",
              "Entry/Exit",
              "P&L",
              "Pips",
              "Status",
              "Setup",
              "",
            ].map((h) => (
              <div
                key={h}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                }}
              >
                {h}
              </div>
            ))}
          </div>
          {journal.filteredTrades.map((trade) => (
            <TradeRow
              key={trade.id}
              trade={trade}
              onEdit={() => {
                journal.setEditTrade(trade);
                journal.setShowForm(true);
              }}
              onDelete={() => journal.deleteTrade(trade.id)}
            />
          ))}
        </div>
        {journal.filteredTrades.length === 0 && (
          <div
            style={{
              ...S.card,
              padding: "48px 32px",
              textAlign: "center",
              color: "var(--text-muted)",
            }}
            className="max-[640px]:!p-6"
          >
            <BookOpen
              size={40}
              color="var(--text-dim)"
              style={{ margin: "0 auto 16px" }}
            />
            <div style={{ fontSize: 16, marginBottom: 8 }}>
              No trades found
            </div>
            <div style={{ fontSize: 13 }}>
              Click &ldquo;Log Trade&rdquo; to record your first trade
            </div>
          </div>
        )}
      </div>
    </TradingPageShell>
  );
}
