import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Settings, User, LogOut } from "lucide-react";

const ProfileDropdown = ({ user, onLogout, onClose }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    onClose();
    if (onLogout) onLogout();
    navigate("/login");
  };

  return (
    <motion.div
      className="home-dropdown"
      ref={dropdownRef}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {/* Profile Header */}
      <div className="home-dropdown-header">
        <div className="home-dropdown-avatar">
          {user?.email?.charAt(0).toUpperCase()}
        </div>
        <div className="home-dropdown-user-info">
          <span className="home-dropdown-name">{user?.email?.split("@")[0]}</span>
          <span className="home-dropdown-email">{user?.email}</span>
        </div>
      </div>

      {/* Menu Items */}
      <div className="home-dropdown-menu">
        <button
          onClick={() => handleNavigation("/profile")}
          className="home-dropdown-item"
        >
          <User size={15} />
          <span>Your Profile</span>
        </button>

        <button
          onClick={() => handleNavigation("/profile-settings")}
          className="home-dropdown-item"
        >
          <Settings size={15} />
          <span>Settings</span>
        </button>

        <div className="home-dropdown-divider" />

        <button
          onClick={handleLogout}
          className="home-dropdown-item home-dropdown-item-danger"
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </motion.div>
  );
};

export default ProfileDropdown;