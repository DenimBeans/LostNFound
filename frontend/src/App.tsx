import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from './pages/LoginPage';
import CardPage from './pages/CardPage';
import RegisterPage from './pages/RegisterPage';
import ForgorPassPage from './pages/ForgorPassPage';
import PasswordResetPage from './pages/PasswordResetPage';
import EmailVerificationPage from './pages/EmailVerificationPage';


//Removed Login Page to make changes work with Rian's Database/API functions - Jean

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/Register" element={<RegisterPage />} />
        <Route path="/cards" element={<CardPage />} />
        <Route path="/PasswordResetEmail" element={<ForgorPassPage />} />
        <Route path="/reset-password/:token" element={<PasswordResetPage/>} />
        <Route path = "/verify/:token" element={<EmailVerificationPage/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
