import { supabase } from '@/integrations/supabase/client';
import { dummyDestinations, generalPlan } from '@/data/tripData';

export interface TripPlan {
  id: string;
  group_id: string;
  version: number;
  plan_data: any;
  status: string;
  created_by: string;
  created_at: string;
}

export const tripPlannerService = {
  generatePlan: async ({
    destination,
    members,
    budgetPerPerson,
    language,
    groupId,
    userId,
  }: {
    destination: string;
    members: number;
    budgetPerPerson: number;
    language: 'en' | 'hi';
    groupId: string;
    userId: string;
  }): Promise<TripPlan> => {
    console.log('[TripPlanner] Generating plan for:', { destination, members, budgetPerPerson, language, groupId, userId });

    await new Promise(resolve => setTimeout(resolve, 500));

    const normalizedDest = destination.trim().toLowerCase();
    const matchedKey = Object.keys(dummyDestinations).find(
      (key) => normalizedDest.includes(key) || key.includes(normalizedDest)
    );
    const planData = matchedKey ? dummyDestinations[matchedKey] : generalPlan;

    const plan = {
      destination,
      members,
      budgetPerPerson,
      language,
      places: planData.places,
      hotels: planData.hotels,
      food: planData.food,
      travelAdvice: planData.travelAdvice,
      budgetBreakdown: planData.budgetBreakdown,
      smartAdvice: planData.smartAdvice[language] || planData.smartAdvice.en,
    };

    // Determine next version number for this group
    const { data: existing } = await supabase
      .from('trip_plans')
      .select('version')
      .eq('group_id', groupId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = existing ? existing.version + 1 : 1;

    // Insert new version
    const { data, error } = await supabase
      .from('trip_plans')
      .insert({
        group_id: groupId,
        version: nextVersion,
        plan_data: plan,
        created_by: userId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[TripPlanner] Failed to save trip plan to DB:', error);
      throw new Error(`Database save failed: ${error.message}`);
    }

    console.log('[TripPlanner] Plan saved successfully, ID:', data.id, 'version:', nextVersion);
    return data;
  },
};