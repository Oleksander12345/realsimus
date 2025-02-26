import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token"); // Отримуємо токен
      if (!token) return; // Якщо токена немає, виходимо

      const response = await fetch("http://localhost/api/auth/profile", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Отримані дані користувача:", data); // Додаткове логування
        localStorage.setItem("email", data.email);
        localStorage.setItem("email", data.username); // Зберігаємо email у localStorage
      } else {
        console.error("Не вдалося отримати email, статус:", response.status);
      }
    } catch (error) {
      console.error("Помилка при отриманні профілю:", error);
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
            console.log("📌 Отриманий токен:", data.token);  // Додаємо логування

            localStorage.setItem("token", data.token);
            
            // Декодуємо JWT-токен
            const decodedToken = JSON.parse(atob(data.token.split(".")[1]));
            console.log("📌 Декодований токен:", decodedToken);  // Виводимо у консоль

            // Зберігаємо ім'я користувача
            localStorage.setItem("username", decodedToken.sub);

            // Перевіряємо, чи є `roles`
            if (decodedToken.roles) {
                localStorage.setItem("role", JSON.stringify(decodedToken.roles));
                console.log("📌 Збережені ролі:", decodedToken.roles);
            } else {
                console.error("❌ Роль не знайдено в токені!");
            }

            await fetchUserProfile();  // Чекаємо завершення запиту профілю

            setTimeout(() => {
                navigate("/news");  // Переходимо після збереження всіх даних
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
