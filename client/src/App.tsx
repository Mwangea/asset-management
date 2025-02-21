import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { PrivateRoute } from "./components/PrivateRoute";
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
import UnauthorizedPage from "./components/UnauthorizedPage";
import Users from "./admin/pages/Users";
import UserQRCodes from "./admin/pages/UserQRCodes";


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          {/* User dashboard routes - protected for authenticated users */}
          <Route
            path="/user/*"
            element={
              <PrivateRoute requiredRole="user">
                <UserDashboard />
              </PrivateRoute>
            }
          >
            <Route path="dashboard" element={<UserOverview />} />
            <Route path="assets" element={<UserAssets />} />
            <Route path="scan" element={<QRScanner />} />

          </Route>

          {/* Admin dashboard routes - protected for admin users */}
          <Route
            path="/admin/*"
            element={
              <PrivateRoute requiredRole="admin">
                <AdminDashboard />
              </PrivateRoute>
            }
          >
            <Route path="dashboard" element={<AdminOverview />} />
            <Route path="assets" element={<AdminAssets />} />
            <Route path="scan" element={<QRScanner />} />
            <Route  path="users" element={<Users />} />
            <Route path="download" element={<UserQRCodes />} />
          </Route>

          {/* Catch all - redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}