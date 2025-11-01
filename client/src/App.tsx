import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PosInstancePage from './pages/PosInstancePage';
import ProductMasterPage from './pages/ProductMasterPage';
import VirtualDrawerPage from './pages/VirtualDrawerPage';
import LedgerPage from './pages/LedgerPage';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/:instanceId" element={<PosInstancePage />} />
      <Route path="/:instanceId/master" element={<ProductMasterPage />} />
      <Route path="/:instanceId/drawer" element={<VirtualDrawerPage />} />
      <Route path="/:instanceId/ledger" element={<LedgerPage />} />
    </Routes>
  );
}

export default App;
