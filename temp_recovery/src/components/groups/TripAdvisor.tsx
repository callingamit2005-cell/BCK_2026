import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MapPin, Users, IndianRupee, Map, Share2 } from 'lucide-react';
import { tripPlannerService, TripPlan } from '@/services/tripPlanner';
import { getDestinationGradient } from '@/utils/destinationGradient';
import { generateWhatsAppMessage, getGoogleMapsUrl } from '@/services/tripShareService';

interface TripAdvisorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId?: string;
  group?: any; // if already available, use it
  initialPlan?: TripPlan | null; // pre‑loaded plan from deep link
}

const TripAdvisor = ({ open, onOpenChange, groupId, group: propGroup, initialPlan }: TripAdvisorProps) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();

  const [members, setMembers] = useState('');
  const [budgetPerPerson, setBudgetPerPerson] = useState('');
  const [destination, setDestination] = useState('');
  const [groupName, setGroupName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);

  // Normalize plan data: if it has plan_data, use that; otherwise assume it's the data itself
  const planData = useMemo(() => {
    if (!tripPlan) return null;
    return tripPlan.plan_data || tripPlan;
  }, [tripPlan]);

  // If initialPlan is provided, use it
  useEffect(() => {
    if (initialPlan) {
      console.log('[TripAdvisor] Received initial plan:', initialPlan);
      setTripPlan(initialPlan);
      // Prefill members/budget from plan data
      if (initialPlan.plan_data) {
        setMembers(initialPlan.plan_data.members?.toString() || '');
        setBudgetPerPerson(initialPlan.plan_data.budgetPerPerson?.toString() || '');
      }
    }
  }, [initialPlan]);

  // Fetch latest plan for this group when popup opens (if no initialPlan and no tripPlan yet)
  const { data: existingPlan, isLoading: planLoading } = useQuery({
    queryKey: ['latest-trip-plan', groupId],
    queryFn: async () => {
      if (!groupId) return null;
      const { data } = await supabase
        .from('trip_plans')
        .select('*')
        .eq('group_id', groupId)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!groupId && open && !initialPlan && !tripPlan,
  });

  useEffect(() => {
    if (existingPlan) {
      console.log('[TripAdvisor] Found existing plan, loading version', existingPlan.version);
      setTripPlan(existingPlan);
      if (existingPlan.plan_data) {
        setMembers(existingPlan.plan_data.members?.toString() || '');
        setBudgetPerPerson(existingPlan.plan_data.budgetPerPerson?.toString() || '');
      }
    }
  }, [existingPlan]);

  // Fetch group if not provided
  const { data: fetchedGroup, isLoading: groupLoading } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      if (!groupId || !user) return null;
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!groupId && !!user && !propGroup,
  });

  const group = propGroup || fetchedGroup;

  useEffect(() => {
    if (group) {
      if (group.destination) {
        setDestination(group.destination);
        setGroupName('');
      } else {
        setGroupName(group.name || '');
        setDestination('');
      }
    }
  }, [group]);

  const gradientClass = useMemo(() => {
    const primary = destination || groupName;
    return getDestinationGradient(primary);
  }, [destination, groupName]);

  const handleGenerate = async () => {
    if (!members || parseInt(members) <= 0) {
      toast({ title: 'Error', description: 'Please enter valid number of members', variant: 'destructive' });
      return;
    }
    if (!budgetPerPerson || parseInt(budgetPerPerson) <= 0) {
      toast({ title: 'Error', description: 'Please enter valid budget per person', variant: 'destructive' });
      return;
    }
    if (!group?.id) {
      toast({ title: 'Error', description: 'Group information missing.', variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      const plan = await tripPlannerService.generatePlan({
        destination: destination || groupName || 'India',
        members: parseInt(members),
        budgetPerPerson: parseInt(budgetPerPerson),
        language,
        groupId: group.id,
        userId: user.id,
      });
      setTripPlan(plan);
      toast({ title: 'Success', description: 'Trip plan generated and saved!', className: 'bg-green-600 text-white' });
    } catch (error: any) {
      toast({
        title: 'Error Saving Plan',
        description: error.message || 'Failed to generate plan',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenMaps = () => {
    const mapsUrl = getGoogleMapsUrl(destination || groupName);
    window.open(mapsUrl, '_blank');
  };

  const handleShareWhatsApp = () => {
    if (!tripPlan || !group) return;
    const data = planData || tripPlan; // fallback
    const message = generateWhatsAppMessage({
      groupId: group.id,
      destination: destination || groupName,
      members: parseInt(members),
      budget: parseInt(budgetPerPerson),
      topPlaces: data?.places || [],
    });
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Loading states
  if ((groupId && groupLoading) || (groupId && planLoading)) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-gradient-to-br border-0 shadow-2xl">
        <div className={`bg-gradient-to-br ${gradientClass} p-6`}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white drop-shadow-md">
              Smart Trip Planner
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Auto-filled read-only field */}
            <div className="space-y-2">
              <Label className="text-white/90 font-semibold">
                {destination ? '📍 Destination' : '👥 Group'}
              </Label>
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg border border-white/30 text-white font-medium">
                {destination || groupName || '—'}
              </div>
            </div>

            {/* Members input */}
            <div className="space-y-2">
              <Label className="text-white/90 font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" /> Number of Members
              </Label>
              <Input
                type="number"
                min="1"
                value={members}
                onChange={(e) => setMembers(e.target.value)}
                placeholder="e.g., 4"
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60"
              />
            </div>

            {/* Budget per person */}
            <div className="space-y-2">
              <Label className="text-white/90 font-semibold flex items-center gap-2">
                <IndianRupee className="h-4 w-4" /> Budget per Person (₹)
              </Label>
              <Input
                type="number"
                min="1"
                value={budgetPerPerson}
                onChange={(e) => setBudgetPerPerson(e.target.value)}
                placeholder="e.g., 5000"
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60"
              />
            </div>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-white text-purple-900 hover:bg-white/90 font-bold py-6 text-lg rounded-xl shadow-lg disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Planning...
                </>
              ) : (
                '✨ Generate Trip Plan'
              )}
            </Button>
          </div>
        </div>

        {/* Future Booking Tabs (UI only) */}
        {tripPlan && (
          <div className="bg-gray-50 p-4 border-t border-gray-200">
            <Tabs defaultValue="flights" className="w-full">
              <TabsList className="grid grid-cols-4 lg:grid-cols-9 gap-1 overflow-x-auto">
                <TabsTrigger value="flights" disabled>✈️ Flights</TabsTrigger>
                <TabsTrigger value="hotels" disabled>🏨 Hotels</TabsTrigger>
                <TabsTrigger value="villas" disabled>🏡 Villas</TabsTrigger>
                <TabsTrigger value="packages" disabled>🎒 Packages</TabsTrigger>
                <TabsTrigger value="trains" disabled>🚆 Trains</TabsTrigger>
                <TabsTrigger value="buses" disabled>🚌 Buses</TabsTrigger>
                <TabsTrigger value="cabs" disabled>🚕 Cabs</TabsTrigger>
                <TabsTrigger value="tours" disabled>🎟️ Tours</TabsTrigger>
                <TabsTrigger value="cruise" disabled>🚢 Cruise</TabsTrigger>
              </TabsList>
            </Tabs>
            {/* TODO: Connect to booking service module */}
          </div>
        )}

        {/* Trip Plan Output */}
        {planData && (
          <div className="p-6 bg-white max-h-[50vh] overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-xl font-bold border-b pb-2">Your Trip Plan</h3>
              
              <div>
                <h4 className="font-semibold text-purple-700">📍 Best Places to Visit</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {planData.places?.map((place: string, i: number) => (
                    <li key={i}>{place}</li>
                  )) || <li>No places listed</li>}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-purple-700">🏨 Recommended Hotels</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {planData.hotels?.map((hotel: string, i: number) => (
                    <li key={i}>{hotel}</li>
                  )) || <li>No hotels listed</li>}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-purple-700">🍽️ Local Food</h4>
                <p>{planData.food || 'Not specified'}</p>
              </div>

              <div>
                <h4 className="font-semibold text-purple-700">🚗 Local Travel</h4>
                <p>{planData.travelAdvice || 'Not specified'}</p>
              </div>

              <div>
                <h4 className="font-semibold text-purple-700">💰 Budget Breakdown</h4>
                <p>{planData.budgetBreakdown || 'Not specified'}</p>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500">
                <h4 className="font-semibold text-amber-800">🧠 Smart Advice</h4>
                <p className="text-amber-900">{planData.smartAdvice || 'No advice available'}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleOpenMaps}
                >
                  <Map className="h-4 w-4" />
                  Open in Google Maps
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleShareWhatsApp}
                >
                  <Share2 className="h-4 w-4" />
                  Share via WhatsApp
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TripAdvisor;