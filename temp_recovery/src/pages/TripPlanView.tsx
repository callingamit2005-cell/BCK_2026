import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { tripPlannerService } from '@/services/tripPlanner';

interface TripPlan {
  id: string;
  group_id: string;
  version: number;
  plan_data: any;
  status: string;
  created_by: string;
}

const TripPlanView = () => {
  const { planId } = useParams<{ planId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [vote, setVote] = useState<'agree' | 'disagree' | null>(null);
  const [voting, setVoting] = useState(false);
  const [voteStats, setVoteStats] = useState({ agree: 0, disagree: 0 });

  useEffect(() => {
    if (!planId) return;
    fetchPlan();
  }, [planId]);

  const fetchPlan = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('trip_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error || !data) {
      toast({ title: 'Error', description: 'Trip plan not found', variant: 'destructive' });
      navigate('/');
      return;
    }
    setPlan(data);

    // Fetch existing vote for this user
    if (user) {
      const { data: voteData } = await supabase
        .from('trip_plan_votes')
        .select('vote')
        .eq('trip_plan_id', planId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (voteData) setVote(voteData.vote);
    }

    // Fetch vote counts
    const { data: votes } = await supabase
      .from('trip_plan_votes')
      .select('vote')
      .eq('trip_plan_id', planId);
    if (votes) {
      const agree = votes.filter(v => v.vote === 'agree').length;
      setVoteStats({ agree, disagree: votes.length - agree });
    }

    setLoading(false);
  };

  const handleVote = async (choice: 'agree' | 'disagree') => {
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', `/trip-plan/${planId}`);
      navigate('/auth');
      return;
    }
    if (!plan) return;
    setVoting(true);
    const { error } = await supabase
      .from('trip_plan_votes')
      .upsert(
        { trip_plan_id: plan.id, user_id: user.id, vote: choice },
        { onConflict: 'trip_plan_id, user_id' }
      );
    setVoting(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setVote(choice);
      // Update local stats
      setVoteStats(prev => {
        const newStats = { ...prev };
        if (vote === 'agree') newStats.agree--;
        if (vote === 'disagree') newStats.disagree--;
        newStats[choice]++;
        return newStats;
      });
    }
  };

  // 🔥 ADMIN REGENERATE HANDLER
  const handleRegenerate = async () => {
    if (!user || !plan) return;
    // Check if current user is the creator (admin)
    if (plan.created_by !== user.id) {
      toast({ title: 'Permission denied', description: 'Only the plan creator can regenerate.', variant: 'destructive' });
      return;
    }

    const { destination, members, budgetPerPerson } = plan.plan_data;
    try {
      const newPlan = await tripPlannerService.generatePlan({
        destination,
        members,
        budgetPerPerson,
        language: 'en', // or use user's language from context
        groupId: plan.group_id,
        userId: user.id,
        version: plan.version + 1, // increment version
      });
      toast({ title: 'New version created', description: 'Redirecting...' });
      navigate(`/trip-plan/${newPlan.id}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!plan) return null;

  const isAdmin = user && plan.created_by === user.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
          Trip Plan
        </h1>

        <Card className="bg-white shadow-xl border-0">
          <CardContent className="p-6 space-y-4">
            {/* Read-only plan display */}
            <div>
              <h2 className="font-semibold text-lg">Destination</h2>
              <p className="text-gray-700">{plan.plan_data.destination}</p>
            </div>
            <div>
              <h2 className="font-semibold text-lg">Members</h2>
              <p className="text-gray-700">{plan.plan_data.members}</p>
            </div>
            <div>
              <h2 className="font-semibold text-lg">Budget per Person</h2>
              <p className="text-gray-700">₹{plan.plan_data.budgetPerPerson}</p>
            </div>
            <div>
              <h2 className="font-semibold text-lg">Places</h2>
              <ul className="list-disc pl-5">
                {plan.plan_data.places.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
            <div>
              <h2 className="font-semibold text-lg">Hotels</h2>
              <ul className="list-disc pl-5">
                {plan.plan_data.hotels.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </div>
            {/* Add other sections as needed */}
          </CardContent>
        </Card>

        {/* Voting section */}
        <Card className="bg-white shadow-xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="space-x-2">
                <Button
                  variant={vote === 'agree' ? 'default' : 'outline'}
                  onClick={() => handleVote('agree')}
                  disabled={voting}
                  className="gap-2"
                >
                  <ThumbsUp className="h-4 w-4" /> Agree ({voteStats.agree})
                </Button>
                <Button
                  variant={vote === 'disagree' ? 'default' : 'outline'}
                  onClick={() => handleVote('disagree')}
                  disabled={voting}
                  className="gap-2"
                >
                  <ThumbsDown className="h-4 w-4" /> Disagree ({voteStats.disagree})
                </Button>
              </div>
              {isAdmin && (
                <Button
                  onClick={handleRegenerate}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Regenerate Plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TripPlanView;