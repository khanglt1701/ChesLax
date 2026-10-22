import { useQuery } from '@tanstack/react-query';
import { gamesFromLiveIds, getAvailableGames, type GameInfo } from '@/games/catalog';
import { getMetaGames } from '@/services/metaService';

export function useCatalogGames(): { games: GameInfo[]; available: GameInfo[]; live: boolean } {
  const query = useQuery({
    queryKey: ['meta', 'games'],
    queryFn: getMetaGames,
    retry: false,
  });
  const games = gamesFromLiveIds(query.data);
  return {
    games,
    available: getAvailableGames(games),
    live: Boolean(query.data),
  };
}
