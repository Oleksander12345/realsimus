import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function ChangePassword() {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    console.log("🔹 Token:", localStorage.getItem("token"));
    const handlePasswordChange = async (e) => {
      e.preventDefault();
  
      if (!token) {
          setMessage("❌ Authorization error. Please log in again.");
          return;
      }
  
      if (newPassword === oldPassword) {
          setMessage("❌ New password must be different from the old password.");
          return;
      }
      if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword)) {
          setMessage("❌ Password must contain at least one uppercase letter and one number.");
          return;
      }
      if (newPassword !== confirmPassword) {
          setMessage("❌ New passwords do not match.");
          return;
      }
  
      try {
          console.log("📌 Sending password change request...");
  
          const response = await fetch("http://localhost/api/auth/profile/change-password", {
              method: "PATCH",
              headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({ oldPassword, newPassword }),
          });
  
          const responseText = await response.text(); 
          console.log("📩 Server Response:", responseText || "[EMPTY RESPONSE]");
  
          if (!response.ok) {
              throw new Error(`❌ Server error: ${response.status}`);
          }
  
          let data;
          try {
              data = responseText ? JSON.parse(responseText) : {};
          } catch (jsonError) {
              console.warn("⚠️ Cannot parse JSON. Server returned non-JSON response.");
              data = {}; 
          }
  
          setMessage(data.message || "✅ Password updated successfully!");
          setTimeout(() => navigate("/profile"), 2000);
      } catch (error) {
          console.error("❌ Error changing password:", error.message);
          setMessage(error.message || "❌ Internal server error occurred.");
      }
    };
  

    return (
        <main className="change-password-page">
            {/* Header */}
            <header className="Hero-header">
                <div className="Hero-header-container">
                    <div className="Hero-logo">
                        <span className="text-2xl font-bold text-black">📱 Realsimus</span>
                    </div>
                    <h1 className="password-title">🔐 Change Password</h1>
                </div>
            </header>

            {/* Main Section */}
            <div className="change-password-container">
                <h2 className="change-password-heading">Enter new password</h2>
                <form onSubmit={handlePasswordChange} className="change-password-form">
                    <div className="input-group">
                        <label>Old Password *</label>
                        <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
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
                            minLength={8}
                        />
                    </div>
                    <div className="input-group">
                        <label>Repeat New Password *</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                    </div>
                    {message && <p className="message">{message}</p>}
                    <button type="submit" className="change-password-button">🔄 Change Password</button>
                </form>
            </div>
        </main>
    );
}

export default ChangePassword;
