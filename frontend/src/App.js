import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import BuildingList from './pages/BuildingList';
import SlotGrid from './pages/SlotGrid';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/buildings" element={<BuildingList />} />
        <Route path="/buildings/:buildingId/slots" element={<SlotGrid />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
