import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [balance, setBalance] = useState("Loading...");
  const [transactions, setTransactions] = useState([]);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [recipientUsername, setRecipientUsername] = useState("");
  const [transferPhoneNumber, setTransferPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [roles, setRole] = useState(null);

  const token = localStorage.getItem("token");
  useEffect(() => {
    fetchUserProfile();
    fetchUserPhoneNumbers();
    fetchUserTransactions();
    

    if (username) setUsername(username);
    if (email) setEmail(email);

    if (token) {
      const userRole = extractRoleFromToken(token);
      console.log("✅ User role extracted:", userRole);
      setRole(userRole);
    }
  }, []);

  const extractRoleFromToken = (token) => {
      try {
          const payloadBase64 = token.split(".")[1]; // Отримуємо payload (Base64)
          const decodedPayload = JSON.parse(atob(payloadBase64)); // Декодуємо Base64
          console.log("🔍 Decoded payload:", decodedPayload);

          // Перевіряємо, чи є масив `roles` і чи містить він "ADMIN"
          return decodedPayload.roles && decodedPayload.roles.includes("ADMIN") ? "ADMIN" : "USER";
      } catch (error) {
          console.error("❌ Error decoding token:", error);
          return null;
      }
  };



  // ✅ **Функція отримання профілю користувача**
  const fetchUserProfile = async () => {
    try {
      const response = await fetch("http://localhost/api/auth/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("❌ Failed to fetch profile.");
      }

      const data = await response.json();
      console.log("📌 Отримані дані профілю:", data);
      setUsername(data.username);
      setEmail(data.email);
      setBalance(data.balance ? `$${data.balance.toFixed(2)}` : "$0.00");
    } catch (error) {
      console.error("❌ Помилка отримання профілю:", error.message);
      setBalance("N/A");
    }
  };

  // ✅ **Функція отримання телефонних номерів користувача**
  const fetchUserPhoneNumbers = async () => {
    try {
      const response = await fetch("http://localhost/api/auth/my-phone-numbers", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("❌ Failed to fetch phone numbers.");
      }

      const data = await response.json();
      console.log("📌 Отримані номери:", data);
      setPhoneNumbers(data);
    } catch (error) {
      console.error("❌ Помилка отримання номерів:", error.message);
    }
  };

  // ✅ **Функція отримання транзакцій**
  const fetchUserTransactions = async () => {
    try {
      const response = await fetch(
        `http://localhost/api/cryptocloud/payments/user-transactions`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("❌ Failed to fetch transactions.");
      }

      const data = await response.json();
      console.log("📌 Отримані транзакції:", data);
      setTransactions(data);
    } catch (error) {
      console.error("❌ Помилка отримання транзакцій:", error.message);
    }
  };

  // ✅ **Функція передачі номера іншому користувачеві**
  const transferPhoneNumberToUser = async () => {
    if (!recipientUsername || !transferPhoneNumber) {
      setMessage("❌ Введіть всі дані для передачі номера.");
      return;
    }

    try {
      console.log("📌 Надсилаємо запит на передачу номера...");
      const response = await fetch("http://localhost/admin/transfer-number", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipientUsername, phoneNumber: transferPhoneNumber }),
      });

      if (!response.ok) {
        throw new Error("❌ Не вдалося передати номер.");
      }

      const data = await response.json();
      console.log("✅ Номер передано успішно:", data);
      setMessage(`✅ Номер ${transferPhoneNumber} передано користувачу ${recipientUsername}.`);

      fetchUserPhoneNumbers(); // Оновлюємо список номерів після передачі
    } catch (error) {
      console.error("❌ Помилка передачі номера:", error.message);
      setMessage(error.message);
    }
  };

  
  

  return (
    <div className="profile-main">
      {/* Header */}
      <header className="profile-header">
        <div className="profile-logo">📱 Realsimus</div>
        <h1 className="profile-title">Profile</h1>

        {/* Кнопка адміністратора (з'являється тільки для ADMIN) */}
        {roles === "ADMIN" ? (
          <button className="profile-admin-button" onClick={() => navigate("/admin")}>
            ⭐ Admin Panel
          </button>
        ) : (
          <p className="profile-no-access">You are not an admin</p>
        )}

        <button className="profile-home-button" onClick={() => navigate("/news")}>
          🏠 Home
        </button>
      </header>

      {/* Main Section */}
      <main className="profile-container">
        <div className="profile-contain">
          <div className="profile-balance-section">
            <h2 className="profile-balance">Balance: <span>{balance}</span></h2>
            <button className="profile-crypto-topup-button" onClick={() => navigate("/cryptocurency")}>Cryptocurrency top-up</button>
            <div className="profile-balance-image">
              <img src="/imgs/profile.jpg" alt="Crypto Top Up" />
            </div>
          </div>

          <div className="profile-user-data">
            <h2>User data</h2>
            <label>Username</label>
            <input type="text" value={username} readOnly />
            <label>Email address</label>
            <input type="email" value={email} readOnly />
            <button className="profile-change-password-button" onClick={() => navigate("/changepassword")}>Change password</button>
          </div>

          <div className="profile-number-transfer">
            <h2>Number transfer</h2>
            <label>Select the number you want to transmit</label>
            <select  className="profile-select" onChange={(e) => setTransferPhoneNumber(e.target.value)}>
              <option value="">Select a number</option>
              {phoneNumbers.map((num, index) => (
                <option key={index} value={num.phoneNumber}>
                  {num.phoneNumber}
                </option>
              ))}
            </select>
            <br/>
            <label>Enter the username to which you want to transfer the number</label>
            <input type="text" value={recipientUsername} onChange={(e) => setRecipientUsername(e.target.value)} />
            <button className="profile-transfer-number-button" onClick={transferPhoneNumberToUser}>
              Pass the number!
            </button>
            {message && <p className="profile-message">{message}</p>}
          </div>
        </div>

        {/* Transactions and Numbers */}
        <div className="profile-info-sections">
      {/* Transactions Table */}
      <div className="profile-transactions">
        <h2 className="profile-section-title">Transaction Information</h2>
        <div className="profile-table-wrapper" style={{width: "100%"}}>
          <table className="profile-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((transaction, index) => (
                  <tr key={index}>
                    <td>{transaction.transactionId}</td>
                    <td>${transaction.amount.toFixed(2)}</td>
                    <td>{transaction.status}</td>
                    <td>{new Date(transaction.date).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phone Numbers Table */}
      <div className="profile-phone-info">
          <h2 className="profile-section-title">Phone Number Information</h2>
          <div className="profile-table-wrapper">
            <table className="profile-table" style={{width: "100%"}}>
              <thead>
                <tr>
                  <th>Phone Number</th>
                  <th>Service Name</th>
                </tr>
              </thead>
              <tbody>
                {phoneNumbers.length > 0 ? (
                  phoneNumbers.map((phone, index) => (
                    <tr key={index}>
                      <td>{phone.phoneNumber}</td>
                      <td>{phone.serviceName}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="profile-no-data">No phone numbers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      </main>
      
    </div>
  );
};

export default Profile;
