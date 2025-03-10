import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Registration() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const API_URL = process.env.REACT_APP_API_URL;
        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, email, password }),
            });
            if (response.ok) {
                navigate("/login");
            } else {
                const data = await response.json();
                setError(data.message || "Registration failed");
            }
        } catch (error) {
            setError("Server error. Please try again later.");
        }
    };

    return (
        <main className="Registration">
            {/* Header */}
            <header className="Hero-header">
                <div className="reg-header-container">
                    <h1>Registration</h1>
                </div>
            </header>
            <div className="Registration-main">
                <div className="registration-container">
                    <h2 className="registration-title">Enter your data</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="registration-input-group">
                            <label>Username *</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="registration-input-group">
                            <label>Email *</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="registration-input-group">
                            <label>Password *</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>
                        {error && <p className="error-message">{error}</p>}
                        <button type="submit" className="registration-submit-button">
                            <span className="mr-2">✈️</span> Send
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}

export default Registration;
