import React, { useState, useContext, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../config/axios.js";
import { UserContext } from "../context/user.context.jsx";
import { emailContext } from "../context/email.context.jsx";
import {
  Eye, EyeOff, ArrowRight, Sparkles, Lock, Mail, User, Shield,
} from "lucide-react";
import { ToastContainer, toast } from 'react-toastify';

const Register = () => {
  const [email, setEmailValue] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [focusedField, setFocusedField] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);
  const { setEmail } = useContext(emailContext);
  const canvasRef = useRef(null);

  const notify = () => toast("Email has been sent to your inbox");

  // Password strength calculator
  useEffect(() => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;
    setPasswordStrength(strength);
  }, [password]);

  // Particle system for background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.hue = Math.random() * 60 + 260; // purple-pink range
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 80%, 70%, ${this.opacity})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < 80; i++) {
      particles.push(new Particle());
    }

    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      drawConnections();
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Mouse parallax
  useEffect(() => {
    const handleMouse = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  // Allowed popular email domains
  const ALLOWED_DOMAINS = [
    "gmail.com", "googlemail.com",
    "outlook.com", "hotmail.com", "live.com", "msn.com",
    "yahoo.com", "yahoo.co.in", "yahoo.co.uk",
    "protonmail.com", "proton.me",
    "icloud.com", "me.com", "mac.com",
    "aol.com",
    "zoho.com", "zohomail.in",
    "mail.com",
    "yandex.com", "yandex.ru",
    "tutanota.com", "tuta.io",
    "fastmail.com",
    "gmx.com", "gmx.net",
    "rediffmail.com",
    "yopmail.com", "mailforspam.com", "mailinator.com",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const newErrors = {};

    // Email domain validation
    const emailDomain = email.split("@")[1]?.toLowerCase();
    if (!emailDomain || !ALLOWED_DOMAINS.includes(emailDomain)) {
      newErrors.email =
        "Please use a valid email from a popular provider (Gmail, Outlook, Yahoo, etc.)";
    }

    if (!passwordRegex.test(password)) {
      newErrors.password =
        "Must contain 8+ chars, uppercase, lowercase, number & special character";
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.post("/users/register", { email, password });
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
      setEmail(res.data.user.email);
      toast.success("Verification email sent to your inbox!");
      setTimeout(() => navigate("/verify-email"), 2000);
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage =
        err.response?.data?.errors ||
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        "Registration failed";

      setErrors({ submit: Array.isArray(errorMessage) ? errorMessage[0].msg : errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const strengthColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];
  const strengthLabels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];

  const shapes = [
    { type: "cube", size: 55, x: "12%", y: "18%", delay: 0, duration: 22 },
    { type: "octahedron", size: 48, x: "82%", y: "12%", delay: 1.5, duration: 26 },
    { type: "torus", size: 65, x: "8%", y: "78%", delay: 3, duration: 19 },
    { type: "pyramid", size: 42, x: "88%", y: "68%", delay: 2, duration: 24 },
    { type: "cube", size: 30, x: "72%", y: "42%", delay: 4, duration: 30 },
    { type: "octahedron", size: 38, x: "22%", y: "52%", delay: 5.5, duration: 17 },
  ];

  return (
    <div className="auth-page">
      <canvas ref={canvasRef} className="auth-canvas" />

      {/* Gradient orbs */}
      <div
        className="auth-orb auth-orb-1"
        style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)` }}
      />
      <div
        className="auth-orb auth-orb-2"
        style={{ transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px)` }}
      />
      <div
        className="auth-orb auth-orb-3"
        style={{ transform: `translate(${mousePos.x * 10}px, ${mousePos.y * -10}px)` }}
      />

      {/* 3D Floating Shapes */}
      {shapes.map((shape, i) => (
        <div
          key={i}
          className={`floating-shape floating-shape-${shape.type}`}
          style={{
            left: shape.x,
            top: shape.y,
            width: shape.size,
            height: shape.size,
            animationDelay: `${shape.delay}s`,
            animationDuration: `${shape.duration}s`,
            transform: `translate(${mousePos.x * (10 + i * 3)}px, ${mousePos.y * (10 + i * 3)}px)`,
          }}
        >
          <div className="shape-inner" style={{ animationDelay: `${shape.delay}s` }}>
            <div className="shape-face shape-face-front" />
            <div className="shape-face shape-face-back" />
            <div className="shape-face shape-face-left" />
            <div className="shape-face shape-face-right" />
            <div className="shape-face shape-face-top" />
            <div className="shape-face shape-face-bottom" />
          </div>
        </div>
      ))}

      {/* Header */}
      <motion.header
        className="auth-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Link to="/" className="auth-logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">Code<span className="logo-accent">Mate</span> AI</span>
        </Link>
      </motion.header>

      {/* Main auth card */}
      <div className="auth-container">
        <motion.div
          className="auth-card auth-card-register"
          initial={{ opacity: 0, y: 40, rotateX: 10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            transform: `perspective(1000px) rotateY(${mousePos.x * 1.5}deg) rotateX(${mousePos.y * -1.5}deg)`,
          }}
        >
          <div className="auth-card-glow auth-card-glow-purple" />

          <div className="auth-card-content">
            <motion.div
              className="auth-card-header"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="auth-icon-badge auth-icon-badge-purple">
                <Shield size={24} />
              </div>
              <h1 className="auth-title">Create Account</h1>
              <p className="auth-subtitle">Join the future of AI-powered development</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Full name */}
              <motion.div
                className={`auth-field ${focusedField === "name" ? "auth-field-focused" : ""}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
              >
                <label className="auth-label" htmlFor="reg-name">Full Name</label>
                <div className="auth-input-wrap">
                  <User size={16} className="auth-input-icon" />
                  <input
                    type="text"
                    id="reg-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    className="auth-input"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </motion.div>

              {/* Email */}
              <motion.div
                className={`auth-field ${focusedField === "email" ? "auth-field-focused" : ""}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <label className="auth-label" htmlFor="reg-email">Email Address</label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    type="email"
                    id="reg-email"
                    value={email}
                    onChange={(e) => setEmailValue(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    className="auth-input"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <motion.p className="auth-field-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {errors.email}
                  </motion.p>
                )}
              </motion.div>

              {/* Password */}
              <motion.div
                className={`auth-field ${focusedField === "password" ? "auth-field-focused" : ""}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45, duration: 0.5 }}
              >
                <label className="auth-label" htmlFor="reg-password">Password</label>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="reg-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    className="auth-input"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>

                {/* Password strength meter */}
                {password && (
                  <motion.div
                    className="password-strength"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <div className="strength-bars">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="strength-bar"
                          style={{
                            background: i < passwordStrength ? strengthColors[passwordStrength - 1] : "rgba(255,255,255,0.08)",
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="strength-text"
                      style={{ color: strengthColors[passwordStrength - 1] || "#6b7280" }}
                    >
                      {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : "Enter password"}
                    </span>
                  </motion.div>
                )}

                {errors.password && (
                  <motion.p className="auth-field-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {errors.password}
                  </motion.p>
                )}
              </motion.div>

              {/* Confirm password */}
              <motion.div
                className={`auth-field ${focusedField === "confirm" ? "auth-field-focused" : ""}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <label className="auth-label" htmlFor="reg-confirm">Confirm Password</label>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="reg-confirm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField("confirm")}
                    onBlur={() => setFocusedField(null)}
                    className="auth-input"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <motion.p className="auth-field-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {errors.confirmPassword}
                  </motion.p>
                )}
              </motion.div>

              {/* Submit error */}
              <AnimatePresence>
                {errors.submit && (
                  <motion.div
                    className="auth-error"
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                  >
                    <span>⚠️ {errors.submit}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                className="auth-submit-btn auth-submit-btn-purple"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.5 }}

              >
                {isLoading ? (
                  <div className="auth-spinner" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
              <ToastContainer />
            </form>

            {/* Footer */}
            <motion.p
              className="auth-footer-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Already have an account?{" "}
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </motion.p>

            {/* Terms */}
            <motion.p
              className="auth-terms"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              By registering, you agree to our{" "}
              <a href="#" className="auth-link">Terms of Service</a> and{" "}
              <a href="#" className="auth-link">Privacy Policy</a>
            </motion.p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
