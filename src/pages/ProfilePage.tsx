import { useParams } from 'react-router-dom';
import { PlayerProfile } from '@/components/ranking/PlayerProfile';

export function ProfilePage() {
  const { username } = useParams();
  return <PlayerProfile username={username} />;
}
