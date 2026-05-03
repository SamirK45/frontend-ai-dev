// // import React, { useContext, useEffect, useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import { UserContext } from "../context/user.context";

// // const UserAuth = ({ children }) => {
// //   const { user } = useContext(UserContext);

// //   const [loading, setloading] = useState(true);

// //   const token = localStorage.getItem("token");

// //   const navigate = useNavigate();

// //   useEffect(() => {
// //     if (user) {
// //       setloading(false);
// //     }
// //     if (!token) {
// //       console.log("No token :" , token);
// //       navigate("/login");
// //     }

// //     if (!user) {
// //       console.log("No user :", user);
// //       navigate("/login");
// //     }
// //   }, []);

// //   if (loading) {
// //     return <div>Loading...</div>;
// //   }

// //   return <>{children}</>;
// // };

// // export default UserAuth;

// import React, { useContext, useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { UserContext } from "../context/user.context";
// import axios from "../config/axios";

// const UserAuth = ({ children }) => {
//   const { user, setUser } = useContext(UserContext);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();
//   const token = localStorage.getItem("token");

//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         if (!token) {
//           setLoading(false);
//           navigate("/login");
//           return;
//         }

//         // Get user profile from backend
//         const response = await axios.get("/users/profile");
//         setUser(response.data.user);
//         setLoading(false);
//       } catch (error) {
//         console.error("Auth error:", error);
//         localStorage.removeItem("token");
//         setLoading(false);
//         navigate("/login");
//       }
//     };

//     fetchUser();
//   }, [token, navigate, setUser]);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin border-t-blue-500" />
//       </div>
//     );
//   }

//   if (!user && !loading) {
//     navigate("/login");
//     return null;
//   }

//   return <>{children}</>;
// };

// export default UserAuth;

import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";

const UserAuth = ({ children }) => {
  const { user, setUser } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        
        if (!token) {
          throw new Error("No token found");
        }

        const response = await axios.get("/users/profile");
        
        if (response.data.user) {
          setUser(response.data.user);
        } else {
          throw new Error("No user data received");
        }
      } catch (error) {
        console.error("Auth error:", error);
        localStorage.removeItem("token");
        setUser(null);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [setUser, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin border-t-blue-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export default UserAuth;
