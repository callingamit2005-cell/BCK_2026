import React from "react";
import { Users, Loader2, Trash2, Share2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MemberSectionProps {
  t: (key: string, options?: any) => string;
  members: any[];
  activeMembers: any[];
  isAdmin: boolean;
  memberName: string;
  setMemberName: (name: string) => void;
  handleAddMember: (e: React.MouseEvent) => Promise<void>;
  isAddingMember: boolean;
  onDeleteMember: (member: any) => Promise<void>;
  handleInviteShare: () => void;
  cardStyle: string;
  inputClass: string;
  gradientClass: string;
}

const MemberSection: React.FC<MemberSectionProps> = ({
  t,
  members,
  activeMembers,
  isAdmin,
  memberName,
  setMemberName,
  handleAddMember,
  isAddingMember,
  onDeleteMember,
  handleInviteShare,
  cardStyle,
  inputClass,
  gradientClass
}) => {
  return (
    <Card className={cn("bg-surface border-border shadow-sm rounded-[32px] overflow-hidden")}>
      <CardHeader className="bg-background/50 py-5 border-b border-border">
        <CardTitle className="text-base font-bold flex items-center gap-4 text-foreground uppercase tracking-tight">
          <Users className="h-5 w-5 text-text-secondary" /> {t("members")} ({activeMembers.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 p-6">
        {isAdmin && (
          <div className="flex gap-3">
            <Input 
              placeholder="Enter name" 
              value={memberName} 
              onChange={e => setMemberName(e.target.value)} 
              className={cn("h-12 rounded-xl font-bold bg-background border-border shadow-inner focus:border-foreground", inputClass)} 
            />
            <Button 
              type="button" 
              onClick={handleAddMember} 
              disabled={!memberName.trim() || isAddingMember} 
              className={cn("h-12 px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest bg-foreground text-surface hover:bg-foreground/90 shadow-lg")}
            >
              {isAddingMember ? <Loader2 className="animate-spin h-4 w-4" /> : t("add")}
            </Button>
          </div>
        )}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-3 custom-scrollbar">
          {members.map((m: any) => (
            <div 
              key={m.id} 
              className={cn(
                "flex justify-between items-center p-5 rounded-2xl border transition-all duration-700 ease-butter-soft shadow-sm group/item", 
                m.is_deleted ? "bg-background border-border/40 opacity-40" : "bg-surface border-border/40 hover:border-border/80 hover:bg-background/40"
              )}
            >
              <span className="text-[15px] font-black text-[#1a1a1a] tracking-tight">
                {m.name} {m.role === 'admin' && '👑'} {m.is_deleted && <span className="ml-2 text-[10px] text-fintech-graphite-muted font-black uppercase tracking-[0.2em] italic">(Departed)</span>}
              </span>
              {isAdmin && m.role !== 'admin' && !m.is_deleted && (
                <button
                  className="p-2 rounded-xl text-fintech-graphite-muted hover:text-rose-500 hover:bg-rose-50 transition-all duration-300 opacity-0 group-hover/item:opacity-100 transform translate-x-2 group-hover/item:translate-x-0"
                  onClick={() => onDeleteMember(m)}
                  title="Remove Member"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        
        {isAdmin && (
          <Button 
            onClick={handleInviteShare} 
            className="w-full flex items-center justify-center gap-3 h-14 bg-background text-text-secondary hover:text-foreground hover:bg-surface border border-border rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-all mt-4 shadow-sm"
          >
            <Share2 className="h-4 w-4" /> {t("invite_whatsapp")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberSection;
