import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import BuildingList from './pages/BuildingList';
import SlotGrid from './pages/SlotGrid';
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/buildings"
          element={
            <ProtectedRoute>
              <BuildingList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buildings/:buildingId/slots"
          element={
            <ProtectedRoute>
              <SlotGrid />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;