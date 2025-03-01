import React from "react";
import { FaRegPaperPlane } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Hero() {
  const navigate = useNavigate();
  return (
    <div>
        <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white">
          {/* Header */}
          <header className="Hero-header">
            <div className="Hero-header-container">
              <div className="Hero-logo">
                <span className="icon">
                  <img src="/imgs/icon.png" width={"30px"} style={{position: "relative", top: "7px"}}/> Realsimus
                </span>
              </div>
              <div className="Hero-nav">
                <button className="Hero-registartion" onClick={() => navigate("/registration")}>
                  Registration
                </button>
                <button className="Hero-login" onClick={() => navigate("/login")}>
                  Login
                </button>
              </div>
            </div>
          </header>

          {/* Main Section */}
          <main>
            <div className="Hero-main">
              <div className="Hero-main-left">
                <div className="Hero-main-box">
                  Receive SMS online US Mobile number
                  Short-term rentals
                  Long-term rentals
                </div>

                <p className="Hero-description">
                  From Facebook, Telegram, WhatsApp, Viber, WeChat, OpenAI, Uber, Amazon, Instagram, Mamba and other services
                </p>
                <div className="Hero-buy-container">
                  <button className="Hero-buy-button" onClick={() => navigate("/login")}>
                    <span>Buy a number now</span> <span>💬</span>
                  </button>
                </div>
                
              </div>

              
              <div className="Hero-main-right">
                <div>
                    <svg width="500" height="800" xmlns="http://www.w3.org/2000/svg" className="hero-svg">
                          <path d="M 175 50 
                              C 80 150, 100 175, 150 275
                              S 200 450, 50 575"
                              stroke="#5f5fff" 
                              fill="none" 
                              strokeWidth="4" 
                              strokeDasharray="1000" 
                              strokeDashoffset="1000" />
                    </svg>
                  <div className="paperPlane"
                    
                  >
                    <FaRegPaperPlane style={{ color: "#2563eb", width: "24px", height: "24px" }} />
                  </div>
                </div>
                
                <div style={{left: "17%", top: "10%"}}><img src="/imgs/hero1.jpg" alt="Hero" height="175px"/></div>
                <div style={{right: "17%"}}><img src="/imgs/hero2.jpg" alt="Hero" height="175px"/></div>
                <div style={{left: "17%"}}><img src="/imgs/hero3.jpg" alt="Hero" height="175px"/></div>
              
              </div>
            </div>
            
          </main>
        </div>
    </div>
    
  );
};

export default Hero;
