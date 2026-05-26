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
    <Card className={cardStyle}>
      <CardHeader className="bg-white/5 py-4 border-b border-white/5">
        <CardTitle className="text-base font-black flex items-center gap-3 text-white uppercase tracking-tighter">
          <Users className="h-5 w-5 text-white/40" /> {t("members")} ({activeMembers.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        {isAdmin && (
          <div className="flex gap-2">
            <Input 
              placeholder="Name" 
              value={memberName} 
              onChange={e => setMemberName(e.target.value)} 
              className={cn("h-11 rounded-xl font-bold", inputClass)} 
            />
            <Button 
              type="button" 
              onClick={handleAddMember} 
              disabled={!memberName.trim() || isAddingMember} 
              className={cn("h-11 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest", gradientClass)}
            >
              {isAddingMember ? <Loader2 className="animate-spin h-4 w-4" /> : t("add")}
            </Button>
          </div>
        )}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {members.map((m: any) => (
            <div 
              key={m.id} 
              className={cn(
                "flex justify-between items-center p-3 rounded-xl border transition-all duration-300", 
                m.is_deleted ? "bg-white/5 border-white/5 opacity-40" : "bg-white/5 border-white/5 hover:border-white/10"
              )}
            >
              <span className="text-xs font-bold text-white/80">
                {m.name} {m.role === 'admin' && '👑'} {m.is_deleted && <span className="ml-2 text-[9px] text-white/20 font-bold uppercase tracking-widest italic">(Departed)</span>}
              </span>
              {isAdmin && m.role !== 'admin' && !m.is_deleted && (
                <Trash2
                  className="h-3.5 w-3.5 text-white/20 hover:text-red-400 cursor-pointer transition-colors"
                  onClick={() => onDeleteMember(m)}
                />
              )}
            </div>
          ))}
        </div>
        
        {isAdmin && (
          <Button 
            onClick={handleInviteShare} 
            className="w-full flex items-center justify-center gap-2 h-12 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/10 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all mt-2"
          >
            <Share2 className="h-3.5 w-3.5" /> {t("invite_whatsapp")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberSection;
