import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppStoreProvider } from '@/store/AppStore';
import { FiltersProvider } from '@/store/filters';
import { Layout } from '@/components/Layout';
import { DetailModal } from '@/components/DetailModal';
import Home from '@/pages/Home';
import Explore from '@/pages/Explore';
import MapPage from '@/pages/MapPage';
import Recommend from '@/pages/Recommend';
import Discover from '@/pages/Discover';
import Wishlist from '@/pages/Wishlist';
import Visits from '@/pages/Visits';
import Cellar from '@/pages/Cellar';
import RandomDate from '@/pages/RandomDate';
import Stats from '@/pages/Stats';
import Settings from '@/pages/Settings';
import { LoginPage, SignupPage } from '@/pages/Auth';

// HashRouter: GitHub Pages 와 Vercel 둘 다 새로고침해도 404 가 안 나요.
export default function App() {
  return (
    <HashRouter>
      <AppStoreProvider>
        <FiltersProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="*"
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/map" element={<MapPage />} />
                    <Route path="/recommend" element={<Recommend />} />
                    <Route path="/discover" element={<Discover />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/visits" element={<Visits />} />
                    <Route path="/cellar" element={<Cellar />} />
                    <Route path="/random" element={<RandomDate />} />
                    <Route path="/stats" element={<Stats />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Home />} />
                  </Routes>
                </Layout>
              }
            />
          </Routes>
          <DetailModal />
        </FiltersProvider>
      </AppStoreProvider>
    </HashRouter>
  );
}
