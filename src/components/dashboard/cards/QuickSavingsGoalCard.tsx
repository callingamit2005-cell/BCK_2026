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
        "glass-v2 rounded-[32px] border-0 shadow-[0_0_60px_-20px_rgba(255,15,123,0.35)]",
        "text-white",
      )}
    >
      <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 to-[#ff0f7b]" />
      <CardHeader className="p-7 pb-3">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-3 text-lg sm:text-xl font-black uppercase italic tracking-tighter font-mono">
              <Target className="h-5 w-5 text-[#ff0f7b]" />
              {t?.("dashboard.quickSavingsGoal.title", "Quick Savings Goal") ?? "Quick Savings Goal"}
            </CardTitle>
            <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-white/60 font-mono">
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
              "shrink-0 h-10 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10",
              "text-white font-black text-[10px] uppercase tracking-widest",
            )}
          >
            {t?.("dashboard.quickSavingsGoal.manage", "Manage") ?? "Manage"}
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-7 pb-7 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-[24px] bg-white/[0.06] border border-white/10 p-4">
            <p className="text-[9px] uppercase tracking-widest text-white/60 font-black font-mono">
              {t?.("dashboard.quickSavingsGoal.saved", "Saved") ?? "Saved"}
            </p>
            <p
              className={cn(
                "mt-1 text-xl sm:text-2xl font-black font-mono",
                safeSaved >= 0 ? "text-emerald-300" : "text-rose-300",
              )}
              data-numeric="true"
            >
              {formatCurrency(safeSaved)}
            </p>
          </div>

          <div className="rounded-[24px] bg-white/[0.06] border border-white/10 p-4">
            <p className="text-[9px] uppercase tracking-widest text-white/60 font-black font-mono">
              {t?.("dashboard.quickSavingsGoal.goal", "Goal") ?? "Goal"}
            </p>
            <p className="mt-1 text-xl sm:text-2xl font-black font-mono text-white" data-numeric="true">
              {target > 0 ? formatCurrency(target) : "—"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/60 font-mono">
              {t?.("dashboard.quickSavingsGoal.progress", "Progress") ?? "Progress"}
            </span>
            <span className="text-[10px] font-black text-[#ff0f7b] uppercase tracking-widest font-mono" data-numeric="true">
              {target > 0 ? `${Math.round(progress)}%` : "—"}
            </span>
          </div>
          <Progress value={progress} className="h-3 bg-white/10" />
        </div>
      </CardContent>
    </Card>
  );
};

