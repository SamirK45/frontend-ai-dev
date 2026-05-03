import React, { createRef, useState, useContext, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../config/axios";
import {
  initializeSocket,
  receiveMessage,
  sendMessage,
} from "../config/socket";
import { UserContext } from "../context/user.context";
import Markdown from "markdown-to-jsx";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import { getWebContainer } from "../config/webContainer";
import {
  Brain, Users, UserPlus, X, Send, Plus, Sparkles, Wrench,
  Play, FolderOpen, Code2, Globe, ChevronRight, MessageSquare,
  Bot, FileCode2, Pencil, Zap,
} from "lucide-react";

function SyntaxHighlightedCode(props) {
  const ref = useRef(null);

  React.useEffect(() => {
    if (ref.current && props.className?.includes("lang-") && window.hljs) {
      window.hljs.highlightElement(ref.current);
      ref.current.removeAttribute("data-highlighted");
    }
  }, [props.className, props.children]);

  return <code {...props} ref={ref} />;
}

const Project = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidePanelOpen, setisSidePanelOpen] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setusers] = useState([]);
  const [project, setproject] = useState(location.state.project);
  const [messages, setMessages] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const { user } = useContext(UserContext);
  const [fileTree, setfileTree] = useState(
    location.state.project.fileTree || {}
  );

  const [openFiles, setopenFiles] = useState([]);
  const [currentFile, setcurrentFile] = useState(null);
  const [webContainer, setwebContainer] = useState(null);
  const [iframeUrl, setiframeUrl] = useState(null);
  const [runProcess, setrunProcess] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [activeTab, setActiveTab] = useState("prompt");
  const messageBox = createRef();
  const textareaRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    initializeSocket(project._id);

    if (!webContainer) {
      getWebContainer().then((container) => {
        setwebContainer(container);
        console.log("Container started...");
      });
    }

    receiveMessage("project-message", (data) => {
      setCurrentUser(data.sender);
      
      // Check if sender is the current user (handle both string and object sender)
      const senderEmail = typeof data.sender === 'object' ? data.sender?.email : data.sender;
      const isAi = typeof data.sender === 'object' && data.sender?._id === 'ai';
      
      if (senderEmail !== user.email || isAi) {
        let message;
        try {
          message =
            typeof data.messages === "string"
              ? JSON.parse(data.messages)
              : data.messages;
        } catch (error) {
          // If JSON.parse fails, treat message as plain text
          console.error("Error parsing message:", error);
          message = { text: data.messages };
        }

        try {
          if (message.fileTree) {
            webContainer?.mount(message.fileTree);
            setfileTree(message.fileTree);
          }
        } catch (error) {
          console.error("Error mounting fileTree:", error);
        }

        addNewMessage({ ...data, type: "incoming" });
      }
    });

    axios
      .get(`/projects/get-project/${location.state.project._id}`)
      .then((res) => {
        setproject(res.data.project);
        setfileTree(res.data.project.fileTree);
      })
      .catch((err) => {
        console.log(err);
      });

    axios
      .get("/users/all")
      .then((res) => {
        setusers(res.data.users);
      })
      .catch((err) => {
        console.log(err);
      });

    loadMessages();
  }, [project._id, user.email]);

  const loadMessages = async () => {
    try {
      const response = await axios.get(`/messages/project/${project._id}`);
      setChatMessages(response.data);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return Array.from(newSet);
    });
  };

  function addCollaborators() {
    axios
      .put("/projects/add-user", {
        users: Array.from(selectedUsers),
        projectId: location.state.project._id,
      })
      .then((res) => {
        setShowUserModal(false);
        setSelectedUsers([]);
        axios
          .get(`/projects/get-project/${location.state.project._id}`)
          .then((res) => {
            setproject(res.data.project);
            setfileTree(res.data.project.fileTree);
          })
          .catch((err) => console.log(err));
      })
      .catch((err) => {
        console.log(err);
      });
  }

  const addNewMessage = (messageObject) => {
    setChatMessages((prev) => [...prev, messageObject]);
    setTimeout(scrollToBottom, 0);
  };

  async function send() {
    if (!messages.trim()) return;

    const newMessage = {
      messages,
      sender: user.email,
      type: "outgoing",
      projectId: project._id,
    };

    try {
      await axios.post("/messages/save", newMessage);

      if (currentUser !== user.email) {
        sendMessage("project-message", newMessage);
      }

      addNewMessage(newMessage);
      setMessages("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  function scrollToBottom() {
    if (messageBox.current) {
      messageBox.current.scrollTop = messageBox.current.scrollHeight;
    }
  }

  function WriteAiMessage(message) {
    let messageObject;
    try {
      // Handle case where message is already an object
      if (typeof message === 'object' && message !== null) {
        messageObject = message;
      } else if (typeof message === 'string') {
        messageObject = JSON.parse(message);
      } else {
        messageObject = { text: String(message) };
      }
    } catch {
      messageObject = { text: typeof message === 'string' ? message : String(message) };
    }

    const displayText = messageObject.text || (typeof message === 'string' ? message : JSON.stringify(message));

    return (
      <div className="proj-ai-card">
        <Markdown
          options={{
            overrides: {
              code: SyntaxHighlightedCode,
            },
          }}
        >
          {displayText}
        </Markdown>
      </div>
    );
  }

  function saveFileTree(ft) {
    axios
      .put("/projects/update-fileTree", {
        projectId: project._id,
        fileTree: ft,
      })
      .then((res) => {
        console.log(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  const getFilteredMentions = () => {
    const allMentions = [
      { id: "ai", name: "ai", email: "ai@assistant.com" },
      ...(project.users || []).map((user) => ({
        id: user._id,
        name: user.email.split("@")[0],
        email: user.email,
      })),
    ];

    return allMentions.filter((mention) =>
      mention.name.toLowerCase().includes(mentionFilter.toLowerCase())
    );
  };

  const handleTextareaChange = (e) => {
    setMessages(e.target.value);
    const cursorPos = e.target.selectionStart;
    setCursorPosition(cursorPos);

    const beforeCursor = e.target.value.substring(0, cursorPos);
    const lastAtIndex = beforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const filterText = beforeCursor.substring(lastAtIndex + 1);
      setMentionFilter(filterText);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }

    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
      setShowMentions(false);
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    const iconMap = {
      js: "ri-javascript-line",
      jsx: "ri-reactjs-line",
      ts: "ri-code-s-slash-line",
      tsx: "ri-reactjs-line",
      css: "ri-css3-line",
      html: "ri-html5-line",
      json: "ri-braces-line",
      md: "ri-markdown-line",
      py: "ri-terminal-line",
    };
    return iconMap[ext] || "ri-file-code-line";
  };

  // Non-JS language file extensions to detect non-JS projects
  const nonJsExtensions = ['.py', '.go', '.java', '.rs', '.rb', '.php', '.cpp', '.c', '.cs', '.swift', '.kt', '.dart', '.scala', '.zig', '.lua', '.r', '.pl', '.ex', '.exs', '.hs', '.ml', '.ts'];
  const webContainerFiles = ['server.js', 'package.json'];

  // Get files to display in explorer (hide server.js/package.json for non-JS projects)
  const getDisplayFiles = () => {
    const allFiles = Object.keys(fileTree || {});
    const hasNonJsFiles = allFiles.some(f => nonJsExtensions.some(ext => f.endsWith(ext)));
    // Only hide server.js/package.json if there are non-JS language files present
    // This means for pure Node.js/Express projects, they'll still be visible
    if (hasNonJsFiles) {
      return allFiles.filter(f => !webContainerFiles.includes(f));
    }
    return allFiles;
  };

  const displayFiles = getDisplayFiles();
  const fileCount = displayFiles.length;

  return (
    <main className="proj-main">
      {/* Ambient background effects */}
      <div className="proj-bg-orb proj-bg-orb-1" />
      <div className="proj-bg-orb proj-bg-orb-2" />
      <div className="proj-bg-orb proj-bg-orb-3" />

      {/* ========== LEFT: Chat Panel ========== */}
      <section className="proj-chat-panel">
        {/* Chat Header */}
        <div className="proj-chat-header">
          <div className="proj-chat-header-left">
            <div className="proj-chat-logo">
              <Brain size={16} />
            </div>
            <div className="proj-chat-header-info">
              <span className="proj-chat-project-name">{project.name || "Project"}</span>
              <span className="proj-chat-member-count">
                {project.users?.length || 0} member{project.users?.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="proj-chat-header-actions">
            <motion.button
              className="proj-header-btn"
              onClick={() => setShowUserModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Add collaborator"
            >
              <UserPlus size={15} />
            </motion.button>
            <motion.button
              className="proj-header-btn"
              onClick={() => setisSidePanelOpen(!isSidePanelOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="View collaborators"
            >
              <Users size={15} />
            </motion.button>
          </div>
        </div>

        {/* Toggle Tabs */}
        <div className="proj-tab-bar">
          <button
            className={`proj-tab ${activeTab === "edit" ? "proj-tab-active" : ""}`}
            onClick={() => setActiveTab("edit")}
          >
            <Pencil size={13} />
            <span>Edit</span>
          </button>
          <button
            className={`proj-tab ${activeTab === "prompt" ? "proj-tab-active" : ""}`}
            onClick={() => setActiveTab("prompt")}
          >
            <Zap size={13} />
            <span>Prompt</span>
          </button>
        </div>

        {/* Chat Messages */}
        <div ref={messageBox} className="proj-chat-messages message-box">
          {chatMessages.length === 0 && (
            <div className="proj-chat-empty">
              <div className="proj-chat-empty-icon">
                <MessageSquare size={32} />
              </div>
              <p className="proj-chat-empty-title">Start a conversation</p>
              <p className="proj-chat-empty-sub">Describe what you want to build or change</p>
            </div>
          )}

          {chatMessages.map((messageObject, index) => {
            const isAi = typeof messageObject.sender === 'object'
              ? messageObject.sender?._id === "ai"
              : messageObject.sender === "ai";
            const senderName = isAi
              ? "ai"
              : typeof messageObject.sender === 'string'
                ? messageObject.sender.split("@")[0]
                : messageObject.sender?.email?.split("@")[0] || "Unknown";

            return (
              <motion.div
                key={index}
                className={`proj-msg ${messageObject.type === "outgoing" ? "proj-msg-out" : "proj-msg-in"}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="proj-msg-sender">
                  {isAi ? (
                    <>
                      <Bot size={13} className="proj-msg-sender-icon" />
                      <span>AI Assistant</span>
                    </>
                  ) : (
                    <>
                      <div className="proj-msg-avatar">{senderName.charAt(0).toUpperCase()}</div>
                      <span>{senderName}</span>
                    </>
                  )}
                </div>
                {isAi ? (
                  WriteAiMessage(messageObject.messages)
                ) : (
                  <p className="proj-msg-text">{messageObject.messages}</p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Chat Input Area */}
        <div className="proj-chat-input-area">
          {/* Mentions dropdown */}
          <AnimatePresence>
            {showMentions && (
              <motion.div
                className="proj-mention-dropdown"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
              >
                {getFilteredMentions().map((mention) => (
                  <div
                    key={mention.id}
                    className="proj-mention-item"
                    onClick={() => {
                      const beforeCursor = messages.substring(0, cursorPosition);
                      const afterCursor = messages.substring(cursorPosition);
                      const lastAtIndex = beforeCursor.lastIndexOf("@");
                      const newMessage =
                        beforeCursor.substring(0, lastAtIndex) +
                        `@${mention.name} ` +
                        afterCursor;
                      setMessages(newMessage);
                      setShowMentions(false);
                    }}
                  >
                    {mention.id === "ai" ? (
                      <div className="proj-mention-icon proj-mention-icon-ai">
                        <Bot size={14} />
                      </div>
                    ) : (
                      <div className="proj-mention-icon">
                        <span>{mention.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="proj-mention-info">
                      <span className="proj-mention-name">{mention.name}</span>
                      <span className="proj-mention-email">{mention.email}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="proj-input-wrapper">
            <textarea
              ref={textareaRef}
              value={messages}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to change..."
              rows={1}
            />
            <div className="proj-input-actions">
              <div className="proj-input-left">
                <button className="proj-input-btn" title="Attach">
                  <Plus size={15} />
                </button>
                <button className="proj-input-btn" title="AI Assist">
                  <Sparkles size={15} />
                </button>
                <button className="proj-builder-tag">
                  <Wrench size={12} />
                  <span>Builder</span>
                </button>
              </div>
              <motion.button
                className="proj-send-btn"
                onClick={() => {
                  send();
                  setShowMentions(false);
                }}
                title="Send message"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                <Send size={15} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* ===== Side Panel (Collaborators) ===== */}
        <AnimatePresence>
          {isSidePanelOpen && (
            <motion.div
              className="proj-side-panel"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="proj-side-header">
                <h2>
                  <Users size={18} />
                  <span>Collaborators</span>
                </h2>
                <button className="proj-side-close" onClick={() => setisSidePanelOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="proj-side-list">
                {project.users &&
                  project.users.length > 0 &&
                  project.users.map((u) => (
                    <motion.div
                      key={u._id}
                      className="proj-collab-item"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="proj-collab-avatar">
                        {u.email?.charAt(0).toUpperCase()}
                      </div>
                      <div className="proj-collab-info">
                        <span className="proj-collab-name">{u.email?.split("@")[0]}</span>
                        <span className="proj-collab-email">{u.email}</span>
                      </div>
                      <div className="proj-collab-status" />
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ========== RIGHT: Code Editor + Output ========== */}
      <section className="proj-right-panel">
        {/* File Explorer */}
        <div className="proj-explorer">
          <div className="proj-explorer-header">
            <FolderOpen size={13} />
            <span>Explorer</span>
            <span className="proj-explorer-count">{fileCount}</span>
          </div>
          <div className="proj-explorer-files">
            {displayFiles.map((file) => (
              <button
                key={file}
                onClick={() => {
                  setcurrentFile(file);
                  setopenFiles([...new Set([...openFiles, file])]);
                }}
                className={`proj-file-item ${currentFile === file ? "proj-file-active" : ""}`}
              >
                <i className={getFileIcon(file)} />
                <span>{file}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Code Editor Container */}
        <div className="proj-editor-container">
          {/* File Tabs Bar */}
          <div className="proj-tabs-bar">
            <div className="proj-tabs">
              {openFiles.filter(f => {
                const allFiles = Object.keys(fileTree || {});
                const hasNonJsFiles = allFiles.some(fn => nonJsExtensions.some(ext => fn.endsWith(ext)));
                return hasNonJsFiles ? !webContainerFiles.includes(f) : true;
              }).map((file) => (
                <button
                  key={file}
                  onClick={() => setcurrentFile(file)}
                  className={`proj-file-tab ${currentFile === file ? "proj-file-tab-active" : ""}`}
                >
                  <span className="proj-tab-dot" />
                  {file}
                </button>
              ))}
            </div>

            <motion.button
              onClick={async () => {
                await webContainer.spawn("npx", ["kill-port", "3000"]);
                await webContainer.mount(fileTree);
                const installProcess = await webContainer?.spawn("npm", [
                  "install",
                ]);
                installProcess.output.pipeTo(
                  new WritableStream({
                    write(data) {
                      console.log(data);
                    },
                  })
                );

                if (runProcess) {
                  runProcess.kill();
                }

                let tempRunProcess = await webContainer?.spawn("npm", [
                  "start",
                ]);

                tempRunProcess.output.pipeTo(
                  new WritableStream({
                    write(data) {
                      console.log(data);
                    },
                  })
                );

                setrunProcess(tempRunProcess);

                webContainer.on("server-ready", (port, url) => {
                  console.log(`Server is ready at ${url}:${port}`);
                  setiframeUrl(url);
                });
              }}
              className="proj-run-btn"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <Play size={14} fill="currentColor" />
              <span>Run</span>
            </motion.button>
          </div>

          {/* File Path Breadcrumb */}
          {currentFile && (
            <div className="proj-breadcrumb">
              <FolderOpen size={12} />
              <ChevronRight size={10} />
              <span>{currentFile}</span>
            </div>
          )}

          {/* Code Content */}
          <div className="proj-code-area">
            {fileTree && currentFile && fileTree[currentFile] ? (
              <pre>
                <code
                  className="hljs"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const updatedContent = e.target.innerText;
                    const ft = {
                      ...fileTree,
                      [currentFile]: {
                        file: {
                          contents: updatedContent,
                        },
                      },
                    };
                    setfileTree(ft);
                    saveFileTree(ft);
                  }}
                  dangerouslySetInnerHTML={{
                    __html: hljs.highlightAuto(
                      fileTree[currentFile].file.contents
                    ).value,
                  }}
                  style={{
                    whiteSpace: "pre-wrap",
                    paddingBottom: "25rem",
                    counterSet: "line-numbering",
                  }}
                />
              </pre>
            ) : (
              <div className="proj-code-empty">
                <div className="proj-code-empty-icon">
                  <Code2 size={40} />
                </div>
                <p>Select a file to view code</p>
              </div>
            )}
          </div>
        </div>

        {/* Output / Preview Panel */}
        {iframeUrl && webContainer && (
          <div className="proj-preview-panel">
            <div className="proj-preview-header">
              <Globe size={14} />
              <input
                type="text"
                onChange={(e) => setiframeUrl(e.target.value)}
                value={iframeUrl}
              />
            </div>
            <iframe src={iframeUrl} className="proj-preview-iframe" />
          </div>
        )}
      </section>

      {/* ========== User Select Modal ========== */}
      <AnimatePresence>
        {showUserModal && (
          <motion.div
            className="proj-modal-overlay"
            onClick={() => setShowUserModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="proj-modal-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
            >
              <div className="proj-modal-glow" />
              <div className="proj-modal-content">
                <div className="proj-modal-header">
                  <div className="proj-modal-header-left">
                    <div className="proj-modal-icon">
                      <UserPlus size={18} />
                    </div>
                    <div>
                      <h3>Add Collaborators</h3>
                      <p>Invite team members to this project</p>
                    </div>
                  </div>
                  <button className="proj-modal-close" onClick={() => setShowUserModal(false)}>
                    <X size={18} />
                  </button>
                </div>

                <div className="proj-modal-list">
                  {users &&
                    users.length > 0 &&
                    users.map((u) => (
                      <motion.div
                        key={u._id}
                        onClick={() => handleUserSelect(u._id)}
                        className={`proj-modal-user ${
                          Array.from(selectedUsers).includes(u._id) ? "proj-modal-user-selected" : ""
                        }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="proj-modal-user-avatar">
                          {u.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="proj-modal-user-info">
                          <span className="proj-modal-user-name">{u.email?.split("@")[0]}</span>
                          <span className="proj-modal-user-email">{u.email}</span>
                        </div>
                        <div className={`proj-modal-check ${
                          Array.from(selectedUsers).includes(u._id) ? "proj-modal-check-active" : ""
                        }`}>
                          {Array.from(selectedUsers).includes(u._id) && (
                            <i className="ri-check-line" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                </div>

                <div className="proj-modal-footer">
                  <button className="proj-modal-btn-cancel" onClick={() => setShowUserModal(false)}>
                    Cancel
                  </button>
                  <motion.button
                    className="proj-modal-btn-confirm"
                    onClick={() => {
                      addCollaborators();
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <UserPlus size={14} />
                    <span>Add Selected</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Project;
