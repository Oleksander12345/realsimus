import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("http://localhost/api/auth/profile", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("email", data.email);
        localStorage.setItem("email", data.username); 
      } else {
        console.error("Could not get your email, status:", response.status);
      }
    } catch (error) {
      console.error("Error when receiving a profile:", error);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch("http://localhost/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem("token", data.token);
            
            const decodedToken = JSON.parse(atob(data.token.split(".")[1]));

            localStorage.setItem("username", decodedToken.sub);

            if (decodedToken.roles) {
                localStorage.setItem("role", JSON.stringify(decodedToken.roles));
            } else {
                console.error("❌ Role not found in token!");
            }

            await fetchUserProfile();

            setTimeout(() => {
                navigate("/news"); 
            }, 500);
        } else {
            setError(data.message || "Login failed");
        }
    } catch (error) {
        setError("Server error. Please try again later.");
    }
};


  return (
    <main className="Login">
      <header className="Hero-header">
        <div className="Hero-header-container">
          <div className="Hero-logo">
              <span className="icon">
                <img src="/imgs/icon.png" width={"30px"} style={{position: "relative", top: "7px"}}/> Realsimus
              </span>
          </div>
          <div className="Hero-nav log-nav">
            <div><h1>Login</h1></div>
            <div>
              <button className="Hero-registartion" onClick={() => navigate("/registration")}>Registration</button>
              <button className="Hero-login" onClick={() => navigate("/forgot")}>Forgot Password</button>
            </div>
          </div>
        </div>
      </header>
      <div className="Login-main">
        <div className="login-container">
          <h2 className="login-title">Enter your data</h2>
          <form onSubmit={handleSubmit}>
            <div className="login-input-group">
              <label>Username *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="login-input-group">
              <label>Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="login-button active">Login!</button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default Login;
