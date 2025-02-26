import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowRightLong } from "react-icons/fa6";
import { IoPaperPlaneOutline } from "react-icons/io5";

function AdminPanel() {
    const navigate = useNavigate();
    const [role, setRole] = useState("");
    const [markup, setMarkup] = useState("");
    const [users, setUsers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [deleteUsername, setDeleteUsername] = useState("");
    const [balanceUsername, setBalanceUsername] = useState("");
    const [newBalance, setNewBalance] = useState("");
    const [donorUsername, setDonorUsername] = useState("");
    const [recipientUsername, setRecipientUsername] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        if (decodedToken.roles.includes("ADMIN")) {
            setRole("ADMIN");
            fetchAllUsers();
            fetchAllTransactions();
            fetchMarkup();
        } else {
            navigate("/registration");
        }
    }, []);

    const fetchAllUsers = async () => {
        try {
            if (!token) {
                console.error("❌ Token is missing. Fetch aborted.");
                return;
            }
    
            console.log("🔍 Fetching users with token:", token);
    
            const response = await fetch("http://localhost/admin/users-with-numbers", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
    
            console.log("🔄 Response status:", response.status);
    
            if (response.status === 204) {
                console.warn("⚠ No content received.");
                setUsers([]);
                return;
            }
    
            if (!response.ok) {
                const errorData = await response.text(); // Читаємо відповідь у вигляді тексту
                throw new Error(`Failed to fetch users: ${errorData}`);
            }
    
            const data = await response.json();
            console.log("✅ Users fetched successfully:", data);
            setUsers(data);
        } catch (err) {
            console.error("❌ Error fetching users:", err.message);
            setError(err.message);
        }
    };
    

    const fetchAllTransactions = async () => {
        try {
            const response = await fetch("http://localhost/admin/all-transactions", {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("Failed to fetch transactions");

            const data = await response.json();
            setTransactions(data.filter((txn) => txn.status !== "created"));
        } catch (err) {
            setError(err.message);
        }
    };

    const fetchMarkup = async () => {
        try {
            console.log("🔍 Fetching markup...");
    
            const response = await fetch("http://localhost/admin/markup", {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });
    
            if (!response.ok) throw new Error(`Failed to fetch markup: ${response.status}`);
    
            const data = await response.json(); // Отримуємо JSON
    
            console.log("📩 Raw Markup Response:", data);
    
            const parsedMarkup = parseFloat(data);
            if (isNaN(parsedMarkup)) {
                throw new Error("⚠️ Markup field is missing or invalid in response.");
            }
    
            console.log("✅ Parsed Markup Data:", parsedMarkup);
            setMarkup(parsedMarkup.toString()); // Оновлюємо стан
            localStorage.setItem("markup", parsedMarkup); // Зберігаємо в localStorage
        } catch (err) {
            console.error("❌ Error fetching markup:", err.message);
            setError(err.message);
        }
    };
    
    
    
    const updateMarkup = async () => {
        try {
            const parsedMarkup = parseFloat(markup);

            if (isNaN(parsedMarkup)) {
                throw new Error("⚠️ Invalid markup value. Please enter a valid number.");
            }

            console.log("🚀 Sending Markup Update Request:", JSON.stringify({ markup: parsedMarkup }));

            const response = await fetch("http://localhost/admin/markup", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ markup: parsedMarkup }), // Коректне тіло
            });

            const text = await response.text(); // Читаємо відповідь у вигляді тексту
            console.log("📩 Raw Update Response:", text);
            
            if (!response.ok) {
                throw new Error(`Failed to update markup: ${text}`);
            }

            console.log("✅ Markup successfully updated on server!");

            setSuccess("✅ Markup updated successfully!");
            fetchMarkup(); // Оновлення після змін

        } catch (err) {
            console.error("❌ Error updating markup:", err.message);
            setError(err.message);
        }
    };



    const deleteUser = async () => {
        try {
            const response = await fetch(`http://localhost/admin/delete-user?username=${deleteUsername}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("Failed to delete user");

            setSuccess("User deleted successfully!");
            fetchAllUsers();
        } catch (err) {
            setError(err.message);
        }
    };

    const updateUserBalance = async () => {
        try {
            const response = await fetch("http://localhost/admin/update-balance", {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username: balanceUsername, newBalance: parseFloat(newBalance) }),
            });

            if (!response.ok) throw new Error("Failed to update balance");

            setSuccess("Balance updated successfully!");
            fetchAllUsers();
        } catch (err) {
            setError(err.message);
        }
    };

    const transferPhoneNumber = async () => {
        try {
            const response = await fetch("http://localhost/admin/transfer-number-by-usernames", {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ donorUsername, recipientUsername, phoneNumber }),
            });

            if (!response.ok) throw new Error("Failed to transfer phone number");
            displayMessage(error);
            setSuccess("Phone number transferred successfully!");
            displayMessage(setSuccess);
            fetchAllUsers();
        } catch (err) {
            setError(err.message);
        }
    };
    const displayMessage = (type, message) => {
        if (type === "success") {
            setSuccess(message);
        } else {
            setError(message);
        }
    
        // Автоматично очищаємо повідомлення через 5 секунд
        setTimeout(() => {
            setSuccess("");
            setError("");
        }, 5000);
    };

    return (
        <div className="admin-panel">
            <header className="admin-header">
                <span className="icon">
                    <img src="/imgs/icon.png" width={"30px"} style={{position: "relative", top: "7px"}}/> Realsimus
                </span>
                <h1>Admin Panel</h1>
                <div>
                    <button onClick={() => navigate("/news")}>🏠 Home</button>
                    <button onClick={() => navigate("/profile")}>👤 Profile</button>
                </div>
            </header>

            <main className="admin-container">
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                <section className="admin-section">
                    <div>
                        <div className="admin-delete-section" width={"20%"}>
                            <h2>Deleting a user</h2>
                            <input type="text" placeholder="Username" value={deleteUsername} onChange={(e) => setDeleteUsername(e.target.value)} />
                            <button onClick={deleteUser}>🗑 Delete</button>
                        </div>

                        <div width={"38%"} className="admin-balance">
                            <h2>Changing the balance</h2>
                            <div style={{display: "flex"}}>
                                <input type="text" placeholder="Username" value={balanceUsername} onChange={(e) => setBalanceUsername(e.target.value)} />
                                <FaArrowRightLong size={"50px"} className="balance-arrow"/>
                                <input type="text" placeholder="New balance" value={newBalance} onChange={(e) => setNewBalance(e.target.value)} />
                            </div> 
                            <button onClick={updateUserBalance}>💰 Change balance</button>
                        </div>

                        <div width={"38%"} className="admin-trans">
                            <h2>Number transfer</h2>
                            <div style={{display: "flex", flexDirection: "column"}} className= "admin-transfer">
                                <div style={{display: "flex"}}>
                                    <input type="text" placeholder="Donor's username" value={donorUsername} onChange={(e) => setDonorUsername(e.target.value)} />
                                    <FaArrowRightLong size={"35px"} className="balance-arrow"/>
                                    <input type="text" placeholder="Recipient's username" value={recipientUsername} onChange={(e) => setRecipientUsername(e.target.value)} />
                                </div>
                                <div style={{display: "flex"}} className="admin-number">
                                    <h3>Choose a number:</h3>
                                    <input type="text" placeholder="Phone number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                                </div>
                            </div>
                            
                            
                            
                            <button onClick={transferPhoneNumber}>📞 Transfer</button>
                        </div>
                    </div>
                    
                    
                </section>

                <section className="admin-transactions">
                    <div width={"48%"}>
                        <div className="markup">
                            <h2>Markup %</h2>
                            <input type="text" value={markup} onChange={(e) => setMarkup(e.target.value)} />
                            <button onClick={updateMarkup}>⚙ Apply</button>
                        </div>
                        <div className="admin-use-information">
                            <div className="admin-users-table-wrapper">
                                <table className="admin-users-table">
                                    <thead>
                                        <tr>
                                            <th>Username</th>
                                            <th>Email</th>
                                            <th>Balance</th>
                                            <th>Phone Numbers</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.length > 0 ? (
                                            users.map((user, index) => (
                                                <tr key={index}>
                                                    <td>{user.username}</td>
                                                    <td>{user.email}</td>
                                                    <td>${user.balance.toFixed(2)}</td>
                                                    <td>
                                                        {user.phoneNumbers.length > 0 ? (
                                                            user.phoneNumbers.map((num, idx) => (
                                                                <div key={idx}>{num.phoneNumber}</div>
                                                            ))
                                                        ) : (
                                                            <span>No numbers</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="no-data">No users found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div width={"50%"}>
                        <div className="admin-news">
                            <button onClick={() => navigate("/createnews")}><IoPaperPlaneOutline />News</button>
                        </div>
                        <h2>Transaction information</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Transaction ID</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>User</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((txn, index) => (
                                    <tr key={index}>
                                        <td>{txn.transactionId}</td>
                                        <td>${txn.amount.toFixed(2)}</td>
                                        <td>{txn.status}</td>
                                        <td>{new Date(txn.date).toLocaleString()}</td>
                                        <td>{txn.user}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                </section>
            </main>
        </div>
    );
}

export default AdminPanel;
