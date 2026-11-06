import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { CaroPage } from '@/games/caro/CaroPage';
import { ChessPage } from '@/games/chess/ChessPage';
import { OAnQuanPage } from '@/games/o-an-quan/OAnQuanPage';
import { CoTuongPage } from '@/games/co-tuong/CoTuongPage';
import { ImposterPage } from '@/games/imposter/ImposterPage';
import { CoGanhPage } from '@/games/co-ganh/CoGanhPage';
import { GamesPage } from '@/pages/GamesPage';
import { GuidePage } from '@/pages/GuidePage';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
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
          <Route path="/games/caro" element={<CaroPage />} />
          <Route path="/games/co-tuong" element={<CoTuongPage />} />
          <Route path="/games/co-ganh" element={<CoGanhPage />} />
          <Route path="/games/imposter" element={<ImposterPage />} />
          <Route path="/huong-dan" element={<GuidePage />} />
          <Route path="/thong-ke" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
