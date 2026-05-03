import React from "react";
import AppRoutes from "./routes/AppRoutes";
import { UserProvider } from "./context/user.context";
import "remixicon/fonts/remixicon.css";
import { EmailProvider } from "./context/email.context";

const App = () => {
  return (
    <UserProvider>
      <EmailProvider>
        <AppRoutes />
      </EmailProvider>
    </UserProvider>
  );
};

export default App;
