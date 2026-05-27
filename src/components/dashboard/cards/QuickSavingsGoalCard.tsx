import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Target, ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currencyFormatter";
import { fetchLocalOrCloud } from "@/integrations/sqliteService";

type TFunc = (key: string, defaultValue?: string) => string;

interface QuickSavingsGoalCardProps {
  userId: string | undefined;
  /**
   * Current period savings computed from ledger/transactions (e.g. monthly net saved).
   */
  savedAmount: number;
  t?: TFunc;
}

export const QuickSavingsGoalCard: React.FC<QuickSavingsGoalCardProps> = ({ userId, savedAmount, t }) => {
  const navigate = useNavigate();

  const { data: primaryGoal } = useQuery({
    queryKey: ["savings-goals", userId],
    queryFn: async () => {
      if (!userId) return null;
      const rows = await fetchLocalOrCloud("savings_goals", userId);
      if (!rows || rows.length === 0) return null;

      // Prefer latest goal if the shape has created_at; otherwise fallback to first row.
      const sorted = [...rows].sort((a: any, b: any) => {
        const ta = new Date(a.created_at || 0).getTime();
        const tb = new Date(b.created_at || 0).getTime();
        return tb - ta;
      });

      const g = sorted[0];
      return {
        id: String(g.id),
        name: String(g.goal_name || "Savings Goal"),
        targetAmount: Number(g.target_amount || 0),
      };
    },
    enabled: Boolean(userId),
  });

  const safeSaved = Number.isFinite(savedAmount) ? savedAmount : 0;
  const savedForProgress = Math.max(0, safeSaved);
  const target = primaryGoal?.targetAmount ? Math.max(0, primaryGoal.targetAmount) : 0;
  const progress = target > 0 ? Math.min(100, (savedForProgress / target) * 100) : 0;

  return (
    <Card
      className={cn(
        "bg-surface rounded-[32px] border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-700 ease-butter-soft hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
        "text-[#1a1a1a]",
      )}
    >
      <CardHeader className="p-10 pb-6 border-b border-border/40 bg-background/50">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex items-center gap-6">
            {/* Circular Premium Icon Container - Savings Style */}
            <div className="h-14 w-14 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 hover:scale-110">
              <Target className="h-6 w-6 text-[#DC2626]" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black uppercase tracking-tighter leading-tight">
                {t?.("dashboard.quickSavingsGoal.title", "Savings Performance") ?? "Savings Performance"}
              </CardTitle>
              <p className="mt-1.5 text-[11px] uppercase tracking-[0.25em] text-fintech-graphite-muted font-black opacity-60">
                {primaryGoal
                  ? (t?.("dashboard.quickSavingsGoal.subtitle", "Monthly Velocity Audit") ??
                      "Monthly Velocity Audit")
                  : (t?.("dashboard.quickSavingsGoal.noGoal", "No target established") ??
                      "No target established")}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/savings")}
            className={cn(
              "shrink-0 h-12 px-6 rounded-2xl border-border/60 bg-background hover:bg-[#1a1a1a] hover:text-white transition-all duration-500",
              "text-fintech-graphite-muted hover:text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-sm active:scale-95",
            )}
          >
            {t?.("dashboard.quickSavingsGoal.manage", "Optimize") ?? "Optimize"}
            <ArrowRight className="ml-3 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-10 space-y-10">
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-[28px] bg-background/[0.02] border border-border/40 p-8 shadow-sm group/item flex items-center gap-5">
            <div className="h-10 w-10 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] flex items-center justify-center shrink-0">
               <div className="w-2 h-2 rounded-full bg-[#DC2626] opacity-30 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-fintech-graphite-muted font-black mb-1 opacity-60">
                {t?.("dashboard.quickSavingsGoal.saved", "Secured") ?? "Secured"}
              </p>
              <p className="text-2xl font-black font-mono tracking-tighter text-[#1a1a1a] leading-none tabular-nums">
                {formatCurrency(safeSaved)}
              </p>
            </div>
          </div>

          <div className="rounded-[28px] bg-background/[0.02] border border-border/40 p-8 shadow-sm group/item flex items-center gap-5">
            <div className="h-10 w-10 rounded-full bg-background border border-border/60 flex items-center justify-center shrink-0">
               <div className="w-2 h-2 rounded-full bg-fintech-graphite-muted opacity-20" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-fintech-graphite-muted font-black mb-1 opacity-60">
                {t?.("dashboard.quickSavingsGoal.goal", "Target") ?? "Target"}
              </p>
              <p className="text-2xl font-black font-mono text-fintech-graphite-muted tracking-tighter leading-none tabular-nums">
                {target > 0 ? formatCurrency(target) : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-fintech-graphite-muted opacity-60">
              {t?.("dashboard.quickSavingsGoal.progress", "Threshold Progress") ?? "Threshold Progress"}
            </span>
            <span className="text-[11px] font-black text-[#DC2626] uppercase tracking-[0.2em] font-mono bg-[#FEE2E2] px-3 py-1 rounded-lg border border-[#FECACA]">
              {target > 0 ? `${Math.round(progress)}%` : "—"}
            </span>
          </div>
          <div className="p-1.5 bg-background border border-border/40 rounded-full shadow-inner">
            <Progress value={progress} className="h-2.5 bg-transparent" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

