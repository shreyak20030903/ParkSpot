import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login.jsx';
import BuildingList from './pages/BuildingList.jsx';
import SlotGrid from './pages/SlotGrid.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

export default function App() {
  return (
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
