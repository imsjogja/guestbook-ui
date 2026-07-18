import { Routes, Route, Navigate } from 'react-router-dom';
import AuthenticatedLayout from './components/AuthenticatedLayout';
import EventRequired from './components/EventRequired';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import MagicLogin from './pages/MagicLogin';
import Dashboard from './pages/Dashboard';

// Stub pages — will be implemented by page agents
import Acara from './pages/Acara';
import Tamu from './pages/Tamu';
import TamuDetail from './pages/TamuDetail';
import KelompokKeluarga from './pages/KelompokKeluarga';
import Undangan from './pages/Undangan';
import RSVPPage from './pages/RSVP';
import Checkin from './pages/Checkin';
import TempatDuduk from './pages/TempatDuduk';
import TemplateKomunikasi from './pages/TemplateKomunikasi';
import KampanyeKomunikasi from './pages/KampanyeKomunikasi';
import RiwayatPesan from './pages/RiwayatPesan';
import Tim from './pages/Tim';
import TimAcara from './pages/TimAcara';
import Pengaturan from './pages/Pengaturan';

function App() {
  return (
    <Routes>
      {/* Auth routes — no layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/magic-login" element={<MagicLogin />} />

      {/* App routes — with sidebar layout */}
        <Route element={<AuthenticatedLayout />}>
        <Route path="acara" element={<Acara />} />
        <Route path="komunikasi/template" element={<TemplateKomunikasi />} />
        <Route path="tim" element={<Tim />} />
        <Route path="pengaturan" element={<Pengaturan />} />

        <Route element={<EventRequired />}>
          <Route index element={<Dashboard />} />
          <Route path="tamu" element={<Tamu />} />
          <Route path="tamu/:id" element={<TamuDetail />} />
          <Route path="kelompok-keluarga" element={<KelompokKeluarga />} />
          <Route path="undangan" element={<Undangan />} />
          <Route path="rsvp" element={<RSVPPage />} />
          <Route path="check-in" element={<Checkin />} />
          <Route path="tempat-duduk" element={<TempatDuduk />} />
          <Route path="komunikasi/kampanye" element={<KampanyeKomunikasi />} />
          <Route path="komunikasi/pesan" element={<RiwayatPesan />} />
          <Route path="tim-acara" element={<TimAcara />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
