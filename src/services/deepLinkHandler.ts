// src/services/tripShareDeepLink.ts
/**
 * Handles deep linking for shared trip plans.
 * - If not logged in, redirects to auth with return URL.
 * - Validates group ID, fetches group and latest trip plan.
 * - Ensures user is a member (adds as viewer if not).
 * - Constructs target URL with optional plan data and navigates.
 */

import { NavigateFunction } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { isValidUuid } from "@/security/guards";
import { setRedirectAfterLogin } from "@/security/redirect";

const isDev = import.meta.env.DEV;

/**
 * Processes a trip share deep link.
 * @param groupId - The group UUID from the URL.
 * @param navigate - React Router navigate function.
 * @param isLoggedIn - Whether the user is authenticated.
 * @param userId - Current user's ID (if logged in).
 * @param sharedPlan - Optional pre‑shared plan JSON string.
 */
export const handleTripShareDeepLink = async (
  groupId: string,
  navigate: NavigateFunction,
  isLoggedIn: boolean,
  userId?: string,
  sharedPlan?: string | null
) => {
  if (isDev) {
    console.log("[DeepLink] Handling trip share:", { groupId, isLoggedIn, userId });
  }

  if (!isLoggedIn) {
    setRedirectAfterLogin(`/trip-share/${groupId}`);
    navigate('/auth');
    return;
  }

  if (!isValidUuid(groupId)) {
    console.error('[DeepLink] Invalid group ID:', groupId);
    navigate('/not-found', {
      state: { message: 'Invalid trip link. The group ID is malformed.' }
    });
    return;
  }

  try {
    if (isDev) {
      console.log("[DeepLink] Fetching group and latest trip plan...");
    }
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

    if (isDev) {
      console.log("[DeepLink] Group result:", { data: groupResult.data, error: groupResult.error });
      console.log("[DeepLink] Plan result:", { data: planResult.data, error: planResult.error });
    }

    if (groupResult.error || !groupResult.data) {
      console.error('[DeepLink] Group fetch error:', groupResult.error);
      navigate('/not-found', {
        state: { message: 'Trip not found or you do not have access.' }
      });
      return;
    }

    if (isDev) {
      console.log("[DeepLink] Group found:", groupResult.data.name);
    }

    if (userId) {
      if (isDev) {
        console.log("[DeepLink] Checking membership...");
      }
      const { data: membership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!membership) {
        if (isDev) {
          console.log("[DeepLink] Adding user as member");
        }
        await supabase.from('group_members').insert({
          group_id: groupId,
          user_id: userId,
          name: 'Shared User',
          role: 'viewer',
        });
      } else {
        if (isDev) {
          console.log("[DeepLink] User is already a member");
        }
      }
    }

    let planParam = '';
    if (sharedPlan) {
      // Prefer directly shared plan payload so receiver can always view details.
      planParam = `&plan=${encodeURIComponent(sharedPlan)}`;
    } else if (planResult.data?.plan_data) {
      if (isDev) {
        console.log("[DeepLink] Trip plan found, encoding for URL");
      }
      const planJson = JSON.stringify(planResult.data.plan_data);
      planParam = `&plan=${encodeURIComponent(planJson)}`;
    } else {
      if (isDev) {
        console.log("[DeepLink] No trip plan exists yet for this group");
      }
    }

    const targetUrl = `/group-expenses?groupId=${groupId}&openTripPlan=true${planParam}`;
    if (isDev) {
      console.log("[DeepLink] Navigating to:", targetUrl);
    }
    navigate(targetUrl);
  } catch (err) {
    console.error('[DeepLink] Unexpected error:', err);
    navigate('/not-found', {
      state: { message: 'Something went wrong. Please try again.' }
    });
  }
};
