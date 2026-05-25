import { NavigateFunction } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const isValidUUID = (id: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const handleTripShareDeepLink = async (
  groupId: string,
  navigate: NavigateFunction,
  isLoggedIn: boolean,
  userId?: string
) => {
  console.log('[DeepLink] Handling trip share:', { groupId, isLoggedIn, userId });

  if (!isLoggedIn) {
    sessionStorage.setItem('redirectAfterLogin', `/trip-share/${groupId}`);
    navigate('/auth');
    return;
  }

  if (!isValidUUID(groupId)) {
    console.error('[DeepLink] Invalid group ID:', groupId);
    navigate('/not-found', {
      state: { message: 'Invalid trip link. The group ID is malformed.' }
    });
    return;
  }

  try {
    console.log('[DeepLink] Fetching group and latest trip plan...');
    const [groupResult, planResult] = await Promise.all([
      supabase.from('groups').select('*').eq('id', groupId).single(),
      supabase
        .from('trip_plans')
        .select('plan_data')
        .eq('group_id', groupId)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    console.log('[DeepLink] Group result:', { data: groupResult.data, error: groupResult.error });
    console.log('[DeepLink] Plan result:', { data: planResult.data, error: planResult.error });

    if (groupResult.error || !groupResult.data) {
      console.error('[DeepLink] Group fetch error:', groupResult.error);
      navigate('/not-found', {
        state: { message: 'Trip not found or you do not have access.' }
      });
      return;
    }

    console.log('[DeepLink] Group found:', groupResult.data.name);

    if (userId) {
      console.log('[DeepLink] Checking membership...');
      const { data: membership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!membership) {
        console.log('[DeepLink] Adding user as member');
        await supabase.from('group_members').insert({
          group_id: groupId,
          user_id: userId,
          name: 'Shared User',
          role: 'viewer',
        });
      } else {
        console.log('[DeepLink] User is already a member');
      }
    }

    let planParam = '';
    if (planResult.data?.plan_data) {
      console.log('[DeepLink] Trip plan found, encoding for URL');
      const planJson = JSON.stringify(planResult.data.plan_data);
      planParam = `&plan=${encodeURIComponent(planJson)}`;
    } else {
      console.log('[DeepLink] No trip plan exists yet for this group');
    }

    const targetUrl = `/group-expenses?groupId=${groupId}&openTripPlan=true${planParam}`;
    console.log('[DeepLink] Navigating to:', targetUrl);
    navigate(targetUrl);
  } catch (err) {
    console.error('[DeepLink] Unexpected error:', err);
    navigate('/not-found', {
      state: { message: 'Something went wrong. Please try again.' }
    });
  }
};