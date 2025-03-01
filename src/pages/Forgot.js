import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Forgot() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const navigate = useNavigate();


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim()) {
            showMessage("Please enter a valid email address.", "error");
            return;
        }

        try {
            const response = await fetch("http://localhost/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) throw new Error("Failed to send reset password request.");
            NavigateToLogin();
            const data = await response.json();
            if (data.success) {
                showMessage(`A password reset link has been sent to ${email}.`, "success");
                    
                setTimeout(() => {
                    navigate("/login");
                }, 5000);
            } else {
                showMessage(data.message || "An error occurred.", "error");
            }
        } catch (error) {
            console.error("❌ Error during password reset:", error);
            showMessage(error.message || "An unexpected error occurred.", "error");
        }
    };

    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(""), 3500);
    };
    const NavigateToLogin = () => {
        setTimeout(navigate("/login"), 10000)
    }

    return (
        <main className="Forgot">
            {/* Header */}
            <header className="Hero-header">
                <div className="reg-header-container">
                    <h1>Forgot Password</h1>
                </div>
            </header>

            <div className="Registration-main">
                <div className="registration-container">
                    <h2 className="registration-title">Enter your data</h2>

                    {message && (
                        <p className={`message ${messageType === "success" ? "success" : "error"}`}>
                            {message}
                        </p>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="registration-input-group">
                            <label>Email *</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="registration-submit-button">
                            <span className="mr-2">✈️</span> Send
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}

export default Forgot;
