import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Cryptocurency() {
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("Loading...");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!token) {
      setMessage("❌ Authorization token not found. Redirecting to login...");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("http://localhost/api/auth/profile", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("❌ Failed to fetch profile.");

      const data = await response.json();
      setBalance(data.balance ? `$${data.balance.toFixed(2)}` : "$0.00");
      setEmail(data.email);
    } catch (error) {
      console.error("❌ Error fetching profile:", error.message);
      setBalance("N/A");
    }
  };

  const createPayment = async () => {
    if (!email) {
      setMessage("❌ Email not found. Please log in.");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0 || isNaN(parsedAmount)) {
      setMessage("❌ Please enter a valid amount.");
      return;
    }

    try {
      console.log("📌 Creating payment request...");
      const response = await fetch("http://localhost/api/cryptocloud/payments/create", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: `order-${Date.now()}`,
          amount: parsedAmount,
          currency: "USD",
          cryptocurrency: "BTC",
          email: email,
        }),
      });

      if (!response.ok) throw new Error("❌ Failed to create payment.");

      const data = await response.json();
      console.log("✅ Payment created:", data);

      if (data.paymentUrl) {
        setPaymentUrl(data.paymentUrl);
        setMessage("✅ Payment link created successfully!");
      } else {
        throw new Error("❌ Payment URL not found in response.");
      }
    } catch (error) {
      console.error("❌ Error creating payment:", error.message);
      setMessage(error.message);
    }
  };

  return (
    <div className="crypto-container">
      {/* Header */}
      <header className="crypto-header">
        <div className="crypto-logo">
          <span className="icon">
            <img src="/imgs/icon.png" width={"30px"} style={{ position: "relative", top: "7px" }} /> Realsimus
          </span>
        </div>
        <h1 className="crypto-title">Replenishment</h1>
        <div className="crypto-balance-section">
          <span className="crypto-balance">
            Balance: <span className="crypto-balance-amount">{balance}</span>
          </span>
          <button className="crypto-profile-button" onClick={() => navigate("/profile")}>
            Profile
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="crypto-content">
        <h2 className="crypto-subtitle">Specify the amount of replenishment</h2>
        {message && <p className="crypto-message">{message}</p>}
        <div>
          <div className="crypto-icon-section">
            <div className="crypto-icon-card">
              <img src="/imgs/crypto1.jpg" alt="Payment Icon" className="icon-image" height={"150px"} />
            </div>
            <div className="crypto-input-field-container">
              <input
                type="number"
                placeholder="Enter the amount in $"
                className="crypto-input-field"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <button className="crypto-payment-button" onClick={createPayment}>
                Create a payment!
              </button>
              {paymentUrl && (
                <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="crypto-payment-link">
                  Proceed to Payment
                </a>
              )}
            </div>
            <div className="crypto-icon-card">
              <img src="/imgs/crypto2.jpg" alt="Security Icon" className="icon-image" height={"150px"} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Cryptocurency;
