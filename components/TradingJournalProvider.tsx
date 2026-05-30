"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Trade, Settings, AccountType } from "@/lib/types";

type Toast = {
  message: string;
  tone: "success" | "error";
};

type JournalContextType = {
  trades: Trade[];
  settings: Settings;
  accountType: AccountType;
  showForm: boolean;
  editTrade: Trade | undefined;
  loading: boolean;
  toast: Toast | null;
  filterStatus: string;
  searchText: string;
  filteredTrades: Trade[];
  setShowForm: (show: boolean) => void;
  setEditTrade: (trade: Trade | undefined) => void;
  setFilterStatus: (status: string) => void;
  setSearchText: (text: string) => void;
  setToast: (toast: Toast | null) => void;
  setAccountType: (type: AccountType) => void;
  saveTrade: (form: Partial<Trade>) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  saveSettings: (s: Settings) => Promise<void>;
  updateSettings: (nextSettings: Settings) => void;
  resetAll: () => Promise<void>;
};

const JournalContext = createContext<JournalContextType | null>(null);

export function useTradingJournal() {
  const ctx = useContext(JournalContext);
  if (!ctx) {
    throw new Error("useTradingJournal must be used within TradingJournalProvider");
  }
  return ctx;
}

export function TradingJournalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [settings, setSettings] = useState<Settings>({
    accountType: "REAL",
    accountBalance: 0,
    riskPerTrade: 0,
    maxDailyLoss: 0,
    maxDailyTrades: 0,
    rrRatio: 2,
    currency: "",
    broker: "",
    tradingName: "",
  });
  const [accountType, setAccountTypeState] = useState<AccountType>("REAL");
  const [showForm, setShowForm] = useState(false);
  const [editTrade, setEditTrade] = useState<Trade | undefined>();
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchText, setSearchText] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);

  // Load persisted account type from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("goldjournal_accountType");
      if (saved === "DEMO" || saved === "REAL") {
        setAccountTypeState(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setAccountType = useCallback((type: AccountType) => {
    setAccountTypeState(type);
    try {
      localStorage.setItem("goldjournal_accountType", type);
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/trades?accountType=${accountType}`);
      const data = await r.json();
      setTrades(data.trades || []);
      setSettings(data.settings);
    } catch {
      /* ignore */
    }
  }, [accountType]);

  useEffect(() => {
    let mounted = true;

    fetch(`/api/trades?accountType=${accountType}`)
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
  }, [accountType]);

  const saveTrade = async (form: Partial<Trade>) => {
    const payload = { ...form, accountType };
    if (editTrade) {
      await fetch("/api/trades", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editTrade, ...payload }),
      });
    } else {
      await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    const payload = { ...s, accountType };
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setToast({ message: "Could not save settings.", tone: "error" });
      return;
    }
    setSettings(payload);
    setToast({ message: "Settings saved.", tone: "success" });
  };

  const updateSettings = (nextSettings: Settings) => {
    setSettings(nextSettings);
  };

  const resetAll = async () => {
    const response = await fetch(`/api/reset?accountType=${accountType}`, { method: "POST" });
    if (!response.ok) {
      setToast({ message: "Could not reset journal data.", tone: "error" });
      return;
    }
    await load();
    setFilterStatus("ALL");
    setSearchText("");
    setShowForm(false);
    setEditTrade(undefined);
    setToast({ message: "All data has been reset.", tone: "success" });
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

  return (
    <JournalContext.Provider
      value={{
        trades,
        settings,
        accountType,
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
        setAccountType,
        saveTrade,
        deleteTrade,
        saveSettings,
        updateSettings,
        resetAll,
      }}
    >
      {children}
    </JournalContext.Provider>
  );
}
