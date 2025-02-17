// App.tsx
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import { Toaster } from "react-hot-toast";

import QRScanner from "./pages/QRScanner";
import UserAssets from "./client/pages/Assets";
import UserOverview from "./client/pages/UserOverview";
import AdminAssets from "./admin/pages/AdminAssets";
import AdminOverview from "./admin/pages/AdminOverview";
import UserDashboard from "./client/pages";
import AdminDashboard from "./admin/pages";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* User dashboard routes */}
          <Route path="/user/*" element={<UserDashboard />}>
            <Route path="dashboard" element={<UserOverview />} />
            <Route path="assets" element={<UserAssets />} />
            <Route path="scan" element={<QRScanner />} />
          </Route>

          {/* Admin dashboard routes */}
          <Route path="/admin/*" element={<AdminDashboard />}>
            <Route path="dashboard" element={<AdminOverview />} />
            <Route path="assets" element={<AdminAssets />} />
            
            <Route path="scan" element={<QRScanner />} />
          </Route>

          {/* Catch all - redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}