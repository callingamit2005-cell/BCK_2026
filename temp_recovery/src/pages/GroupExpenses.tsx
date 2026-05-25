import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link, useLocation, useSearchParams } from "react-router-dom";

/* ✅ FEATURES IMPORTED */
import BillRoulette from "@/components/groups/BillRoulette";
import TripAdvisor from "@/components/groups/TripAdvisor";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import {
  Trash2,
  ArrowRight,
  Clock,
  Users,
  CreditCard,
  Wallet,
  LayoutDashboard,
  PiggyBank,
  Sparkles,
  Map,
  Mic,
  MicOff,
  Share2,
} from "lucide-react";

import { calculateSplit } from "@/features/split-expense/utils/splitCalculator";
import { computeBalances, simplifyDebts } from "@/features/split-expense/utils/simplifyDebts";
import type { SplitType } from "@/features/split-expense/types";

// Voice hook – AI‑powered split expense voice input
import { useSplitAIVoice } from "@/voice/integrations/useSplitAIVoice";

// Layout Components
import AppHeader from "@/components/layout/AppHeader";

/**
 * GroupExpenses – Split expense management with Smart Voice Entry
 * 
 * Voice Flow:
 * 1. User taps mic → request permission (stream immediately released)
 * 2. useSplitAIVoice captures speech, parses via AI + fallback regex
 * 3. Parsed fields update local state (title, amount, paidBy, splitType)
 * 4. After 10 seconds of silence, autoSave() triggers addExpense()
 * 5. Expense is saved to DB, splits calculated, form resets
 * 
 * Silence detection: 10,000 ms debounce, resets on each new transcript.
 * Autosave: only when title, amount, and paidBy are all filled.
 * No confirmations – fully automatic.
 */
const GroupExpenses = () => {
  const { user, signOut } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [groupName, setGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [memberName, setMemberName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePaidByMemberId, setExpensePaidByMemberId] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [customSplits, setCustomSplits] = useState<Record<string, number>>({});

  // Ref to keep members list up‑to‑date for voice name → ID mapping
  const membersRef = useRef<any[]>([]);
  // Ref to store media stream for permission check cleanup
  const streamRef = useRef<MediaStream | null>(null);

  // Trip Advisor state
  const [tripAdvisorOpen, setTripAdvisorOpen] = useState(false);

  // Auto‑save loading state to prevent duplicate submissions
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Parse plan from URL (if any)
  const planParam = searchParams.get("plan");
  const initialPlan = planParam ? JSON.parse(decodeURIComponent(planParam)) : null;

  // ================= GROUPS QUERY =================
  const { data: groups = [], refetch: refetchGroups } = useQuery({
    queryKey: ["groups", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];

      const { data: memberRows } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      const { data: ownedGroups } = await supabase
        .from("groups")
        .select("id")
        .eq("user_id", user.id);

      const allIds = [
        ...new Set([
          ...(memberRows?.map((r) => r.group_id) || []),
          ...(ownedGroups?.map((r) => r.id) || []),
        ]),
      ];

      if (allIds.length === 0) return [];

      const { data } = await supabase
        .from("groups")
        .select("*")
        .in("id", allIds)
        .order("created_at", { ascending: false });

      return data ?? [];
    },
  });

  // ============ MEMBERS QUERY ============
  const { data: members = [], refetch: refetchMembers } = useQuery({
    queryKey: ["group-members", selectedGroupId],
    enabled: !!selectedGroupId,
    queryFn: async () => {
      const { data } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", selectedGroupId);
      return data ?? [];
    },
  });

  // Update members ref whenever members change
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  // ============ EXPENSES QUERY ============
  const { data: expenses = [], refetch: refetchExpenses } = useQuery({
    queryKey: ["group-expenses", selectedGroupId],
    enabled: !!selectedGroupId,
    queryFn: async () => {
      const { data } = await supabase
        .from("group_expenses")
        .select("*")
        .eq("group_id", selectedGroupId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // ============ EXPENSE SPLITS QUERY ============
  const { data: splits = [], refetch: refetchSplits } = useQuery({
    queryKey: ["expense-splits", selectedGroupId],
    enabled: !!selectedGroupId,
    queryFn: async () => {
      const { data } = await supabase
        .from("expense_splits")
        .select("*")
        .eq("group_id", selectedGroupId);
      return data ?? [];
    },
  });

  // 🔥 Real-time subscriptions
  useEffect(() => {
    if (!selectedGroupId) return;
    const channel = supabase
      .channel(`group-${selectedGroupId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_members", filter: `group_id=eq.${selectedGroupId}` },
        () => refetchMembers()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_expenses", filter: `group_id=eq.${selectedGroupId}` },
        () => {
          refetchExpenses();
          refetchSplits();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expense_splits", filter: `group_id=eq.${selectedGroupId}` },
        () => refetchSplits()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedGroupId, refetchMembers, refetchExpenses, refetchSplits]);

  // ============ AUTO-SELECT GROUP FROM URL ============
  useEffect(() => {
    const groupIdFromUrl = searchParams.get("groupId");
    if (!groupIdFromUrl) return;

    if (groups.length === 0) {
      console.log("[AutoSelect] Groups not loaded yet, waiting...");
      return;
    }

    const groupExists = groups.some((g: any) => g.id === groupIdFromUrl);
    if (groupExists) {
      console.log("[AutoSelect] Found group in list, selecting:", groupIdFromUrl);
      setSelectedGroupId(groupIdFromUrl);
    } else {
      console.warn("[AutoSelect] Group ID from URL not found in user groups:", groupIdFromUrl);
      toast({ title: t('groupExpenses.groupNotFound'), variant: "destructive" });
    }
  }, [searchParams, groups, toast, t]);

  // ============ AUTO-OPEN TRIP PLANNER ============
  useEffect(() => {
    const openTrip = searchParams.get("openTripPlan");
    const groupIdFromUrl = searchParams.get("groupId");

    if (openTrip !== "true" || !groupIdFromUrl) return;

    if (selectedGroupId === groupIdFromUrl) {
      console.log("[AutoOpen] Group already selected, opening popup");
      setTripAdvisorOpen(true);

      const newParams = new URLSearchParams(searchParams);
      newParams.delete("openTripPlan");
      newParams.delete("groupId");
      newParams.delete("plan");
      navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
    } else {
      console.log("[AutoOpen] Waiting for group selection...");
    }
  }, [searchParams, selectedGroupId, navigate, location.pathname]);

  // ============ ADD EXPENSE FUNCTION (used both manually and by auto‑save) ============
  const addExpense = async () => {
    // Prevent duplicate submissions while auto‑saving
    if (isAutoSaving) return;

    // Required fields check
    if (!expenseTitle || !expenseAmount || !expensePaidByMemberId) {
      console.warn("Auto‑save skipped: missing required fields");
      return;
    }

    setIsAutoSaving(true);
    const amount = Number(expenseAmount);

    try {
      const { data: expData, error } = await supabase
        .from("group_expenses")
        .insert({
          group_id: selectedGroupId,
          title: expenseTitle,
          amount,
          paid_by_member_id: expensePaidByMemberId,
          user_id: user?.id,
          split_type: splitType,
          notes: expenseNotes || null,
          paid_by: members.find((m: any) => m.id === expensePaidByMemberId)?.name,
        })
        .select()
        .single();

      if (error || !expData) {
        toast({ title: t('groupExpenses.errorAddingExpense'), variant: "destructive" });
        setIsAutoSaving(false);
        return;
      }

      const splitResults = calculateSplit({
        amount,
        splitType,
        members: members.map((m: any) => ({ memberId: m.id, name: m.name })),
        customValues: splitType !== "equal" ? customSplits : undefined,
      });

      const { error: splitError } = await supabase.from("expense_splits").insert(
        splitResults.map((sr) => ({
          expense_id: expData.id,
          group_id: selectedGroupId,
          member_id: sr.memberId,
          share_amount: sr.shareAmount,
          user_id: user?.id,
        }))
      );

      if (splitError) {
        toast({ title: t('groupExpenses.errorSavingSplits'), variant: "destructive" });
      } else {
        // Reset form on success
        setExpenseTitle("");
        setExpenseAmount("");
        setExpensePaidByMemberId("");
        setExpenseNotes("");
        setSplitType("equal");
        setCustomSplits({});
        refetchExpenses();
        refetchSplits();
        toast({ title: t('groupExpenses.expenseAdded') });
      }
    } catch (error) {
      console.error("Add expense error:", error);
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setIsAutoSaving(false);
    }
  };

  // ============ VOICE INTEGRATION (with auto‑save and 10s silence) ============
  const voice = useSplitAIVoice({
    language,
    setTitle: setExpenseTitle,
    setAmount: setExpenseAmount,
    setPaidBy: (paidByName) => {
      // Find member ID from the name parsed by AI (case‑insensitive)
      const member = membersRef.current.find(
        (m) => m.name.toLowerCase() === paidByName.toLowerCase()
      );
      if (member) {
        setExpensePaidByMemberId(member.id);
      } else {
        console.warn(`Paid‑by name "${paidByName}" not found among members`);
      }
    },
    setSplitType: (type) => setSplitType(type as SplitType),
    autoSave: addExpense,                 // 👈 Autosave triggers after silence
    silenceTimeout: 10000,                 // 👈 Exactly 10 seconds
    // onClose is optional – not needed
  });

  // Cleanup voice on unmount
  useEffect(() => {
    return () => {
      if (voice.stop) voice.stop();
    };
  }, [voice]);

  // ===== MICROPHONE PERMISSION HANDLER WITH STREAM CLEANUP =====
  const handleVoiceStart = async () => {
    try {
      // Stop any previous stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Request permission – this creates a stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Keep reference for cleanup (though we stop it immediately)
      streamRef.current = stream;
      
      // Immediately release the microphone – we only needed permission
      stream.getTracks().forEach(track => track.stop());
      streamRef.current = null; // No longer needed

      // Now start the actual voice recognition
      voice.start();
    } catch (err) {
      toast({
        title: t('microphoneDenied') || "Microphone access denied",
        description: t('microphoneDeniedDesc') || "Please allow microphone permissions to use voice entry.",
        variant: "destructive",
      });
    }
  };

  // Cleanup any leftover stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // ---- DERIVED VALUES with SAFEGUARDS ----
  const isAdmin = members.some((m: any) => m.user_id === user?.id && m.role === "admin");

  const totalExpense = expenses.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0);
  const perPerson = members.length > 0 ? totalExpense / members.length : 0;

  // ---- BALANCE CALCULATION – only when we have real data to avoid utility crashes ----
  let balances = {};
  let debts: any[] = [];

  try {
    const safeExpenses = Array.isArray(expenses) ? expenses : [];
    const safeSplits = Array.isArray(splits) ? splits : [];
    const safeMembers = Array.isArray(members) ? members : [];

    const validExpenseIds = new Set(safeExpenses.map((e: any) => e.id));
    const validMemberIds = new Set(safeMembers.map((m: any) => m.id));

    const validSplits = safeSplits.filter((s: any) => 
      s &&
      validExpenseIds.has(s.expense_id) && 
      validMemberIds.has(s.member_id) &&
      typeof s.share_amount === 'number' &&
      !isNaN(s.share_amount)
    );

    if (safeExpenses.length > 0 && validSplits.length > 0) {
      balances = computeBalances(safeExpenses, validSplits, safeMembers);
      debts = simplifyDebts(balances, safeMembers);
    } else {
      balances = {};
      debts = [];
    }
  } catch (error) {
    console.error("Error computing balances/debts:", error);
    balances = {};
    debts = [];
  }

  // ---- OTHER ACTIONS (createGroup, deleteGroup, etc.) ----
  const createGroup = async () => {
    if (!groupName.trim() || !user) return;
    const { data: group, error } = await supabase
      .from("groups")
      .insert({ name: groupName.trim(), user_id: user.id })
      .select()
      .single();
    if (error) {
      toast({ title: t('groupExpenses.errorCreatingGroup'), variant: "destructive" });
      return;
    }
    await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: user.id,
      name: user.email?.split("@")[0] || "You",
      role: "admin",
    });
    setSelectedGroupId(group.id);
    setGroupName("");
    refetchGroups();
    toast({ title: t('common.success') });
  };

  const deleteGroup = async () => {
    if (!selectedGroupId || !window.confirm(t('groupExpenses.confirmDeleteGroup'))) return;
    await supabase.from("groups").delete().eq("id", selectedGroupId);
    setSelectedGroupId("");
    refetchGroups();
    toast({ title: t('groupExpenses.groupDeleted') });
  };

  const addMember = async () => {
    if (!memberName.trim()) return;
    await supabase.from("group_members").insert({
      group_id: selectedGroupId,
      user_id: user?.id,
      name: memberName.trim(),
    });
    setMemberName("");
    refetchMembers();
    toast({ title: t('groupExpenses.memberAdded') });
  };

  const removeMember = async (memberId: string) => {
    await supabase.from("group_members").delete().eq("id", memberId);
    refetchMembers();
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return;
    const { error } = await supabase.from("group_invites").insert({
      group_id: selectedGroupId,
      email: inviteEmail,
      invited_by: user?.id,
    });
    if (!error) {
      setInviteEmail("");
      toast({ title: t('groupExpenses.inviteSent') });
    } else {
      toast({ title: t('groupExpenses.inviteFailed'), variant: "destructive" });
    }
  };

  const copyInviteLink = () => {
    if (!selectedGroupId) return;
    const link = `${window.location.origin}/join?groupId=${selectedGroupId}`;
    navigator.clipboard.writeText(link);
    toast({ title: t('groupExpenses.linkCopied'), description: link });
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen w-full bg-gray-50/50 pb-24 font-sans overflow-x-hidden">
      
      {/* Shared App Header */}
      <AppHeader />

      <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* CARD 1: GROUP SELECTOR */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
          <CardHeader className="bg-gray-50/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <Users className="h-5 w-5 text-purple-600" /> {t('Create Or Select Group Name')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex gap-2">
              <Input
                placeholder={t('Enter group name')}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="h-11"
              />
              <Button onClick={createGroup} className="h-11 px-6 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-xl shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/40 active:scale-95 transition-all duration-300 antialiased">
                {t('Create')}
              </Button>
            </div>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase text-gray-400 font-bold bg-white px-2">
                {t('groupExpenses.orSelect')}
              </div>
            </div>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder={t('Select a group')} />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g: any) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedGroupId && (
          <>
            {/* FEATURE TOOLBAR */}
            <div className="bg-white p-4 rounded-xl border-l-4 border-purple-500 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{t('Group Tools')}</p>
                  <p className="text-xs text-gray-500">{t('Plan & Play')}</p>
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <BillRoulette members={members} />
                <Button
                  onClick={() => setTripAdvisorOpen(true)}
                  className="h-11 px-6 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-xl shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/40 active:scale-95 transition-all duration-300 antialiased"
                >
                  <Map className="h-4 w-4 mr-2" /> {t('Plan Trip')}
                </Button>
              </div>
            </div>

            {/* Trip Advisor Popup */}
            <TripAdvisor
              open={tripAdvisorOpen}
              onOpenChange={setTripAdvisorOpen}
              groupId={selectedGroupId}
              initialPlan={initialPlan}
            />

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* LEFT COLUMN: MEMBERS */}
              <div className="space-y-6 lg:col-span-1 w-full">
                {/* MEMBERS CARD */}
                <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <CardHeader className="pb-3 border-b border-gray-50">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      {t('Add Members Name', { count: members.length })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder={t('Enter member name')}
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        className="h-9"
                      />
                      <Button onClick={addMember} variant="outline" size="sm" className="h-9">
                        {t('common.add')}
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                      {members.length === 0 && (
                        <p className="text-sm text-gray-400 text-center">{t('No members yet')}</p>
                      )}
                      {members.map((m: any) => (
                        <div
                          key={m.id}
                          className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm font-medium">{m.name}</span>
                          {isAdmin && m.role !== "admin" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-gray-400"
                              onClick={() => removeMember(m.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    {isAdmin && (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                        {/* Invite by Email */}
                        <div className="flex gap-2">
                          <Input
                            placeholder={t('Email address')}
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="h-8 text-xs"
                          />
                          <Button onClick={sendInvite} size="sm" className="h-8 text-xs bg-gray-800">
                            {t('Invite')}
                          </Button>
                        </div>

                        {/* Shareable Link Button */}
                        <Button
                          onClick={copyInviteLink}
                          size="sm"
                          className="h-11 px-6 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-xl shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/40 active:scale-95 transition-all duration-300 antialiased"
                        >
                          <Share2 className="h-3 w-3 mr-2" />
                          {t('Share Invite Link')}
                        </Button>

                        {/* Delete Group */}
                        <Button
                          onClick={deleteGroup}
                          variant="destructive"
                          size="sm"
                          className="h-11 px-6 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-xl shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/40 active:scale-95 transition-all duration-300 antialiased"
                        >
                          {t('Delete Group')}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* SETTLEMENTS CARD – only shown when we have valid debts */}
                {debts.length > 0 && (
                  <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <CardHeader className="pb-3 border-b border-gray-50">
                      <CardTitle className="text-sm font-bold text-gray-800">{t('groupExpenses.whoOwesWho')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-4">
                      {debts.map((d, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs p-2 bg-green-50 rounded border border-green-100"
                        >
                          <span className="font-bold">{d.fromName}</span>
                          <ArrowRight className="h-3 w-3 text-green-500" />
                          <span className="font-bold">{d.toName}</span>
                          <span className="font-bold text-green-700">₹{d.amount.toFixed(0)}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* RIGHT COLUMN: EXPENSES */}
              <div className="space-y-6 lg:col-span-2 w-full">
                {/* STATS */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-white border shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">{t('Total')}</p>
                      <p className="text-xl font-black text-gray-900 mt-1">₹{totalExpense.toFixed(0)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">{t('Per Person')}</p>
                      <p className="text-xl font-black text-gray-900 mt-1">₹{perPerson.toFixed(0)}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* ADD EXPENSE CARD */}
                {members.length > 0 && (
                  <Card className="bg-white rounded-xl shadow-md border-0 ring-1 ring-gray-100">
                    <CardHeader className="py-4 border-b border-gray-50 flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg font-bold">
                        <CreditCard className="h-5 w-5 text-pink-600" /> {t('Add Expense')}
                      </CardTitle>
                      {/* Voice Input Button with permission check – disabled while auto‑saving */}
                      <Button
                        type="button"
                        variant="default"
                        size="icon"
                        onClick={handleVoiceStart}
                        disabled={voice.listening || isAutoSaving}
                        className={`rounded-full h-10 w-10 ${
                          voice.listening
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg animate-pulse'
                            : isAutoSaving
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-600 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100'
                        }`}
                        title={voice.listening ? t('groupExpenses.stopListening') : t('groupExpenses.addExpenseVoice')}
                      >
                        {voice.listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      {/* Live transcript preview */}
                      {voice.listening && voice.transcript && (
                        <div className="p-2 bg-blue-50 rounded-lg text-sm text-gray-700 border border-blue-200">
                          <span className="font-medium">{t('groupExpenses.youSaid')}:</span> {voice.transcript}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">{t('Title')}</Label>
                          <Input
                            placeholder={t('e.g., Dinner')}
                            value={expenseTitle}
                            onChange={(e) => setExpenseTitle(e.target.value)}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t('Amount')}</Label>
                          <Input
                            type="number"
                            placeholder={t('0.00')}
                            value={expenseAmount}
                            onChange={(e) => setExpenseAmount(e.target.value)}
                            className="h-10"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">{t('Paid By')}</Label>
                          <Select
                            value={expensePaidByMemberId}
                            onValueChange={setExpensePaidByMemberId}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder={t('Select member')} />
                            </SelectTrigger>
                            <SelectContent>
                              {members.map((m: any) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t('Split')}</Label>
                          <Select
                            value={splitType}
                            onValueChange={(v) => {
                              setSplitType(v as SplitType);
                              setCustomSplits({});
                            }}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder={t('Select split')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equal">{t('Equal')}</SelectItem>
                              <SelectItem value="unequal">{t('Unequal')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {splitType !== "equal" && (
                        <div className="bg-gray-50 p-3 rounded border border-gray-100 grid grid-cols-2 gap-2">
                          {members.map((m: any) => (
                            <div
                              key={m.id}
                              className="flex items-center gap-2 bg-white px-2 py-1 rounded border"
                            >
                              <span className="text-xs truncate w-16">{m.name}</span>
                              <Input
                                type="number"
                                placeholder="0"
                                value={customSplits[m.id] ?? ""}
                                onChange={(e) =>
                                  setCustomSplits((prev) => ({
                                    ...prev,
                                    [m.id]: Number(e.target.value),
                                  }))
                                }
                                className="h-7 text-xs text-right border-0 p-0 focus-visible:ring-0"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <Button
                        onClick={addExpense}
                        disabled={isAutoSaving}
                        className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-lg disabled:opacity-50"
                      >
                        {isAutoSaving ? "Saving..." : t('Save Expense')}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* RECENT ACTIVITY */}
                {expenses.length > 0 && (
                  <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <CardHeader className="py-4 border-b border-gray-50">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Clock className="h-4 w-4" /> {t('Recent Activity')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {expenses.slice(0, 10).map((exp: any) => {
                        const payer = members.find((m: any) => m.id === exp.paid_by_member_id);
                        return (
                          <div
                            key={exp.id}
                            className="py-3 border-b border-gray-50 last:border-0 flex justify-between items-center"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{exp.title}</p>
                              <p className="text-[10px] text-gray-500 uppercase">
                                {payer?.name || exp.paid_by} {t('groupExpenses.paid')}
                              </p>
                            </div>
                            <p className="font-bold text-gray-900 text-sm">
                              ₹{Number(exp.amount).toFixed(0)}
                            </p>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* MOBILE NAV FOOTER */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-6 shadow-lg z-50 flex justify-between items-center h-16">
        <Link
          to="/dashboard"
          className={`flex flex-col items-center gap-1 ${
            isActive("/") || isActive("/dashboard") ? "text-purple-600" : "text-gray-400"
          }`}
        >
          <LayoutDashboard className="h-6 w-6" />
          <span className="text-[10px]">{t('common.home')}</span>
        </Link>
        <Link
          to="/savings"
          className={`flex flex-col items-center gap-1 ${
            isActive("/savings") ? "text-purple-600" : "text-gray-400"
          }`}
        >
          <PiggyBank className="h-6 w-6" />
          <span className="text-[10px]">{t('common.savings')}</span>
        </Link>
        <Link
          to="/group-expenses"
          className={`flex flex-col items-center gap-1 ${
            isActive("/group-expenses") ? "text-purple-600" : "text-gray-400"
          }`}
        >
          <Users className="h-6 w-6" />
          <span className="text-[10px]">{t('common.split')}</span>
        </Link>
      </div>
    </div>
  );
};

export default GroupExpenses;