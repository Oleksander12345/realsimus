import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function CreateNews() {
    const navigate = useNavigate();
    const [news, setNews] = useState([]);
    const [newsMessage, setNewsMessage] = useState("");
    const [newsId, setNewsId] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [role, setRole] = useState(null);
    const maxCharacters = 630;

    const token = localStorage.getItem("token");
    

    useEffect(() => {
        if (!token) {
            console.error("❌ Token is missing. Redirecting to login...");
            navigate("/login");
            return;
        }

        const userRole = extractRoleFromToken(token);
        console.log("✅ User role extracted:", userRole);
        setRole(userRole);

        if (userRole === "ADMIN") {
            fetchNews();
        } else {
            console.error("❌ Access denied. Redirecting to unauthorized page.");
            navigate("/unauthorized");
        }
    }, []);

    // ✅ **Функція розшифровки ролі**
    const extractRoleFromToken = (token) => {
        try {
            const payloadBase64 = token.split(".")[1];
            const decodedPayload = JSON.parse(atob(payloadBase64));
            return decodedPayload.roles && decodedPayload.roles.includes("ADMIN") ? "ADMIN" : "USER";
        } catch (error) {
            console.error("❌ Error decoding token:", error);
            return null;
        }
    };

    // ✅ **Функція отримання списку новин**
    async function fetchNews() {
        try {
            const response = await fetch("http://localhost/api/news", {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });
    
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    
            const text = await response.text();
            if (!text) {
                console.warn("⚠️ Empty response received from server");
                return;
            }
    
            const data = JSON.parse(text);
            console.log("✅ News fetched successfully:", data);
            setNews(data);  // ✅ Оновлюємо стан новин
        } catch (error) {
            console.error("❌ Error fetching news:", error.message);
        }
    }
    
    
    

    // ✅ **Функція створення новини**
    const createNews = async () => {
        if (!newsMessage.trim()) {
            setError("❌ Please enter a news message.");
            clearMessage();
            return;
        }
        if (newsMessage.length > maxCharacters) {
            setError(`❌ Text is too long. Maximum ${maxCharacters} characters allowed.`);
            clearMessage();
            return;
        }
    
        try {
            const response = await fetch("http://localhost/api/news", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ newsMessage }),
            });
    
            if (!response.ok) throw new Error("❌ Failed to create news.");
    
            setSuccess("✅ News created successfully!");
            setNewsMessage("");
    
            await fetchNews();  // ✅ Оновлюємо список новин після створення
        } catch (err) {
            setError(err.message);
        }
    };

    // ✅ **Функція видалення новини**
    const deleteNews = async () => {
        if (!newsId || isNaN(Number(newsId))) {
            setError("❌ Please enter a valid numeric ID.");
            clearMessage();
            return;
        }

        try {
            const response = await fetch(`http://localhost/api/news/${newsId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("❌ Failed to delete news.");

            setSuccess("✅ News deleted successfully!");
            clearMessage();
            setNewsId("");
            fetchNews(); // Оновлюємо список новин
        } catch (err) {
            setError(err.message);
        }
    };
    const clearMessage = () => {
        setTimeout(() => {
            setError("");
            setSuccess("");
        }, 5000);  // 5 секунд
    };
    

    return (
        <div>
            <header className="create-news-header">
                <span className="icon">
                    <img src="/imgs/icon.png" width={"30px"} style={{position: "relative", top: "7px"}}/> Realsimus
                </span>
                <h1>News Management</h1>
                <button className="create-news-home-button" onClick={() => navigate("/news")}>
                    🏠 Home
                </button>
            </header>
            <div className="create-news-container">
                

                <main className="create-news-main">
                    {error && <p className="error-message">{error}</p>}
                    {success && <p className="success-message">{success}</p>}
                    <section className="news-controller">
                        {/* Форма створення новини */}
                        <div className="create-news-create-section">
                            <h2>Create a News Post</h2>
                            <textarea
                                className="add-news"
                                placeholder="Enter your news message..."
                                value={newsMessage}
                                onChange={(e) => setNewsMessage(e.target.value)}
                                maxLength={maxCharacters}
                            />
                            <p style={{textAlign: "centre"}} >{maxCharacters - newsMessage.length} characters left</p>
                            <button className="create-news-create-button" onClick={createNews}>📢 Publish</button>
                        </div>

                        {/* Форма видалення новини */}
                        <div className="create-news-delete-section">
                            <h2>Delete News</h2>
                            <input
                                type="text"
                                placeholder="Enter News ID"
                                value={newsId}
                                onChange={(e) => setNewsId(e.target.value)}
                            />
                            <button className="create-news-delete-button" onClick={deleteNews}>🗑 Delete</button>
                        </div>
                    </section>
                    
                    {/* Список новин */}
                    <section className="create-news-list">
                        <h2>News List</h2>
                            <div className="create-news-table-wrapper">
                                <table className="create-news-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Date</th>
                                            <th>News Message</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {news.map((item) => (
                                            <tr key={item.id}>
                                                <td>{item.id}</td>
                                                <td>{new Date(item.date).toLocaleDateString()}</td>
                                                <td>{item.newsMessage}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                    </section>
                </main>
            </div>
        </div>
        
    );
}

export default CreateNews;
