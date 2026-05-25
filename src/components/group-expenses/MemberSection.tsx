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
      <CardHeader className="bg-slate-50 py-4 border-b border-slate-100">
        <CardTitle className="text-base font-black flex items-center gap-2 text-slate-800">
          <Users className="h-5 w-5 text-purple-600" /> {t("members")} ({activeMembers.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        {isAdmin && (
          <div className="flex gap-2">
            <Input 
              placeholder="Name" 
              value={memberName} 
              onChange={e => setMemberName(e.target.value)} 
              className={cn("h-11 rounded-xl", inputClass)} 
            />
            <Button 
              type="button" 
              onClick={handleAddMember} 
              disabled={!memberName.trim() || isAddingMember} 
              className={cn("h-11 px-5 rounded-xl font-bold", gradientClass)}
            >
              {isAddingMember ? <Loader2 className="animate-spin h-4 w-4" /> : t("add")}
            </Button>
          </div>
        )}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {members.map((m: any) => (
            <div 
              key={m.id} 
              className={cn(
                "flex justify-between items-center p-3 rounded-xl border shadow-sm transition-colors", 
                m.is_deleted ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-100 hover:border-purple-200"
              )}
            >
              <span className="text-sm font-bold text-slate-700">
                {m.name} {m.role === 'admin' && '👑'} {m.is_deleted && <span className="ml-2 text-xs text-slate-400 font-normal italic">(Departed)</span>}
              </span>
              {isAdmin && m.role !== 'admin' && !m.is_deleted && (
                <Trash2
                  className="h-4 w-4 text-slate-300 hover:text-red-500 cursor-pointer"
                  onClick={() => onDeleteMember(m)}
                />
              )}
            </div>
          ))}
        </div>
        
        {isAdmin && (
          <Button 
            onClick={handleInviteShare} 
            className="w-full flex items-center justify-center gap-2 h-12 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-xl font-bold transition-all mt-2"
          >
            <Share2 className="h-4 w-4" /> {t("invite_whatsapp")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberSection;
