import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function UpdatePassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const resetToken = queryParams.get("token"); // Отримуємо токен зі строки запиту

    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState(""); // success або error

    // ✅ **Функція обробки оновлення пароля**
    const handlePasswordReset = async (e) => {
        e.preventDefault();

        if (!email.trim() || !newPassword.trim() || !confirmPassword.trim()) {
            showMessage("All fields are required!", "error");
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage("Passwords do not match!", "error");
            return;
        }

        try {
            const response = await fetch("http://localhost/api/auth/password-update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, newPassword, token: resetToken }),
            });

            if (!response.ok) throw new Error("Failed to update password.");

            const data = await response.json();
            showMessage("✅ Password updated successfully!", "success");

            // ✅ Перенаправлення на логін через 5 секунд
            setTimeout(() => navigate("/login"), 5000);
        } catch (error) {
            console.error("❌ Error updating password:", error);
            showMessage(error.message || "An unexpected error occurred.", "error");
        }
    };

    // ✅ **Функція показу повідомлень**
    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(""), 5000); // Ховаємо через 5 сек
    };

    return (
        <main className="UpdatePassword" style={{background: "#d3ecff", height: "100vh"}}>
            {/* Header */}
            <header className="Hero-header">
                <div className="header-container">
                    <h1>🔐 Update Password</h1>
                </div>
            </header>

            <div className="update-main">
                <div className="update-container">
                    <h2 className="update-title">Enter new password</h2>

                    {/* ✅ Повідомлення про успіх або помилку */}
                    {message && (
                        <p className={`message ${messageType === "success" ? "success" : "error"}`}>
                            {message}
                        </p>
                    )}

                    <form onSubmit={handlePasswordReset}>
                        <div className="input-group">
                            <label>Email *</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>New Password *</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Repeat New Password *</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="reset-button">
                            🔄 Change Password
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}

export default UpdatePassword;
