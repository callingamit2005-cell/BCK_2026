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
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return null;
};

export default TripShareHandler;
