import React, { useState, useContext, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../config/axios.js";
import { UserContext } from "../context/user.context.jsx";
import { Eye, EyeOff, ArrowRight, Sparkles, Lock, Mail } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [focusedField, setFocusedField] = useState(null);
  const [lockoutExpiry, setLockoutExpiry] = useState(parseInt(localStorage.getItem("lockoutExpiry")) || null);
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);
  const canvasRef = useRef(null);

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
        this.hue = Math.random() * 60 + 220; // blue-purple range
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

    // Draw connections
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
            ctx.strokeStyle = `rgba(124, 92, 252, ${0.08 * (1 - dist / 120)})`;
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

  // Track mouse for parallax
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

  // Handle Lockout timer
  useEffect(() => {
    let timer;
    if (lockoutExpiry) {
      const remaining = lockoutExpiry - Date.now();
      if (remaining > 0) {
        timer = setTimeout(() => {
          setLockoutExpiry(null);
          localStorage.removeItem("lockoutExpiry");
        }, remaining);
      } else {
        setLockoutExpiry(null);
        localStorage.removeItem("lockoutExpiry");
      }
    }
    return () => clearTimeout(timer);
  }, [lockoutExpiry]);

  const isLockedOut = lockoutExpiry && lockoutExpiry > Date.now();

  const submit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await axios.post("/users/login", { email, password });
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        setUser(response.data.user);
        navigate("/home");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response?.status === 429) {
        const expiry = Date.now() + 15 * 60 * 1000;
        setLockoutExpiry(expiry);
        localStorage.setItem("lockoutExpiry", expiry.toString());
      }

      const errorMessage =
        error.response?.data?.errors ||
        error.response?.data?.message ||
        (typeof error.response?.data === 'string' ? error.response.data : null) ||
        "Invalid credentials. Please try again.";

      setError(Array.isArray(errorMessage) ? errorMessage[0].msg : errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 3D floating shapes
  const shapes = [
    { type: "cube", size: 60, x: "15%", y: "20%", delay: 0, duration: 20 },
    { type: "octahedron", size: 45, x: "80%", y: "15%", delay: 2, duration: 25 },
    { type: "torus", size: 70, x: "10%", y: "75%", delay: 4, duration: 18 },
    { type: "pyramid", size: 50, x: "85%", y: "70%", delay: 1, duration: 22 },
    { type: "cube", size: 35, x: "70%", y: "45%", delay: 3, duration: 28 },
    { type: "octahedron", size: 40, x: "25%", y: "55%", delay: 5, duration: 15 },
  ];

  return (
    <div className="auth-page">
      {/* Particle canvas background */}
      <canvas ref={canvasRef} className="auth-canvas" />

      {/* Gradient orbs */}
      <div
        className="auth-orb auth-orb-1"
        style={{
          transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`,
        }}
      />
      <div
        className="auth-orb auth-orb-2"
        style={{
          transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px)`,
        }}
      />
      <div
        className="auth-orb auth-orb-3"
        style={{
          transform: `translate(${mousePos.x * 10}px, ${mousePos.y * -10}px)`,
        }}
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
          className="auth-card"
          initial={{ opacity: 0, y: 40, rotateX: 10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            transform: `perspective(1000px) rotateY(${mousePos.x * 2}deg) rotateX(${mousePos.y * -2}deg)`,
          }}
        >
          {/* Card glow effect */}
          <div className="auth-card-glow" />

          {/* Card content */}
          <div className="auth-card-content">
            <motion.div
              className="auth-card-header"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="auth-icon-badge">
                <Sparkles size={24} />
              </div>
              <h1 className="auth-title">Welcome Back</h1>
              <p className="auth-subtitle">Sign in to continue building with AI</p>
            </motion.div>

            <form onSubmit={submit} className="auth-form">
              {/* Email field */}
              <motion.div
                className={`auth-field ${focusedField === "email" ? "auth-field-focused" : ""}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <label className="auth-label" htmlFor="login-email">
                  Email Address
                </label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    type="email"
                    id="login-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    className="auth-input"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </motion.div>

              {/* Password field */}
              <motion.div
                className={`auth-field ${focusedField === "password" ? "auth-field-focused" : ""}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <label className="auth-label" htmlFor="login-password">
                  Password
                </label>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    className="auth-input"
                    placeholder={isLockedOut ? "Locked out for 15 mins" : "••••••••"}
                    required
                    autoComplete="current-password"
                    disabled={isLockedOut}
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
              </motion.div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="auth-error"
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                  >
                    <span>⚠️ {error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button */}
              <motion.button
                type="submit"
                className="auth-submit-btn"
                disabled={isLoading || isLockedOut}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                {isLoading ? (
                  <div className="auth-spinner" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <motion.div
              className="auth-divider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <span>or</span>
            </motion.div>

            {/* Social buttons */}
            <motion.div
              className="auth-social-row"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <button className="auth-social-btn" type="button">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Google</span>
              </button>
              <button className="auth-social-btn" type="button">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span>GitHub</span>
              </button>
            </motion.div>

            {/* Footer */}
            <motion.p
              className="auth-footer-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              Don't have an account?{" "}
              <Link to="/register" className="auth-link">
                Create one
              </Link>
            </motion.p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
