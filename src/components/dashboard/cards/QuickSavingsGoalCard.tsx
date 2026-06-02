/**
 * QuickSavingsGoalCard.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Performance Savings Performance Terminal.
 * 🛡️ LOGIC LOCK: Goal fetching, progress math, and navigation 100% untouched.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Target, ArrowRight, TrendingUp, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currencyFormatter";
import { fetchLocalOrCloud } from "@/integrations/sqliteService";

type TFunc = (key: string, defaultValue?: string) => string;

interface QuickSavingsGoalCardProps {
  userId: string | undefined;
  savedAmount: number;
  t?: TFunc;
}

// Progress colour mapping (Locked logic, Upgraded tokens)
function progressColor(pct: number) {
  if (pct >= 75) return '[&>div]:bg-income';
  if (pct >= 40) return '[&>div]:bg-warning';
  return '[&>div]:bg-savings';
}

export const QuickSavingsGoalCard: React.FC<QuickSavingsGoalCardProps> = ({
  userId,
  savedAmount,
  t,
}) => {
  const navigate = useNavigate();

  // Data Engine (Locked)
  const { data: primaryGoal } = useQuery({
    queryKey: ["savings-goals", userId],
    queryFn: async () => {
      if (!userId) return null;
      const rows = await fetchLocalOrCloud("savings_goals", userId);
      if (!rows || rows.length === 0) return null;

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
  const hasGoal = target > 0;
  const progressPct = Math.round(progress);

  return (
    <Card className="fintech-card overflow-hidden">
      <CardHeader className="p-6 sm:p-8 border-b border-border/50 bg-muted/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-savings/10 border border-savings/20 flex items-center justify-center shrink-0 shadow-sm">
              <Target className="h-5 w-5 text-savings" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg font-bold text-foreground tracking-tight truncate">
                {primaryGoal?.name ?? (t?.("dashboard.quickSavingsGoal.title", "Savings Goal") ?? "Savings Goal")}
              </CardTitle>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                {hasGoal ? "Active Performance Track" : "Goal Initialization Required"}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/savings")}
            className="h-9 rounded-lg bg-surface border border-border/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-all shadow-sm px-4 gap-2"
          >
            {t?.("dashboard.quickSavingsGoal.manage", "Manage") ?? "Manage"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8 space-y-8">
        {/* STAT GRID */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-savings/5 border border-savings/20 p-5 group hover:border-savings/30 transition-all duration-300">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 truncate opacity-80 group-hover:opacity-100">
              {t?.("dashboard.quickSavingsGoal.saved", "Net Retained") ?? "Net Retained"}
            </p>
            <p className={cn(
              "text-2xl sm:text-3xl font-bold font-mono tracking-tighter leading-none tabular-nums",
              safeSaved < 0 ? "text-expense" : "text-savings"
            )}>
              {formatCurrency(safeSaved)}
            </p>
          </div>

          <div className="rounded-2xl bg-muted/10 border border-border/40 p-5 group hover:border-primary/20 transition-all duration-300">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 truncate opacity-80 group-hover:opacity-100">
              {t?.("dashboard.quickSavingsGoal.goal", "Target Depth") ?? "Target Depth"}
            </p>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tighter leading-none tabular-nums">
              {hasGoal ? formatCurrency(target) : "—"}
            </p>
          </div>
        </div>

        {/* PROGRESS SYSTEM */}
        {hasGoal ? (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-primary/60" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Efficiency Index
                </span>
              </div>
              <div className={cn(
                "px-2.5 py-1 rounded-lg border text-[10px] font-bold font-mono shadow-sm",
                progressPct >= 75 ? "text-income bg-income/5 border-income/20"
                : progressPct >= 40 ? "text-warning bg-warning/5 border-warning/20"
                : "text-savings bg-savings/5 border-savings/20"
              )}>
                {progressPct}%
              </div>
            </div>
            
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border/40">
              <Progress
                value={progress}
                className={cn("h-full transition-all duration-1000 ease-out", progressColor(progressPct))}
              />
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-muted/10 border border-dashed border-border/50 rounded-2xl">
             <Wallet className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
             <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest leading-relaxed">
               {t?.("dashboard.quickSavingsGoal.setGoalPrompt", "Initialize a savings goal to activate efficiency tracking") ?? "Initialize a savings goal to activate efficiency tracking"}
             </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

QuickSavingsGoalCard.displayName = 'QuickSavingsGoalCard';
