"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Trade, Settings, TradeDirection, Session, Emotion } from "@/lib/types";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  X,
  Edit3,
  Trash2,
  BarChart3,
  Settings as SettingsIcon,
  BookOpen,
  Target,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Award,
  Flame,
  Activity,
  CheckCircle2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────
export type View = "dashboard" | "journal" | "analytics" | "settings";
type Toast = {
  message: string;
  tone: "success" | "error";
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number, d = 2) => n.toFixed(d);
const fmtPnl = (n: number) => `${n >= 0 ? "+" : ""}$${fmt(Math.abs(n))}`;

const EMOTIONS: Emotion[] = [
  "CALM",
  "CONFIDENT",
  "NEUTRAL",
  "NERVOUS",
  "FOMO",
  "REVENGE",
];
const SESSIONS: Session[] = ["LONDON", "NEW_YORK", "ASIAN", "OVERLAP"];
const SETUPS = [
  "Break of structure",
  "Support bounce",
  "Resistance rejection",
  "Trendline break",
  "EMA crossover",
  "News play",
  "Range breakout",
  "Retest",
  "Custom",
];

// ─── CSS-in-JS Styles ────────────────────────────────────────────────────────
export const S = {
  card: {
    background: "var(--bg-card)",
    border: "1px solid var(--border-dim)",
    borderRadius: 12,
  } as React.CSSProperties,
  goldCard: {
    background: "linear-gradient(135deg, #1A1508 0%, #111114 100%)",
    border: "1px solid rgba(212,168,67,0.25)",
    borderRadius: 12,
  } as React.CSSProperties,
  btn: {
    background: "transparent",
    border: "1px solid var(--border-dim)",
    borderRadius: 8,
    color: "var(--text-muted)",
    cursor: "pointer",
    fontFamily: "Syne,sans-serif",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: 6,
  } as React.CSSProperties,
  goldBtn: {
    background: "var(--gold)",
    border: "none",
    borderRadius: 8,
    color: "#0A0A0B",
    cursor: "pointer",
    fontFamily: "Syne,sans-serif",
    fontWeight: 700,
  } as React.CSSProperties,
  input: {
    background: "var(--bg-panel)",
    border: "1px solid var(--border-dim)",
    borderRadius: 8,
    color: "var(--text)",
    fontFamily: "DM Mono,monospace",
    fontSize: 14,
    padding: "10px 12px",
    width: "100%",
    outline: "none",
  } as React.CSSProperties,
  label: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    color: "var(--text-muted)",
    textTransform: "uppercase" as const,
    marginBottom: 6,
    display: "block",
  },
  select: {
    background: "var(--bg-panel)",
    border: "1px solid var(--border-dim)",
    borderRadius: 8,
    color: "var(--text)",
    fontFamily: "Syne,sans-serif",
    fontSize: 14,
    padding: "10px 12px",
    width: "100%",
    outline: "none",
  } as React.CSSProperties,
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  color,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
}) {
  return (
    <div style={{ ...S.card, padding: "20px 24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: color || "var(--text)",
              fontFamily: "DM Mono, monospace",
              lineHeight: 1,
            }}
          >
            {value}
          </div>
          {sub && (
            <div
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}
            >
              {sub}
            </div>
          )}
        </div>
        {Icon && (
          <div
            style={{
              padding: 10,
              background: "var(--bg-panel)",
              borderRadius: 10,
            }}
          >
            <Icon size={18} color="var(--gold)" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Trade Form ──────────────────────────────────────────────────────────────
function TradeForm({
  settings,
  onSave,
  onClose,
  initial,
}: {
  settings: Settings;
  onSave: (t: Partial<Trade>) => void;
  onClose: () => void;
  initial?: Trade;
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const now = format(new Date(), "HH:mm");
  const [form, setForm] = useState<Partial<Trade>>(
    initial || {
      date: today,
      time: now,
      symbol: "XAUUSD",
      direction: "BUY",
      lotSize: 0.01,
      session: "LONDON",
      emotion: "NEUTRAL",
      setup: "",
      notes: "",
      tags: [],
      riskAmount: (settings.accountBalance * settings.riskPerTrade) / 100,
    },
  );
  const [customSetup, setCustomSetup] = useState(false);
  const set = (k: keyof Trade, v: unknown) =>
    setForm((p) => ({ ...p, [k]: v }));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          ...S.card,
          width: "100%",
          maxWidth: 680,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 32,
        }}
        className="max-[640px]:!max-h-[94vh] max-[640px]:!p-5"
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>
            {initial ? "Edit Trade" : "Log New Trade"}
          </h2>
          <button
            onClick={onClose}
            style={{ ...S.btn, padding: 8, border: "none" }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          className="max-[640px]:!grid-cols-1"
        >
          {/* Date & Time */}
          <div>
            <label style={S.label}>Date</label>
            <input
              style={S.input}
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>
          <div>
            <label style={S.label}>Time</label>
            <input
              style={S.input}
              type="time"
              value={form.time}
              onChange={(e) => set("time", e.target.value)}
            />
          </div>

          {/* Symbol & Direction */}
          <div>
            <label style={S.label}>Symbol</label>
            <input
              style={S.input}
              value={form.symbol}
              onChange={(e) => set("symbol", e.target.value)}
            />
          </div>
          <div>
            <label style={S.label}>Direction</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
              className="max-[640px]:!grid-cols-1"
            >
              {(["BUY", "SELL"] as TradeDirection[]).map((d) => (
                <button
                  key={d}
                  onClick={() => set("direction", d)}
                  style={{
                    padding: "10px 0",
                    borderRadius: 8,
                    border: "1px solid",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                    fontFamily: "Syne,sans-serif",
                    borderColor:
                      form.direction === d
                        ? d === "BUY"
                          ? "var(--green)"
                          : "var(--red)"
                        : "var(--border-dim)",
                    background:
                      form.direction === d
                        ? d === "BUY"
                          ? "rgba(34,197,94,0.1)"
                          : "rgba(239,68,68,0.1)"
                        : "transparent",
                    color:
                      form.direction === d
                        ? d === "BUY"
                          ? "var(--green)"
                          : "var(--red)"
                        : "var(--text-muted)",
                  }}
                >
                  {d === "BUY" ? "▲ BUY" : "▼ SELL"}
                </button>
              ))}
            </div>
          </div>

          {/* Prices */}
          <div>
            <label style={S.label}>Lot Size</label>
            <input
              style={S.input}
              type="number"
              step="0.01"
              value={form.lotSize}
              onChange={(e) => set("lotSize", parseFloat(e.target.value))}
            />
          </div>
          <div>
            <label style={S.label}>Risk Amount ($)</label>
            <input
              style={S.input}
              type="number"
              step="0.01"
              value={form.riskAmount}
              onChange={(e) => set("riskAmount", parseFloat(e.target.value))}
            />
          </div>
          <div>
            <label style={S.label}>Entry Price</label>
            <input
              style={S.input}
              type="number"
              step="0.01"
              value={form.entryPrice || ""}
              onChange={(e) => set("entryPrice", parseFloat(e.target.value))}
              placeholder="e.g. 2315.50"
            />
          </div>
          <div>
            <label style={S.label}>Stop Loss</label>
            <input
              style={S.input}
              type="number"
              step="0.01"
              value={form.stopLoss || ""}
              onChange={(e) => set("stopLoss", parseFloat(e.target.value))}
              placeholder="e.g. 2312.00"
            />
          </div>
          <div>
            <label style={S.label}>Take Profit</label>
            <input
              style={S.input}
              type="number"
              step="0.01"
              value={form.takeProfit || ""}
              onChange={(e) => set("takeProfit", parseFloat(e.target.value))}
              placeholder="e.g. 2322.00"
            />
          </div>
          <div>
            <label style={S.label}>Exit Price (leave blank if open)</label>
            <input
              style={S.input}
              type="number"
              step="0.01"
              value={form.exitPrice || ""}
              onChange={(e) =>
                set(
                  "exitPrice",
                  e.target.value ? parseFloat(e.target.value) : undefined,
                )
              }
              placeholder="Close price"
            />
          </div>

          {/* Setup */}
          <div style={{ gridColumn: "1/-1" }}>
            <label style={S.label}>Setup / Strategy</label>
            {!customSetup ? (
              <select
                style={S.select}
                value={form.setup}
                onChange={(e) => {
                  if (e.target.value === "Custom") {
                    setCustomSetup(true);
                    set("setup", "");
                  } else set("setup", e.target.value);
                }}
              >
                <option value="">Select setup...</option>
                {SETUPS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <input
                style={S.input}
                value={form.setup}
                onChange={(e) => set("setup", e.target.value)}
                placeholder="Describe your setup..."
              />
            )}
          </div>

          {/* Session */}
          <div>
            <label style={S.label}>Session</label>
            <select
              style={S.select}
              value={form.session}
              onChange={(e) => set("session", e.target.value as Session)}
            >
              {SESSIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Emotion */}
          <div>
            <label style={S.label}>Emotion before trade</label>
            <select
              style={S.select}
              value={form.emotion}
              onChange={(e) => set("emotion", e.target.value as Emotion)}
            >
              {EMOTIONS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div style={{ gridColumn: "1/-1" }}>
            <label style={S.label}>Notes & observations</label>
            <textarea
              style={{ ...S.input, height: 90, resize: "vertical" as const }}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Why did you take this trade? What did you observe?"
            />
          </div>

          {/* Tags */}
          <div style={{ gridColumn: "1/-1" }}>
            <label style={S.label}>Tags (comma separated)</label>
            <input
              style={S.input}
              value={(form.tags || []).join(", ")}
              onChange={(e) =>
                set(
                  "tags",
                  e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                )
              }
              placeholder="e.g. trend, news, patience"
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 28,
            justifyContent: "flex-end",
          }}
        >
          <button onClick={onClose} style={{ ...S.btn, padding: "12px 24px" }}>
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            style={{ ...S.goldBtn, padding: "12px 28px", fontSize: 15 }}
          >
            {initial ? "Update Trade" : "Log Trade"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Trade Row ────────────────────────────────────────────────────────────────
export function TradeRow({
  trade,
  onEdit,
  onDelete,
}: {
  trade: Trade;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isWin = trade.result === "WIN";
  const isLoss = trade.result === "LOSS";

  return (
    <div style={{ ...S.card, marginBottom: 8, overflow: "hidden" }}>
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{
          padding: "14px 20px",
          display: "grid",
          gridTemplateColumns:
            "90px 80px 60px 100px 100px 80px 80px 80px 1fr 80px",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
          userSelect: "none",
        }}
        className="min-w-[980px]"
      >
        <div
          style={{
            fontFamily: "DM Mono",
            fontSize: 12,
            color: "var(--text-muted)",
          }}
        >
          {trade.date}
          <br />
          {trade.time}
        </div>
        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--gold)" }}>
          {trade.symbol}
        </div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: trade.direction === "BUY" ? "var(--green)" : "var(--red)",
          }}
        >
          {trade.direction === "BUY" ? "▲" : "▼"} {trade.direction}
        </div>
        <div style={{ fontFamily: "DM Mono", fontSize: 12 }}>
          {trade.lotSize} lot
        </div>
        <div style={{ fontFamily: "DM Mono", fontSize: 12 }}>
          {trade.entryPrice?.toFixed(2)}
          <br />
          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
            → {trade.exitPrice?.toFixed(2) || "Open"}
          </span>
        </div>
        <div
          style={{
            fontFamily: "DM Mono",
            fontSize: 13,
            color: isWin
              ? "var(--green)"
              : isLoss
                ? "var(--red)"
                : "var(--text-muted)",
            fontWeight: 700,
          }}
        >
          {trade.pnl != null ? fmtPnl(trade.pnl) : "—"}
        </div>
        <div
          style={{
            fontFamily: "DM Mono",
            fontSize: 12,
            color: "var(--text-muted)",
          }}
        >
          {trade.pips != null
            ? `${trade.pips > 0 ? "+" : ""}${trade.pips}p`
            : "—"}
        </div>
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 4,
              background:
                trade.status === "OPEN"
                  ? "rgba(96,165,250,0.1)"
                  : isWin
                    ? "rgba(34,197,94,0.1)"
                    : isLoss
                      ? "rgba(239,68,68,0.1)"
                      : "rgba(255,255,255,0.05)",
              color:
                trade.status === "OPEN"
                  ? "var(--blue)"
                  : isWin
                    ? "var(--green)"
                    : isLoss
                      ? "var(--red)"
                      : "var(--text-muted)",
            }}
          >
            {trade.status === "OPEN" ? "OPEN" : trade.result || "BE"}
          </span>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {trade.setup}
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            style={{ ...S.btn, padding: 6 }}
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{ ...S.btn, padding: 6, color: "var(--red)" }}
          >
            <Trash2 size={14} />
          </button>
          {expanded ? (
            <ChevronUp size={16} color="var(--text-muted)" />
          ) : (
            <ChevronDown size={16} color="var(--text-muted)" />
          )}
        </div>
      </div>
      {expanded && (
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid var(--border-dim)",
            background: "var(--bg-panel)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
          }}
          className="max-[640px]:!grid-cols-1"
        >
          <div>
            <div style={S.label}>SL / TP</div>
            <div style={{ fontFamily: "DM Mono", fontSize: 13 }}>
              {trade.stopLoss?.toFixed(2)} / {trade.takeProfit?.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={S.label}>R:R Achieved</div>
            <div
              style={{
                fontFamily: "DM Mono",
                fontSize: 13,
                color: "var(--gold)",
              }}
            >
              {trade.rrRatio ? `1:${trade.rrRatio}` : "—"}
            </div>
          </div>
          <div>
            <div style={S.label}>Session</div>
            <div style={{ fontSize: 13 }}>{trade.session}</div>
          </div>
          <div>
            <div style={S.label}>Emotion</div>
            <div style={{ fontSize: 13 }}>{trade.emotion}</div>
          </div>
          {trade.tags?.length > 0 && (
            <div>
              <div style={S.label}>Tags</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {trade.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      background: "rgba(212,168,67,0.08)",
                      color: "var(--gold)",
                      borderRadius: 4,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {trade.notes && (
            <div style={{ gridColumn: "1/-1" }}>
              <div style={S.label}>Notes</div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  lineHeight: 1.6,
                }}
              >
                {trade.notes}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function Dashboard({
  trades,
  settings,
}: {
  trades: Trade[];
  settings: Settings;
}) {
  const closed = trades.filter((t) => t.status === "CLOSED");
  const wins = closed.filter((t) => t.result === "WIN");
  const losses = closed.filter((t) => t.result === "LOSS");
  const totalPnl = closed.reduce((s, t) => s + (t.pnl || 0), 0);
  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayTrades = trades.filter((t) => t.date === todayStr);
  const todayPnl = todayTrades
    .filter((t) => t.status === "CLOSED")
    .reduce((s, t) => s + (t.pnl || 0), 0);
  const balance = settings.accountBalance + totalPnl;
  const maxDailyLoss = (settings.accountBalance * settings.maxDailyLoss) / 100;
  const riskPerTrade = (settings.accountBalance * settings.riskPerTrade) / 100;
  const dailyLossUsed = Math.abs(Math.min(todayPnl, 0));
  const dailyLossPct = (dailyLossUsed / maxDailyLoss) * 100;

  // Equity curve
  const equityCurve = (() => {
    let bal = settings.accountBalance;
    const pts: { date: string; balance: number }[] = [
      { date: "Start", balance: bal },
    ];
    const sorted = [...closed].sort((a, b) => a.date.localeCompare(b.date));
    sorted.forEach((t) => {
      bal += t.pnl || 0;
      pts.push({ date: t.date.slice(5), balance: parseFloat(bal.toFixed(2)) });
    });
    return pts;
  })();

  // Last 14 days pnl
  const dailyPnl = (() => {
    const days: { date: string; pnl: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      const p = closed
        .filter((t) => t.date === d)
        .reduce((s, t) => s + (t.pnl || 0), 0);
      days.push({
        date: format(subDays(new Date(), i), "MM/dd"),
        pnl: parseFloat(p.toFixed(2)),
      });
    }
    return days;
  })();

  // Best/worst
  const avgWin = wins.length
    ? wins.reduce((s, t) => s + (t.pnl || 0), 0) / wins.length
    : 0;
  const avgLoss = losses.length
    ? losses.reduce((s, t) => s + (t.pnl || 0), 0) / losses.length
    : 0;
  const profitFactor = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
        }}
        className="max-[640px]:!grid-cols-1"
      >
        <div style={{ ...S.goldCard, padding: "20px 24px" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "rgba(212,168,67,0.6)",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Account Balance
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: "var(--gold)",
              fontFamily: "DM Mono",
              lineHeight: 1,
            }}
          >
            ${balance.toFixed(2)}
          </div>
          <div
            style={{
              fontSize: 12,
              color: totalPnl >= 0 ? "var(--green)" : "var(--red)",
              marginTop: 6,
            }}
          >
            {fmtPnl(totalPnl)} all time
          </div>
        </div>
        <StatCard
          label="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          sub={`${wins.length}W / ${losses.length}L`}
          color={winRate >= 50 ? "var(--green)" : "var(--red)"}
          icon={Award}
        />
        <StatCard
          label="Total Trades"
          value={closed.length.toString()}
          sub={`${trades.filter((t) => t.status === "OPEN").length} open`}
          icon={Activity}
        />
        <StatCard
          label="Profit Factor"
          value={profitFactor.toFixed(2)}
          sub="avg win / avg loss"
          color={
            profitFactor >= 1.5
              ? "var(--green)"
              : profitFactor >= 1
                ? "var(--gold)"
                : "var(--red)"
          }
          icon={Target}
        />
      </div>

      {/* Daily limits */}
      <div style={{ ...S.card, padding: 24 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
            color: "var(--text-muted)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Today&lsquo;s Risk Dashboard
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
          }}
          className="max-[640px]:!grid-cols-1"
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 13 }}>Daily Loss Used</span>
              <span
                style={{
                  fontFamily: "DM Mono",
                  fontSize: 13,
                  color:
                    dailyLossPct > 66
                      ? "var(--red)"
                      : dailyLossPct > 33
                        ? "var(--gold)"
                        : "var(--green)",
                }}
              >
                ${dailyLossUsed.toFixed(2)} / ${maxDailyLoss.toFixed(2)}
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: "var(--bg-panel)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(dailyLossPct, 100)}%`,
                  background:
                    dailyLossPct > 66
                      ? "var(--red)"
                      : dailyLossPct > 33
                        ? "var(--gold)"
                        : "var(--green)",
                  borderRadius: 3,
                  transition: "width 0.3s",
                }}
              />
            </div>
          </div>
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 13 }}>Trades Today</span>
              <span
                style={{
                  fontFamily: "DM Mono",
                  fontSize: 13,
                  color:
                    todayTrades.length >= settings.maxDailyTrades
                      ? "var(--red)"
                      : "var(--green)",
                }}
              >
                {todayTrades.length} / {settings.maxDailyTrades}
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: "var(--bg-panel)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min((todayTrades.length / settings.maxDailyTrades) * 100, 100)}%`,
                  background:
                    todayTrades.length >= settings.maxDailyTrades
                      ? "var(--red)"
                      : "var(--gold)",
                  borderRadius: 3,
                  transition: "width 0.3s",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 13 }}>
              Recommended Lot{" "}
              <span style={{ fontFamily: "DM Mono", color: "var(--gold)" }}>
                0.01
              </span>
            </div>
            <div style={{ fontSize: 13 }}>
              Risk / Trade{" "}
              <span style={{ fontFamily: "DM Mono", color: "var(--gold)" }}>
                ${riskPerTrade.toFixed(2)}
              </span>
            </div>
            <div style={{ fontSize: 13 }}>
              Today P&L{" "}
              <span
                style={{
                  fontFamily: "DM Mono",
                  color: todayPnl >= 0 ? "var(--green)" : "var(--red)",
                }}
              >
                {fmtPnl(todayPnl)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        className="max-[900px]:!grid-cols-1"
      >
        <div style={{ ...S.card, padding: 24 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
              color: "var(--text-muted)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Equity Curve
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={equityCurve}>
              <defs>
                <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A843" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "#7A7670", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#7A7670", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#16161A",
                  border: "1px solid rgba(212,168,67,0.2)",
                  borderRadius: 8,
                  color: "#F0EDE8",
                }}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#D4A843"
                strokeWidth={2}
                fill="url(#eq)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ ...S.card, padding: 24 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
              color: "var(--text-muted)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Daily P&L (14 days)
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dailyPnl}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "#7A7670", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#7A7670", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#16161A",
                  border: "1px solid rgba(212,168,67,0.2)",
                  borderRadius: 8,
                  color: "#F0EDE8",
                }}
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {dailyPnl.map((d, i) => (
                  <Cell key={i} fill={d.pnl >= 0 ? "#22C55E" : "#EF4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent trades */}
      <div style={{ ...S.card, padding: 24 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
            color: "var(--text-muted)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Recent Trades
        </div>
        {trades.slice(0, 5).map((t) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: "1px solid var(--border-dim)",
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span
                style={{
                  color: t.direction === "BUY" ? "var(--green)" : "var(--red)",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {t.direction === "BUY" ? "▲" : "▼"} {t.symbol}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {t.date} {t.time}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {t.setup}
              </span>
            </div>
            <div
              style={{
                fontFamily: "DM Mono",
                fontSize: 14,
                fontWeight: 700,
                color:
                  t.pnl != null
                    ? t.pnl >= 0
                      ? "var(--green)"
                      : "var(--red)"
                    : "var(--blue)",
              }}
            >
              {t.pnl != null ? fmtPnl(t.pnl) : "OPEN"}
            </div>
          </div>
        ))}
        {trades.length === 0 && (
          <div
            style={{
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "32px 0",
              fontSize: 14,
            }}
          >
            No trades yet. Log your first trade to get started.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export function Analytics({ trades }: { trades: Trade[] }) {
  const closed = trades.filter((t) => t.status === "CLOSED");
  const wins = closed.filter((t) => t.result === "WIN");
  const losses = closed.filter((t) => t.result === "LOSS");

  const bySession = SESSIONS.map((s) => ({
    session: s,
    trades: closed.filter((t) => t.session === s).length,
    pnl: closed
      .filter((t) => t.session === s)
      .reduce((sum, t) => sum + (t.pnl || 0), 0),
    wins: closed.filter((t) => t.session === s && t.result === "WIN").length,
  }));

  const byEmotion = EMOTIONS.map((e) => ({
    emotion: e,
    trades: closed.filter((t) => t.emotion === e).length,
    wins: closed.filter((t) => t.emotion === e && t.result === "WIN").length,
    pnl: closed
      .filter((t) => t.emotion === e)
      .reduce((s, t) => s + (t.pnl || 0), 0),
  }));

  const setupStats = [
    ...new Set(closed.map((t) => t.setup).filter(Boolean)),
  ].map((s) => ({
    setup: s,
    trades: closed.filter((t) => t.setup === s).length,
    wins: closed.filter((t) => t.setup === s && t.result === "WIN").length,
    pnl: closed
      .filter((t) => t.setup === s)
      .reduce((sum, t) => sum + (t.pnl || 0), 0),
  }));

  const pieData = [
    { name: "Wins", value: wins.length, color: "#22C55E" },
    { name: "Losses", value: losses.length, color: "#EF4444" },
    {
      name: "Breakeven",
      value: closed.filter((t) => t.result === "BREAKEVEN").length,
      color: "#60A5FA",
    },
  ].filter((d) => d.value > 0);

  const avgRR =
    closed.filter((t) => t.rrRatio).reduce((s, t) => s + (t.rrRatio || 0), 0) /
    (closed.filter((t) => t.rrRatio).length || 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
        }}
        className="max-[640px]:!grid-cols-1"
      >
        <StatCard
          label="Avg R:R"
          value={`1:${avgRR.toFixed(2)}`}
          color={avgRR >= 2 ? "var(--green)" : "var(--gold)"}
          icon={Target}
        />
        <StatCard
          label="Avg Win"
          value={
            wins.length
              ? `$${(wins.reduce((s, t) => s + (t.pnl || 0), 0) / wins.length).toFixed(2)}`
              : "$0"
          }
          color="var(--green)"
          icon={TrendingUp}
        />
        <StatCard
          label="Avg Loss"
          value={
            losses.length
              ? `$${Math.abs(losses.reduce((s, t) => s + (t.pnl || 0), 0) / losses.length).toFixed(2)}`
              : "$0"
          }
          color="var(--red)"
          icon={TrendingDown}
        />
        <StatCard
          label="Largest Win"
          value={
            wins.length
              ? `$${Math.max(...wins.map((t) => t.pnl || 0)).toFixed(2)}`
              : "$0"
          }
          color="var(--green)"
          icon={Flame}
        />
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        className="max-[900px]:!grid-cols-1"
      >
        <div style={{ ...S.card, padding: 24 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
              color: "var(--text-muted)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Win/Loss Distribution
          </div>
          {closed.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name ?? ""} ${(((percent as number) ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: "#7A7670" }}
                >
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#16161A",
                    border: "1px solid rgba(212,168,67,0.2)",
                    borderRadius: 8,
                    color: "#F0EDE8",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "60px 0",
              }}
            >
              No data yet
            </div>
          )}
        </div>

        <div style={{ ...S.card, padding: 24 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
              color: "var(--text-muted)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Performance by Session
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bySession}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis
                dataKey="session"
                tick={{ fill: "#7A7670", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#7A7670", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#16161A",
                  border: "1px solid rgba(212,168,67,0.2)",
                  borderRadius: 8,
                  color: "#F0EDE8",
                }}
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {bySession.map((d, i) => (
                  <Cell key={i} fill={d.pnl >= 0 ? "#D4A843" : "#EF4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Setup performance */}
      <div style={{ ...S.card, padding: 24 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
            color: "var(--text-muted)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Setup Performance
        </div>
        {setupStats.length > 0 ? (
          setupStats.map((s) => (
            <div
              key={s.setup}
              style={{
                display: "grid",
                gridTemplateColumns: "200px 1fr 80px 80px",
                alignItems: "center",
                gap: 16,
                padding: "10px 0",
                borderBottom: "1px solid var(--border-dim)",
              }}
              className="max-[900px]:!grid-cols-2 max-[640px]:!grid-cols-1"
            >
              <div style={{ fontSize: 13 }}>{s.setup}</div>
              <div
                style={{
                  height: 6,
                  background: "var(--bg-panel)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${s.trades ? (s.wins / s.trades) * 100 : 0}%`,
                    background: "var(--gold)",
                    borderRadius: 3,
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: "DM Mono",
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                {s.trades ? Math.round((s.wins / s.trades) * 100) : 0}% WR
              </div>
              <div
                style={{
                  fontFamily: "DM Mono",
                  fontSize: 12,
                  color: s.pnl >= 0 ? "var(--green)" : "var(--red)",
                  fontWeight: 700,
                }}
              >
                {fmtPnl(s.pnl)}
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "32px 0",
            }}
          >
            Log some trades to see setup analytics
          </div>
        )}
      </div>

      {/* Emotion stats */}
      <div style={{ ...S.card, padding: 24 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
            color: "var(--text-muted)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Emotion vs Performance
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
          }}
          className="max-[640px]:!grid-cols-1"
        >
          {byEmotion
            .filter((e) => e.trades > 0)
            .map((e) => (
              <div
                key={e.emotion}
                style={{
                  ...S.card,
                  padding: "14px 16px",
                  background: "var(--bg-panel)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginBottom: 4,
                  }}
                >
                  {e.emotion}
                </div>
                <div
                  style={{
                    fontFamily: "DM Mono",
                    fontSize: 16,
                    fontWeight: 700,
                    color: e.pnl >= 0 ? "var(--green)" : "var(--red)",
                  }}
                >
                  {fmtPnl(e.pnl)}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  {e.trades} trades ·{" "}
                  {e.trades ? Math.round((e.wins / e.trades) * 100) : 0}% WR
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
export function SettingsPanel({
  settings,
  onSave,
}: {
  settings: Settings;
  onSave: (s: Settings) => void;
}) {
  const [form, setForm] = useState(settings);
  const set = (k: keyof Settings, v: unknown) =>
    setForm((p) => ({ ...p, [k]: v }));
  const riskAmt = ((form.accountBalance * form.riskPerTrade) / 100).toFixed(2);
  const dailyLossAmt = (
    (form.accountBalance * form.maxDailyLoss) /
    100
  ).toFixed(2);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24
      }}
    >
      <div style={{ ...S.card, padding: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
          Account Settings
        </h2>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          className="max-[640px]:!grid-cols-1"
        >
          <div style={{ gridColumn: "1/-1" }}>
            <label style={S.label}>Your Trading Name</label>
            <input
              style={S.input}
              value={form.tradingName}
              onChange={(e) => set("tradingName", e.target.value)}
            />
          </div>
          <div>
            <label style={S.label}>Broker</label>
            <input
              style={S.input}
              value={form.broker}
              onChange={(e) => set("broker", e.target.value)}
              placeholder="e.g. XM, Exness..."
            />
          </div>
          <div>
            <label style={S.label}>Account Balance ($)</label>
            <input
              style={S.input}
              type="number"
              value={form.accountBalance}
              onChange={(e) =>
                set("accountBalance", parseFloat(e.target.value))
              }
            />
          </div>
          <div>
            <label style={S.label}>Risk per trade (%)</label>
            <input
              style={S.input}
              type="number"
              step="0.5"
              value={form.riskPerTrade}
              onChange={(e) => set("riskPerTrade", parseFloat(e.target.value))}
            />
            <div style={{ fontSize: 12, color: "var(--gold)", marginTop: 4 }}>
              = ${riskAmt} per trade
            </div>
          </div>
          <div>
            <label style={S.label}>Max daily loss (%)</label>
            <input
              style={S.input}
              type="number"
              step="0.5"
              value={form.maxDailyLoss}
              onChange={(e) => set("maxDailyLoss", parseFloat(e.target.value))}
            />
            <div style={{ fontSize: 12, color: "var(--red)", marginTop: 4 }}>
              = ${dailyLossAmt} daily cap
            </div>
          </div>
          <div>
            <label style={S.label}>Max daily trades</label>
            <input
              style={S.input}
              type="number"
              value={form.maxDailyTrades}
              onChange={(e) => set("maxDailyTrades", parseInt(e.target.value))}
            />
          </div>
          <div>
            <label style={S.label}>Target R:R ratio</label>
            <input
              style={S.input}
              type="number"
              step="0.5"
              value={form.rrRatio}
              onChange={(e) => set("rrRatio", parseFloat(e.target.value))}
            />
          </div>
        </div>
        <div
          style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}
        >
          <button
            onClick={() => onSave(form)}
            style={{
              ...S.goldBtn,
              padding: "12px 28px",
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CheckCircle2 size={16} /> Save Settings
          </button>
        </div>
      </div>

      <div style={{ ...S.card, padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
          Risk Rules Reminder
        </h3>
        {[
          {
            rule: `Never risk more than ${form.riskPerTrade}% per trade ($${riskAmt})`,
            ok: true,
          },
          {
            rule: `Stop trading after $${dailyLossAmt} daily loss (${form.maxDailyLoss}%)`,
            ok: true,
          },
          { rule: `Maximum ${form.maxDailyTrades} trades per day`, ok: true },
          {
            rule: `Target minimum 1:${form.rrRatio} risk/reward on every trade`,
            ok: true,
          },
          { rule: "Always set stop loss before entering a trade", ok: true },
          { rule: "Never move stop loss further away from entry", ok: true },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              padding: "8px 0",
              borderBottom: "1px solid var(--border-dim)",
            }}
          >
            <CheckCircle2
              size={16}
              color="var(--green)"
              style={{ marginTop: 2, flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {item.rule}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared App State ────────────────────────────────────────────────────────
export function useTradingJournal() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [settings, setSettings] = useState<Settings>({
    accountBalance: 500,
    riskPerTrade: 2,
    maxDailyLoss: 6,
    maxDailyTrades: 3,
    rrRatio: 2,
    currency: "USD",
    broker: "",
    tradingName: "Gold Trader",
  });
  const [showForm, setShowForm] = useState(false);
  const [editTrade, setEditTrade] = useState<Trade | undefined>();
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchText, setSearchText] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/trades");
      const data = await r.json();
      setTrades(data.trades || []);
      setSettings(data.settings);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    fetch("/api/trades")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setTrades(data.trades || []);
        setSettings(data.settings);
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const saveTrade = async (form: Partial<Trade>) => {
    if (editTrade) {
      await fetch("/api/trades", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editTrade, ...form }),
      });
    } else {
      await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setShowForm(false);
    setEditTrade(undefined);
    load();
  };

  const deleteTrade = async (id: string) => {
    if (!confirm("Delete this trade?")) return;
    await fetch(`/api/trades?id=${id}`, { method: "DELETE" });
    load();
  };

  const saveSettings = async (s: Settings) => {
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    if (!response.ok) {
      setToast({ message: "Could not save settings.", tone: "error" });
      return;
    }
    setSettings(s);
    setToast({ message: "Settings saved.", tone: "success" });
  };

  const filteredTrades = trades.filter((t) => {
    if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
    if (
      searchText &&
      ![t.symbol, t.setup, t.notes, t.session, t.emotion, ...(t.tags || [])]
        .join(" ")
        .toLowerCase()
        .includes(searchText.toLowerCase())
    )
      return false;
    return true;
  });

  return {
    trades,
    settings,
    showForm,
    editTrade,
    loading,
    toast,
    filterStatus,
    searchText,
    filteredTrades,
    setShowForm,
    setEditTrade,
    setFilterStatus,
    setSearchText,
    setToast,
    saveTrade,
    deleteTrade,
    saveSettings,
  };
}

// ─── Shared Page Shell ───────────────────────────────────────────────────────
export function TradingPageShell({
  activeView,
  trades,
  settings,
  loading,
  toast,
  showForm,
  editTrade,
  setShowForm,
  setEditTrade,
  setToast,
  saveTrade,
  children,
}: {
  activeView: View;
  trades: Trade[];
  settings: Settings;
  loading: boolean;
  toast: Toast | null;
  showForm: boolean;
  editTrade?: Trade;
  setShowForm: (show: boolean) => void;
  setEditTrade: (trade: Trade | undefined) => void;
  setToast: (toast: Toast | null) => void;
  saveTrade: (form: Partial<Trade>) => Promise<void>;
  children: React.ReactNode;
}) {
  const navItems: {
    id: View;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
  }[] = [
      { id: "dashboard", label: "Dashboard", icon: BarChart3 },
      { id: "journal", label: "Journal", icon: BookOpen },
      { id: "analytics", label: "Analytics", icon: Activity },
      { id: "settings", label: "Settings", icon: SettingsIcon },
    ];

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [setToast, toast]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "0 32px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          background: "rgba(10,10,11,0.95)",
          backdropFilter: "blur(12px)",
          zIndex: 50,
        }}
        className="max-[900px]:!h-auto max-[900px]:!items-stretch max-[900px]:!flex-col max-[900px]:!gap-3 max-[900px]:!px-4 max-[900px]:!py-3"
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 20 }}
          className="max-[900px]:!items-start max-[900px]:!flex-col max-[900px]:!gap-3"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background:
                  "linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              ⚡
            </div>
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  lineHeight: 1,
                  color: "var(--gold)",
                }}
              >
                GOLD JOURNAL
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  letterSpacing: "0.1em",
                }}
              >
                {settings.tradingName}
              </div>
            </div>
          </div>
          <nav
            style={{ display: "flex", gap: 4, marginLeft: 24 }}
            className="max-[900px]:!ml-0 max-[900px]:!w-full max-[900px]:overflow-x-auto max-[900px]:pb-0.5"
          >
            {navItems.map(({ id, label, icon: Icon }) => (
              <Link
                key={id}
                href={`/${id}`}
                className="max-[900px]:flex-none max-[900px]:whitespace-nowrap"
                style={{
                  ...S.btn,
                  padding: "7px 16px",
                  fontSize: 13,
                  border: "none",
                  background:
                    activeView === id
                      ? "rgba(212,168,67,0.1)"
                      : "transparent",
                  color:
                    activeView === id ? "var(--gold)" : "var(--text-muted)",
                  borderRadius: 8,
                }}
              >
                <Icon size={15} /> {label}
              </Link>
            ))}
          </nav>
        </div>
        <div
          style={{ display: "flex", gap: 10, alignItems: "center" }}
          className="max-[900px]:!w-full max-[900px]:!justify-between max-[640px]:!items-stretch max-[640px]:!flex-col"
        >
          <span
            style={{
              fontFamily: "DM Mono",
              fontSize: 13,
              color: "var(--text-muted)",
            }}
            className="max-[640px]:w-full max-[640px]:justify-center"
          >
            Balance:{" "}
            <span style={{ color: "var(--gold)" }}>
              $
              {(
                settings.accountBalance +
                trades
                  .filter((t) => t.status === "CLOSED")
                  .reduce((s, t) => s + (t.pnl || 0), 0)
              ).toFixed(2)}
            </span>
          </span>
          <button
            onClick={() => {
              setEditTrade(undefined);
              setShowForm(true);
            }}
            style={{
              ...S.goldBtn,
              padding: "8px 18px",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Plus size={15} /> Log Trade
          </button>
        </div>
      </header>

      {/* Main */}
      <main
        style={{
          flex: 1,
          padding: "28px 32px",
          maxWidth: 1300,
          width: "100%",
          margin: "0 auto",
        }}
        className="max-[900px]:!px-4 max-[900px]:!py-5"
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 200,
              color: "var(--text-muted)",
              gap: 12,
            }}
          >
            <RefreshCw
              size={18}
              style={{ animation: "spin 1s linear infinite" }}
            />{" "}
            Loading your journal...
          </div>
        ) : (
          children
        )}
      </main>

      {showForm && (
        <TradeForm
          settings={settings}
          onSave={saveTrade}
          onClose={() => {
            setShowForm(false);
            setEditTrade(undefined);
          }}
          initial={editTrade}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-[120] max-w-[calc(100vw-2rem)] rounded-lg border border-[var(--border-dim)] bg-[var(--bg-panel)] px-4 py-3 text-sm text-[var(--text)] shadow-2xl max-[640px]:left-4 max-[640px]:right-4">
          <div className="flex items-start gap-3">
            <CheckCircle2
              size={18}
              className={
                toast.tone === "success" ? "text-[var(--green)]" : "text-[var(--red)]"
              }
            />
            <div className="min-w-0 flex-1">{toast.message}</div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-[var(--text-muted)] transition hover:text-[var(--text)]"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
