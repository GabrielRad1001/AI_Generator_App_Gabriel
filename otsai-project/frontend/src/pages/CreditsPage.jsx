import React, { useEffect, useState } from "react";
import { Coins, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, Badge } from "../components/ui/card";
import { credits as creditsApi } from "../lib/api";

export default function CreditsPage() {
  const [data, setData] = useState({ balance: 0, transactions: [] });

  useEffect(() => {
    (async () => { try { const r = await creditsApi.me(); setData(r); } catch {} })();
  }, []);

  const totalEarned = data.transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalSpent = -data.transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-8 lg:p-12 max-w-5xl">
      <span className="text-xs uppercase tracking-[0.25em] text-brand font-bold">— Credits</span>
      <h1 className="mt-4 text-4xl md:text-5xl font-medium tracking-tightest">Your credit ledger</h1>
      <p className="mt-3 text-ink-secondary">Every credit, accounted for.</p>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-bg-surface border border-line p-6">
          <Coins className="w-5 h-5 text-brand" strokeWidth={1.5} />
          <div className="mt-4 text-[10px] uppercase tracking-[0.22em] text-ink-muted">Current balance</div>
          <div className="mt-2 text-4xl font-medium text-brand" data-testid="credits-balance">{data.balance}</div>
        </div>
        <div className="bg-bg-surface border border-line p-6">
          <ArrowUpRight className="w-5 h-5 text-ink-muted" strokeWidth={1.5} />
          <div className="mt-4 text-[10px] uppercase tracking-[0.22em] text-ink-muted">Total earned</div>
          <div className="mt-2 text-4xl font-medium text-ink-primary">{totalEarned}</div>
        </div>
        <div className="bg-bg-surface border border-line p-6">
          <ArrowDownRight className="w-5 h-5 text-ink-muted" strokeWidth={1.5} />
          <div className="mt-4 text-[10px] uppercase tracking-[0.22em] text-ink-muted">Total spent</div>
          <div className="mt-2 text-4xl font-medium text-ink-primary">{totalSpent}</div>
        </div>
      </div>

      <Card className="mt-10" data-testid="credits-ledger">
        <h3 className="text-lg font-medium mb-4">Transaction history</h3>
        {data.transactions.length === 0 ? (
          <div className="text-sm text-ink-muted py-12 text-center">No transactions yet.</div>
        ) : (
          <div className="divide-y divide-line">
            {data.transactions.map((t) => (
              <div key={t.transaction_id} className="py-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={t.amount > 0 ? "brand" : "default"}>{t.type}</Badge>
                    <span className="text-xs text-ink-muted">{new Date(t.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-ink-primary truncate">{t.description}</div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-medium font-mono ${t.amount > 0 ? "text-brand" : "text-ink-primary"}`}>
                    {t.amount > 0 ? "+" : ""}{t.amount}
                  </div>
                  <div className="text-xs text-ink-muted">→ {t.balance_after}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
