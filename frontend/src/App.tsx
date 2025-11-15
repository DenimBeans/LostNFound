import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import RegisterPage from './pages/RegisterPage';
import ForgorPassPage from './pages/ForgorPassPage';
import PasswordResetPage from './pages/PasswordResetPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import NotificationPage from './pages/NotificationPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import AboutPage from './pages/AboutPage';
import EmailReVerPage from './pages/EmailReVerPage';


//Removed Login Page to make changes work with Rian's Database/API functions - Jean

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/Register" element={<RegisterPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/PasswordResetEmail" element={<ForgorPassPage />} />
        <Route path="/reset-password/:token" element={<PasswordResetPage/>} />
        <Route path = "/verify/:token" element={<EmailVerificationPage/>} />
        <Route path="/Notification" element={<NotificationPage />} />
        <Route path="/AccountSettings" element={<AccountSettingsPage />} />
        <Route path="/About" element={<AboutPage />} />
        <Route path="/api/auth/verify/:token" element = {<EmailReVerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
