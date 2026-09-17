import { useState } from "react";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import ForgotPassword from "../pages/ForgotPassword";

function AuthModal({ onClose }) {
  const [page, setPage] = useState("login");

  return (
    <>
      {page === "login" && (
        <Login
          onClose={onClose}
          goSignup={() => setPage("signup")}
          goForgot={() => setPage("forgot")}
        />
      )}

      {page === "signup" && (
        <Signup
          onClose={onClose}
          goLogin={() => setPage("login")}
        />
      )}

      {page === "forgot" && (
        <ForgotPassword
          onClose={onClose}
          goLogin={() => setPage("login")}
        />
      )}
    </>
  );
}

export default AuthModal;