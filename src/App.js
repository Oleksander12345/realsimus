import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Hero from "./pages/Hero";
import Registration from './pages/Registration';
import Login from './pages/Login';
import Forgot from "./pages/Forgot";
import News from "./pages/News";
import Cryptocurency from "./pages/Cryptocurency";
import Profile from "./pages/Profile";
import Long from "./pages/Long";
import Short from "./pages/Short";
import ChangePassword from "./pages/ChangePassword";
import AdminPanel from "./pages/Admin";
import CreateNews from "./pages/CreateNews";
import UpdatePassword from "./pages/UpdatePassword";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot" element={<Forgot />} />
          <Route path="/news" element={<News />} />
          <Route path="/cryptocurency" element={<Cryptocurency />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/long" element={<Long />} />
          <Route path="/short" element={<Short />} />
          <Route path="/changepassword" element={<ChangePassword />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/createnews" element={<CreateNews />} />
          <Route path="/updatepassword" element={<UpdatePassword />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
