import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from './pages/LoginPage';
import CardPage from './pages/CardPage';
import RegisterPage from './pages/RegisterPage';

//Removed Login Page to make changes work with Rian's Database/API functions - Jean

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/Register" element={<RegisterPage />} />
        <Route path="/cards" element={<CardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
