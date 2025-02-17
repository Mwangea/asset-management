import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import { Toaster } from "react-hot-toast";


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <Toaster position="top-right" />
        <Routes>
        <Route path="/" element={<LandingPage/> } />
        <Route path="/login" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
      
  )
}