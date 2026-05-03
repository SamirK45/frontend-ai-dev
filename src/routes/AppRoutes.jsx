import React from "react";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import Login from "../screens/Login";
import Register from "../screens/Register";
import Home from "../screens/Home";
import Project from "../screens/Project";
import UserAuth from "../auth/UserAuth";
import VerifyCode from "../screens/VerifyCode";
import { EmailProvider } from "../context/email.context";
import Landing from "../screens/Landing";
import Settings from "../screens/ProjectHomeNavbar/settings";
import Profile from "../screens/ProjectHomeNavbar/Profile";
const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/home"
          element={
            <UserAuth>
              <Home />
            </UserAuth>
          }
        />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/project"
          element={
            <UserAuth>
              <Project />
            </UserAuth>
          }
        />
        <Route path="/verify-email" element={<VerifyCode />} />
        <Route path="/profile-settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
