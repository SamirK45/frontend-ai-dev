import React, { useState, useContext, useEffect, useRef } from "react";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Plus, Trash2, Users, FolderOpen, Sparkles,
  ChevronDown, Search, LayoutGrid, Clock,
} from "lucide-react";
import ProfileDropdown from "../screens/ProjectHomeNavbar/ProfileDropdown";

const Home = () => {
  const { user } = useContext(UserContext);
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Particle background
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
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.4 + 0.05;
        this.hue = Math.random() * 60 + 220;
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

    for (let i = 0; i < 60; i++) particles.push(new Particle());

    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(124, 92, 252, ${0.06 * (1 - dist / 100)})`;
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

  useEffect(() => {
    axios
      .get("/projects/all")
      .then((res) => setProjects(res.data.projects))
      .catch((err) => console.error(err));
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/projects/create", { name: projectName });
      const res = await axios.get("/projects/all");
      setProjects(res.data.projects);
      setShowModal(false);
      setProjectName("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (projectId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await axios.delete(`/projects/delete/${projectId}`);
        setProjects(projects.filter((project) => project._id !== projectId));
      } catch (err) {
        console.error("Error deleting project:", err);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProjectColor = (index) => {
    const colors = [
      ["#7c5cfc", "#3b82f6"],
      ["#a855f7", "#ec4899"],
      ["#06b6d4", "#3b82f6"],
      ["#22c55e", "#06b6d4"],
      ["#f97316", "#eab308"],
      ["#ef4444", "#f97316"],
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="home-page">
      {/* Particle canvas */}
      <canvas ref={canvasRef} className="home-canvas" />

      {/* Gradient orbs */}
      <div
        className="home-orb home-orb-1"
        style={{ transform: `translate(${mousePos.x * 15}px, ${mousePos.y * 15}px)` }}
      />
      <div
        className="home-orb home-orb-2"
        style={{ transform: `translate(${mousePos.x * -10}px, ${mousePos.y * -10}px)` }}
      />

      {/* Navbar */}
      <motion.nav
        className="home-navbar"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="home-nav-left">
          <div className="home-nav-logo">
            <Brain size={20} />
          </div>
          <span className="home-nav-brand">CodeMate</span>
        </div>

        <div className="home-nav-right">
          <div className="home-nav-profile-wrap">
            <motion.button
              className="home-nav-profile"
              onClick={() => setShowDropdown(!showDropdown)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="home-nav-avatar">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <span className="home-nav-username">{user?.email?.split("@")[0]}</span>
              <ChevronDown size={14} className="home-nav-chevron" />
            </motion.button>

            <AnimatePresence>
              {showDropdown && (
                <ProfileDropdown
                  user={user}
                  onLogout={handleLogout}
                  onClose={() => setShowDropdown(false)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="home-main">
        {/* Hero Section */}
        <motion.div
          className="home-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h1 className="home-hero-title">
            Your <span className="home-hero-gradient">Projects</span>
          </h1>
          <p className="home-hero-sub">
            Build, collaborate, and ship AI-powered applications
          </p>
        </motion.div>

        {/* Actions Bar */}
        <motion.div
          className="home-actions-bar"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <div className="home-search-wrap">
            <Search size={16} className="home-search-icon" />
            <input
              type="text"
              className="home-search-input"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <motion.button
            className="home-create-btn"
            onClick={() => setShowModal(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Plus size={18} />
            <span>New Project</span>
          </motion.button>
        </motion.div>

        {/* Projects Grid */}
        <div className="home-projects-grid">
          {filteredProjects.length === 0 && !searchQuery && (
            <motion.div
              className="home-empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="home-empty-icon">
                <FolderOpen size={36} />
              </div>
              <h3>No projects yet</h3>
              <p>Create your first project to get started</p>
              <motion.button
                className="home-empty-btn"
                onClick={() => setShowModal(true)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Plus size={16} />
                <span>Create Project</span>
              </motion.button>
            </motion.div>
          )}

          {filteredProjects.length === 0 && searchQuery && (
            <div className="home-empty">
              <div className="home-empty-icon">
                <Search size={36} />
              </div>
              <h3>No results found</h3>
              <p>Try a different search term</p>
            </div>
          )}

          {filteredProjects.map((project, index) => {
            const [c1, c2] = getProjectColor(index);
            return (
              <motion.div
                key={project._id}
                className="home-project-card"
                onClick={() => navigate("/project", { state: { project } })}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.4 }}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Card accent bar */}
                <div
                  className="home-card-accent"
                  style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                />

                <div className="home-card-body">
                  <div className="home-card-top">
                    <div
                      className="home-card-icon"
                      style={{
                        background: `linear-gradient(135deg, ${c1}25, ${c2}15)`,
                        borderColor: `${c1}25`,
                      }}
                    >
                      <FolderOpen size={18} style={{ color: c1 }} />
                    </div>
                    <motion.button
                      className="home-card-delete"
                      onClick={(e) => handleDeleteProject(project._id, e)}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      title="Delete project"
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </div>

                  <h3 className="home-card-name">{project.name}</h3>

                  <div className="home-card-meta">
                    <div className="home-card-stat">
                      <Users size={13} />
                      <span>{project.users?.length || 0} member{project.users?.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Create Project Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="home-modal-overlay"
            onClick={() => { setShowModal(false); setProjectName(""); }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="home-modal-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
            >
              <div className="home-modal-glow" />
              <div className="home-modal-content">
                <div className="home-modal-header">
                  <div className="home-modal-header-left">
                    <div className="home-modal-icon">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3>Create New Project</h3>
                      <p>Start building something amazing</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleCreateProject}>
                  <div className="home-modal-field">
                    <label htmlFor="project-name">Project Name</label>
                    <div className="home-modal-input-wrap">
                      <FolderOpen size={16} className="home-modal-input-icon" />
                      <input
                        id="project-name"
                        type="text"
                        placeholder="My awesome project"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="home-modal-footer">
                    <button
                      type="button"
                      className="home-modal-btn-cancel"
                      onClick={() => { setShowModal(false); setProjectName(""); }}
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      className="home-modal-btn-create"
                      disabled={!projectName.trim()}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Plus size={16} />
                      <span>Create Project</span>
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
