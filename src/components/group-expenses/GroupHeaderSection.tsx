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
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
          <Users className="h-7 w-7 text-purple-600" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t("split_bills")}</h1>
            
            {isVoicePremiumActive && (
              <span className="text-[10px] bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded-full font-black shadow-sm tracking-widest uppercase">
                Voice Premium
              </span>
            )}
            
            {!isAdmin && selectedGroupId && (
              <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-black shadow-sm tracking-widest uppercase flex items-center gap-1">
                <Eye className="h-3 w-3" /> {t("view_only")}
              </span>
            )}

            {selectedGroupId && isAdmin && (
              <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-rose-500 hover:bg-rose-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="p-6 max-w-sm w-[90%] mx-auto rounded-3xl bg-white">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-rose-600 font-bold">
                      <AlertTriangle className="h-6 w-6" /> {t("delete_group_confirm_title")}
                    </DialogTitle>
                    <DialogDescription>{t("delete_group_confirm_desc")}</DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex gap-2 mt-4">
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="rounded-xl flex-1 font-bold">{t("common.cancel")}</Button>
                    <Button onClick={handleDeleteGroup} className="bg-rose-600 text-white rounded-xl flex-1 font-bold shadow-lg hover:bg-rose-700">{t("yes_delete")}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <p className="text-slate-500 text-sm font-medium mt-1">{t("shared_billing_engine")}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className={cn("rounded-xl px-5 h-11 font-black shadow-md active:scale-95 transition-all", gradientClass)}>
              <Plus className="mr-2 h-4 w-4" /> {t("new_group")}
            </Button>
          </DialogTrigger>
          <DialogContent className="p-6 max-w-sm w-[90%] mx-auto bg-white rounded-3xl">
            <DialogHeader><DialogTitle className="text-2xl font-black text-slate-900">{t("group_name")}</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateGroup} className="space-y-4 pt-4">
              <Input placeholder={t("group_name_placeholder")} value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className={cn("h-12 rounded-xl font-bold", inputClass)} required />
              <Button type="submit" disabled={isAutoSaving} className={cn("w-full h-12 rounded-xl font-bold", gradientClass)}>
                {isAutoSaving ? <Loader2 className="animate-spin h-5 w-5" /> : t("launch_group")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200 bg-white shadow-sm hover:bg-slate-50">
          <RefreshCw className={`h-5 w-5 text-slate-600 ${isRefreshing ? 'animate-spin text-purple-600' : ''}`} />
        </Button>

        {/* 🔒 DO NOT MODIFY — dropdown binding logic */}
        <Select value={selectedGroupId} onValueChange={setSelectedGroupId} disabled={isRefreshing}>
          <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white text-slate-800 font-bold shadow-sm w-full sm:w-[200px]">
            <SelectValue placeholder={t("select_group", "Select Group")} />
          </SelectTrigger>
          <SelectContent className="rounded-xl bg-white border-slate-200 shadow-xl max-h-[300px]">
            {groups.length > 0 ? (
              groups.map((g: any) => (
                <SelectItem key={g.id} value={g.id} className="font-bold cursor-pointer text-slate-800 focus:bg-slate-100">
                  {g.name}
                </SelectItem>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-slate-500 font-medium">
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
