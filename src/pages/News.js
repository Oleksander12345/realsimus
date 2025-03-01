import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function News() {
    const navigate = useNavigate();
    const [news, setNews] = useState([]);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchNews();
    }, []);

    async function fetchNews() {
        try {
            const response = await fetch("http://localhost/api/news", {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const data = await response.json();
            setNews(data);
        } catch (error) {
            console.error("❌ Error fetching news:", error.message);
            setError("Failed to load news. Please try again later.");
        }
    }

    return (
        <main className="News">
            {/* Header */}
            <header className="Hero-header News-header">
                <div className="Hero-header-container">
                    <div className="Hero-logo">
                        <span className="icon">
                            <img src="/imgs/icon.png" width={"30px"} style={{ position: "relative", top: "7px" }} /> Realsimus
                        </span>
                    </div>
                    <div className="Hero-nav log-nav">
                        <div><h1>News</h1></div>
                        <div>
                            <button className="Hero-registartion" onClick={() => navigate("/cryptocurency")}>
                                Cryptocurrency top-up
                            </button>
                            <button className="Hero-login" onClick={() => navigate("/profile")}>
                                Profile
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="news-container">
                <div className="news-header">
                    <h1 className="">Choose <span className="ml-2">➡️</span></h1>
                    <div className="news-buttons">
                        <button onClick={() => navigate("/long")}>Go to long-term rent</button>
                        <button onClick={() => navigate("/short")}>Go to short-term rent</button>
                    </div>
                </div>

                <div className="news-header">
                    <span>📬</span> News on the site <span>📬</span>
                </div>

                {error && <p className="error-message">{error}</p>}

                <div className="news-table">
                    <div className="news-table-header">
                        <div className="news-row">Date</div>
                        <div className="news-row">News</div>
                    </div>

                    {news.length > 0 ? (
                        news.map((item) => (
                            <div key={item.id} className="news-row">
                                <div className="news-date">{new Date(item.date).toLocaleDateString()}</div>
                                <div className="news-content">{item.newsMessage}</div>
                            </div>
                        ))
                    ) : (
                        <div className="news-row">No news available.</div>
                    )}
                </div>
            </div>
        </main>
    );
}

export default News;
