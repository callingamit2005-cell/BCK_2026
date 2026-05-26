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
        "bg-surface rounded-[24px] border border-border shadow-sm",
        "text-white",
      )}
    >
      <CardHeader className="p-7 pb-3">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tighter font-mono">
              <Target className="h-5 w-5 text-white/40" />
              {t?.("dashboard.quickSavingsGoal.title", "Quick Savings Goal") ?? "Quick Savings Goal"}
            </CardTitle>
            <p className="mt-1 text-[9px] uppercase tracking-[0.25em] text-white/20 font-mono font-bold">
              {primaryGoal
                ? (t?.("dashboard.quickSavingsGoal.subtitle", "This month vs your primary goal") ??
                    "This month vs your primary goal")
                : (t?.("dashboard.quickSavingsGoal.noGoal", "No goal set yet — create one in Savings") ??
                    "No goal set yet — create one in Savings")}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/savings")}
            className={cn(
              "shrink-0 h-10 rounded-xl border-white/5 bg-white/5 hover:bg-white/10",
              "text-white font-bold text-[9px] uppercase tracking-widest transition-all",
            )}
          >
            {t?.("dashboard.quickSavingsGoal.manage", "Manage") ?? "Manage"}
            <ArrowRight className="ml-2 h-3 w-3 opacity-40" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-7 pb-7 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
            <p className="text-[8px] uppercase tracking-widest text-white/40 font-bold font-mono">
              {t?.("dashboard.quickSavingsGoal.saved", "Saved") ?? "Saved"}
            </p>
            <p
              className={cn(
                "mt-1 text-xl font-black font-mono tracking-tighter",
                safeSaved >= 0 ? "text-white" : "text-white/60",
              )}
              data-numeric="true"
            >
              {formatCurrency(safeSaved)}
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
            <p className="text-[8px] uppercase tracking-widest text-white/40 font-bold font-mono">
              {t?.("dashboard.quickSavingsGoal.goal", "Goal") ?? "Goal"}
            </p>
            <p className="mt-1 text-xl font-black font-mono text-white tracking-tighter" data-numeric="true">
              {target > 0 ? formatCurrency(target) : "—"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold uppercase tracking-widest text-white/40 font-mono">
              {t?.("dashboard.quickSavingsGoal.progress", "Progress") ?? "Progress"}
            </span>
            <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest font-mono" data-numeric="true">
              {target > 0 ? `${Math.round(progress)}%` : "—"}
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-white/5" />
        </div>
      </CardContent>
    </Card>
  );
};

