import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { handleTripShareDeepLink } from '@/services/deepLinkHandler';
import { Loader2 } from 'lucide-react';

const TripShareHandler = () => {
  const { groupId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && groupId) {
      const sharedPlan = searchParams.get("plan");
      handleTripShareDeepLink(groupId, navigate, !!user, user?.id, sharedPlan);
    }
  }, [groupId, navigate, user, loading, searchParams]);

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center h-screen gap-4 bg-background"
        role="status"
        aria-label="Loading trip"
      >
        <Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-400" />
        <p className="text-sm text-muted-foreground font-medium">Loading your trip…</p>
      </div>
    );
  }

  return null;
};

export default TripShareHandler;
