import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { handleTripShareDeepLink } from '@/services/deepLinkHandler';
import { Loader2 } from 'lucide-react';

const TripShareHandler = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && groupId) {
      handleTripShareDeepLink(groupId, navigate, !!user, user?.id);
    }
  }, [groupId, navigate, user, loading]);

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