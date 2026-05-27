import React from "react";
import { Users, Eye, Trash2, AlertTriangle, Plus, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface GroupHeaderSectionProps {
  t: (key: string, options?: any) => string;
  isVoicePremiumActive: boolean;
  isAdmin: boolean;
  selectedGroupId: string;
  setSelectedGroupId: (id: string) => void;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  handleDeleteGroup: () => Promise<void>;
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  newGroupName: string;
  setNewGroupName: (name: string) => void;
  handleCreateGroup: (e: React.FormEvent) => Promise<void>;
  isAutoSaving: boolean;
  handleRefresh: () => Promise<void>;
  isRefreshing: boolean;
  groups: any[];
  gradientClass: string;
  inputClass: string;
}

const GroupHeaderSection: React.FC<GroupHeaderSectionProps> = ({
  t,
  isVoicePremiumActive,
  isAdmin,
  selectedGroupId,
  setSelectedGroupId,
  showDeleteConfirm,
  setShowDeleteConfirm,
  handleDeleteGroup,
  showCreateModal,
  setShowCreateModal,
  newGroupName,
  setNewGroupName,
  handleCreateGroup,
  isAutoSaving,
  handleRefresh,
  isRefreshing,
  groups,
  gradientClass,
  inputClass
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div className="flex items-center gap-5">
        <div className="p-3.5 bg-surface rounded-2xl shadow-sm border border-border">
          <Users className="h-7 w-7 text-text-secondary" />
        </div>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-foreground tracking-tight uppercase">{t("split_bills")}</h1>
            
            {isVoicePremiumActive && (
              <span className="text-[10px] bg-background text-foreground px-3 py-1 rounded-full font-bold shadow-sm tracking-widest uppercase border border-border">
                Voice Premium
              </span>
            )}
            
            {!isAdmin && selectedGroupId && (
              <span className="text-[10px] bg-background text-text-secondary px-3 py-1 rounded-full font-bold shadow-sm tracking-widest uppercase flex items-center gap-2 border border-border">
                <Eye className="h-3.5 w-3.5" /> {t("view_only")}
              </span>
            )}

            {selectedGroupId && isAdmin && (
              <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 px-3 text-text-muted hover:text-rose-500 hover:bg-background border border-transparent hover:border-border transition-all rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="p-8 max-w-sm w-[90%] mx-auto rounded-[32px] bg-surface border border-border shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex flex-col items-center gap-5 text-foreground font-bold text-xl uppercase tracking-tight">
                      <div className="w-16 h-16 rounded-2xl bg-background border border-border flex items-center justify-center shadow-inner">
                        <AlertTriangle className="h-8 w-8 text-text-muted" />
                      </div>
                      {t("delete_group_confirm_title")}
                    </DialogTitle>
                    <DialogDescription className="text-center text-text-secondary text-[11px] font-bold uppercase tracking-widest leading-relaxed pt-2">
                      {t("delete_group_confirm_desc")}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex gap-4 mt-10">
                    <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} className="rounded-xl h-14 flex-1 font-bold text-text-secondary uppercase tracking-widest text-[10px] border border-border hover:bg-background transition-all">{t("common.cancel")}</Button>
                    <Button onClick={handleDeleteGroup} className="bg-foreground text-surface rounded-xl h-14 flex-1 font-bold uppercase tracking-widest text-[10px] shadow-lg hover:bg-foreground/90 active:scale-95 transition-all">{t("yes_delete")}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <p className="text-text-muted text-[11px] font-bold uppercase tracking-widest mt-1.5">{t("shared_billing_engine")}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className={cn("rounded-xl px-6 h-12 font-bold uppercase text-[10px] tracking-widest shadow-lg active:scale-[0.98] transition-all bg-foreground text-surface hover:bg-foreground/90")}>
              <Plus className="mr-2 h-4 w-4" /> {t("new_group")}
            </Button>
          </DialogTrigger>
          <DialogContent className="p-10 max-w-sm w-[90%] mx-auto bg-surface border border-border rounded-[40px] shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground uppercase tracking-tight text-center">{t("group_name")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateGroup} className="space-y-8 pt-8">
              <Input placeholder={t("group_name_placeholder")} value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className={cn("h-16 rounded-2xl font-bold text-center text-xl bg-background border-border shadow-inner focus:border-foreground", inputClass)} required />
              <Button type="submit" disabled={isAutoSaving} className={cn("w-full h-16 rounded-2xl font-bold uppercase tracking-widest shadow-xl bg-foreground text-surface hover:bg-foreground/90")}>
                {isAutoSaving ? <Loader2 className="animate-spin h-5 w-5" /> : t("launch_group")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="icon" className="h-12 w-12 rounded-xl border-border bg-background shadow-sm hover:bg-surface hover:border-foreground/20 transition-all">
          <RefreshCw className={`h-5 w-5 text-text-secondary ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>

        {/* 🔒 DO NOT MODIFY — dropdown binding logic */}
        <Select value={selectedGroupId} onValueChange={setSelectedGroupId} disabled={isRefreshing}>
          <SelectTrigger className="h-12 rounded-xl border-border bg-surface text-foreground font-bold shadow-sm w-full sm:w-[220px] focus:ring-foreground/5">
            <SelectValue placeholder={t("select_group", "Select Group")} />
          </SelectTrigger>
          <SelectContent className="rounded-2xl bg-surface border-border text-foreground shadow-2xl max-h-[300px]">
            {groups.length > 0 ? (
              groups.map((g: any) => (
                <SelectItem key={g.id} value={g.id} className="font-bold py-3 cursor-pointer focus:bg-background focus:text-foreground">
                  {g.name}
                </SelectItem>
              ))
            ) : (
              <div className="p-6 text-center text-[10px] text-text-muted font-bold uppercase tracking-widest">
                {t("no_groups", "No groups found")}
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default GroupHeaderSection;
