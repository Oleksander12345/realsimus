import React from "react";
import { FaRegPaperPlane } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Hero() {
  const navigate = useNavigate();
  return (
    <main>
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
                <button className="Hero-registartion" onClick={() => navigate("/registartion")}>
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
                  <svg
                    className="Hero-line"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 800 400"
                    fill="none"
                  >
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="0"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon points="0 0, 10 3.5, 0 7" fill="blue" />
                      </marker>
                    </defs>
                    <path
                      d="M 50,400 
                        C 300,100 600,100 750,300"
                      stroke="blue"
                      strokeWidth="2"
                      fill="none"
                      marker-end="url(#arrowhead)" 
                    />
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
    </main>
    
  );
};

export default Hero;
