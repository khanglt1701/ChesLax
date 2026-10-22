import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChessPage } from '@/games/chess/ChessPage';
import { OAnQuanPage } from '@/games/o-an-quan/OAnQuanPage';
import { GamesPage } from '@/pages/GamesPage';
import { GuidePage } from '@/pages/GuidePage';
import { HomePage } from '@/pages/HomePage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { OnlineLobbyPage } from '@/pages/OnlineLobbyPage';
import { OnlineRoomPage } from '@/pages/OnlineRoomPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { RegisterPage } from '@/pages/RegisterPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { StatsPage } from '@/pages/StatsPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/chess" element={<ChessPage />} />
          <Route path="/games/o-an-quan" element={<OAnQuanPage />} />
          <Route path="/huong-dan" element={<GuidePage />} />
          <Route path="/thong-ke" element={<StatsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/online" element={<OnlineLobbyPage />} />
          <Route path="/play/:gameType/:roomCode" element={<OnlineRoomPage />} />
          <Route path="/play/:code" element={<OnlineRoomPage />} />
          <Route path="/play" element={<Navigate to="/online" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
