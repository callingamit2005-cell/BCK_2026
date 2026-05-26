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
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-surface rounded-2xl shadow-sm border border-white/5">
          <Users className="h-7 w-7 text-white/40" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">{t("split_bills")}</h1>
            
            {isVoicePremiumActive && (
              <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full font-bold shadow-sm tracking-widest uppercase border border-white/10">
                Voice Premium
              </span>
            )}
            
            {!isAdmin && selectedGroupId && (
              <span className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded-full font-bold shadow-sm tracking-widest uppercase flex items-center gap-1 border border-white/5">
                <Eye className="h-3 w-3" /> {t("view_only")}
              </span>
            )}

            {selectedGroupId && isAdmin && (
              <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-white/20 hover:text-red-400 hover:bg-white/5">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="p-8 max-w-sm w-[90%] mx-auto rounded-[32px] bg-background border border-white/10 shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex flex-col items-center gap-4 text-white font-black text-xl uppercase tracking-tight">
                      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                      </div>
                      {t("delete_group_confirm_title")}
                    </DialogTitle>
                    <DialogDescription className="text-center text-white/40 text-[10px] font-bold uppercase tracking-widest leading-relaxed pt-2">
                      {t("delete_group_confirm_desc")}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex gap-3 mt-8">
                    <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} className="rounded-xl flex-1 font-bold text-white/40 uppercase tracking-widest text-[10px] border border-white/5 hover:bg-white/5">{t("common.cancel")}</Button>
                    <Button onClick={handleDeleteGroup} className="bg-white text-background rounded-xl flex-1 font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-white/90 active:scale-95">{t("yes_delete")}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mt-1">{t("shared_billing_engine")}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className={cn("rounded-xl px-5 h-11 font-black uppercase text-[10px] tracking-widest shadow-md active:scale-[0.98] transition-all", gradientClass)}>
              <Plus className="mr-2 h-4 w-4" /> {t("new_group")}
            </Button>
          </DialogTrigger>
          <DialogContent className="p-8 max-w-sm w-[90%] mx-auto bg-background border border-white/10 rounded-[32px] shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white uppercase tracking-tighter text-center">{t("group_name")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateGroup} className="space-y-6 pt-6">
              <Input placeholder={t("group_name_placeholder")} value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className={cn("h-14 rounded-xl font-bold text-center text-lg", inputClass)} required />
              <Button type="submit" disabled={isAutoSaving} className={cn("w-full h-14 rounded-xl font-black uppercase tracking-widest shadow-lg", gradientClass)}>
                {isAutoSaving ? <Loader2 className="animate-spin h-5 w-5" /> : t("launch_group")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="icon" className="h-11 w-11 rounded-xl border-white/5 bg-white/5 shadow-sm hover:bg-white/10">
          <RefreshCw className={`h-5 w-5 text-white/40 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>

        {/* 🔒 DO NOT MODIFY — dropdown binding logic */}
        <Select value={selectedGroupId} onValueChange={setSelectedGroupId} disabled={isRefreshing}>
          <SelectTrigger className="h-11 rounded-xl border-white/5 bg-surface text-white font-bold shadow-sm w-full sm:w-[200px]">
            <SelectValue placeholder={t("select_group", "Select Group")} />
          </SelectTrigger>
          <SelectContent className="rounded-xl bg-surface border-white/10 text-white shadow-2xl max-h-[300px]">
            {groups.length > 0 ? (
              groups.map((g: any) => (
                <SelectItem key={g.id} value={g.id} className="font-bold cursor-pointer focus:bg-white/5">
                  {g.name}
                </SelectItem>
              ))
            ) : (
              <div className="p-4 text-center text-[10px] text-white/20 font-bold uppercase tracking-widest">
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
