import { useQuery } from '@tanstack/react-query';
import { featuredGameRating } from '@/ranking/ratingEngine';
import { getRankByRating } from '@/ranking/rankService';
import { useRatingStore } from '@/ranking/ratingStore';
import { getMyProfile, mapProfileRatings } from '@/services/profileService';
import { useAuthStore } from '@/store/authStore';

export function useMyRatings() {
  const auth = useAuthStore();
  const localPlayer = useRatingStore((state) => state.player);
  const localRatings = useRatingStore((state) => state.ratings);
  const profileQuery = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: getMyProfile,
    enabled: auth.status === 'authenticated',
  });

  const player = profileQuery.data
    ? {
        name: profileQuery.data.displayName,
        avatarId: profileQuery.data.avatarId,
        username: profileQuery.data.username,
      }
    : {
        name: localPlayer.name,
        avatarId: localPlayer.avatarId,
        username: undefined as string | undefined,
      };
  const ratings = profileQuery.data ? mapProfileRatings(profileQuery.data.ratings) : localRatings;
  const featured = featuredGameRating(ratings);
  const rank = getRankByRating(featured.rating);

  return {
    player,
    ratings,
    featured,
    rank,
    remote: Boolean(profileQuery.data),
  };
}
