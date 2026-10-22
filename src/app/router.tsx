import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChessPage } from '@/games/chess/ChessPage';
import { OAnQuanPage } from '@/games/o-an-quan/OAnQuanPage';
import { GamesPage } from '@/pages/GamesPage';
import { GuidePage } from '@/pages/GuidePage';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
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
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
