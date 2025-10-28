import { useEffect } from 'react';
import { useStore } from './store/useStore';
import Navbar from './components/Navbar';
import SourcesPage from './pages/SourcesPage';
import TopicsPage from './pages/TopicsPage';
import ArticlesPage from './pages/ArticlesPage';
import AnalysisPage from './pages/AnalysisPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const { currentView, initialize } = useStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        {currentView === 'sources' && <SourcesPage />}
        {currentView === 'topics' && <TopicsPage />}
        {currentView === 'articles' && <ArticlesPage />}
        {currentView === 'analysis' && <AnalysisPage />}
        {currentView === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}

export default App;
