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
    <Card className={cn("bg-card border-border/40 shadow-sm rounded-xl overflow-hidden")}>
      <CardHeader className="bg-background/50 py-5 border-b border-border/40">
        <CardTitle className="text-base font-black flex items-center gap-4 text-foreground uppercase tracking-tighter">
          <Users className="h-5 w-5 text-primary" /> {t("members")} ({activeMembers.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 p-6">
        {isAdmin && (
          <div className="flex gap-3">
            <Input 
              placeholder={t('dashboard.enterName', "Enter name")} 
              value={memberName} 
              onChange={e => setMemberName(e.target.value)} 
              className={cn("h-12 rounded-xl font-black bg-background border-border/40 shadow-inner focus:border-primary placeholder:text-muted-foreground/40", inputClass)} 
            />
            <Button 
              type="button" 
              onClick={handleAddMember} 
              disabled={!memberName.trim() || isAddingMember} 
              className={cn("h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-md")}
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
                "flex justify-between items-center p-5 rounded-2xl border transition-all duration-700 ease-in-out shadow-sm group/item", 
                m.is_deleted ? "bg-background border-border/40 opacity-40" : "bg-card border-border/40 hover:border-primary/20 hover:bg-background/40"
              )}
            >
              <span className="text-[15px] font-black text-foreground tracking-tight">
                {m.name} {m.role === 'admin' && '👑'} {m.is_deleted && <span className="ml-2 text-[10px] text-muted-foreground font-black uppercase tracking-wider italic">({t('common.deleted', 'Departed')})</span>}
              </span>
              {isAdmin && m.role !== 'admin' && !m.is_deleted && (
                <button
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-background transition-all duration-300 opacity-0 group-hover/item:opacity-100 transform translate-x-2 group-hover/item:translate-x-0"
                  onClick={() => onDeleteMember(m)}
                  title={t('common.delete', "Remove Member")}
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
            className="w-full flex items-center justify-center gap-3 h-14 bg-background text-muted-foreground hover:text-foreground hover:bg-card border border-border/40 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all mt-4 shadow-sm"
          >
            <Share2 className="h-4 w-4 text-primary" /> {t("invite_whatsapp")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberSection;
