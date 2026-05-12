import React, { useState, useContext, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../config/axios.js";
import { emailContext } from "../context/email.context";
import {
  Brain, ArrowRight, Sparkles, ShieldCheck, MailCheck, RefreshCw,
} from "lucide-react";

const OTP_LENGTH = 6;

const VerifyCode = () => {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [resendCooldown, setResendCooldown] = useState(0);
  const [focusedIdx, setFocusedIdx] = useState(-1);

  const inputRefs = useRef([]);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const { email } = useContext(emailContext);

  // ─── Particle system ─────────────────────────────────────────
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
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.hue = Math.random() * 60 + 170; // teal-blue range
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

    for (let i = 0; i < 80; i++) particles.push(new Particle());

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
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => { p.update(); p.draw(); });
      drawConnections();
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ─── Mouse parallax ──────────────────────────────────────────
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

  // ─── Resend cooldown timer ───────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // ─── Auto-focus first input on mount ─────────────────────────
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // ─── Mask email ──────────────────────────────────────────────
  const maskEmail = (addr) => {
    if (!addr) return "your email";
    const [user, domain] = addr.split("@");
    if (!domain) return addr;
    const visible = user.slice(0, 2);
    return `${visible}${"•".repeat(Math.max(user.length - 2, 3))}@${domain}`;
  };

  // ─── OTP handlers ────────────────────────────────────────────
  const handleChange = useCallback((index, value) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError("");

    // Auto-advance
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    const nextIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextIdx]?.focus();
  }, [otp]);

  // ─── Submit ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");

    if (code.length < OTP_LENGTH) {
      setError("Please enter the complete verification code");
      return;
    }
    if (!email) {
      setError("Email is required. Please go back and register again.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await axios.post("/users/verify-user", {
        email: email,
        otp: code,
      });

      if (response.status === 200) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setError("Verification failed. Please try again.");
      }
    } catch (err) {
      console.error("Verification error:", err);
      const errorMessage =
        err.response?.data?.errors ||
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        "Invalid code. Please check and try again.";

      setError(Array.isArray(errorMessage) ? errorMessage[0].msg : errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Resend ──────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setResendCooldown(60);
    setError("");
    setOtp(Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
    // You can add an actual resend API call here
    // try { await axios.post("/users/resend-otp", { email }); } catch {}
  };

  // ─── 3D floating shapes ──────────────────────────────────────
  const shapes = [
    { type: "cube", size: 50, x: "14%", y: "22%", delay: 0, duration: 21 },
    { type: "octahedron", size: 42, x: "84%", y: "14%", delay: 2, duration: 27 },
    { type: "torus", size: 60, x: "9%", y: "72%", delay: 3.5, duration: 17 },
    { type: "pyramid", size: 45, x: "86%", y: "72%", delay: 1.5, duration: 23 },
    { type: "cube", size: 32, x: "68%", y: "44%", delay: 4, duration: 29 },
    { type: "octahedron", size: 36, x: "28%", y: "58%", delay: 5, duration: 16 },
  ];

  const allFilled = otp.every((d) => d !== "");

  return (
    <div className="auth-page">
      {/* Particle canvas background */}
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
        <Link to="/landing-page" className="auth-logo">
          <div className="auth-logo-icon">
            <Brain size={22} />
          </div>
          <span className="auth-logo-text">AIdev</span>
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
          <div className="auth-card-glow auth-card-glow-verify" />

          {/* Card content */}
          <div className="auth-card-content">
            {/* Success state */}
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  className="verify-success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="verify-success-icon">
                    <ShieldCheck size={40} />
                  </div>
                  <h2 className="auth-title">Verified!</h2>
                  <p className="auth-subtitle">
                    Your email has been verified successfully. Redirecting to login...
                  </p>
                  <div className="auth-spinner" style={{ margin: "20px auto 0" }} />
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  {/* Header */}
                  <motion.div
                    className="auth-card-header"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <div className="auth-icon-badge auth-icon-badge-verify">
                      <MailCheck size={24} />
                    </div>
                    <h1 className="auth-title">Verify Your Email</h1>
                    <p className="auth-subtitle">
                      We sent a 6-digit code to{" "}
                      <span style={{ color: "#67e8f9", fontWeight: 600 }}>
                        {maskEmail(email)}
                      </span>
                    </p>
                  </motion.div>

                  <form onSubmit={handleSubmit} className="auth-form">
                    {/* OTP Input Row */}
                    <motion.div
                      className="verify-otp-row"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      {otp.map((digit, index) => (
                        <motion.input
                          key={index}
                          ref={(el) => (inputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={1}
                          id={`code-${index}`}
                          className={`verify-otp-input ${digit ? "verify-otp-filled" : ""} ${focusedIdx === index ? "verify-otp-focused" : ""} ${error ? "verify-otp-error" : ""}`}
                          value={digit}
                          onChange={(e) => handleChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={index === 0 ? handlePaste : undefined}
                          onFocus={() => setFocusedIdx(index)}
                          onBlur={() => setFocusedIdx(-1)}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.45 + index * 0.06, duration: 0.4 }}
                        />
                      ))}
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
                      className="auth-submit-btn auth-submit-btn-verify"
                      disabled={isLoading || !allFilled}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7, duration: 0.5 }}
                    >
                      {isLoading ? (
                        <div className="auth-spinner" />
                      ) : (
                        <>
                          <span>Verify Email</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </motion.button>
                  </form>

                  {/* Resend */}
                  <motion.div
                    className="verify-resend"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <p className="auth-footer-text" style={{ marginTop: "20px" }}>
                      Didn't receive the code?{" "}
                      {resendCooldown > 0 ? (
                        <span style={{ color: "#6b6c85" }}>
                          Resend in {resendCooldown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="verify-resend-btn"
                          onClick={handleResend}
                        >
                          <RefreshCw size={13} />
                          Resend Code
                        </button>
                      )}
                    </p>
                  </motion.div>

                  {/* Footer */}
                  <motion.p
                    className="auth-footer-text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                  >
                    Wrong email?{" "}
                    <Link to="/register" className="auth-link">
                      Go back
                    </Link>
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyCode;
