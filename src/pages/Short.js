import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Short() {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]); 
    const [searchQuery, setSearchQuery] = useState(""); 
    const [tempSearchQuery, setTempSearchQuery] = useState("");
    const [phoneNumbers, setPhoneNumbers] = useState([]); 
    const [selectedNumber, setSelectedNumber] = useState(""); 
    const [selectedService, setSelectedService] = useState("");
    const [selectedPrice, setSelectedPrice] = useState(""); 
    const [purchaseStatus, setPurchaseStatus] = useState("");
    const [balance, setBalance] = useState(null);
    const token = localStorage.getItem("token"); 
    let expireTimer = null;
    const [showNumbers, setShowNumbers] = useState(false); 
    const [markup, setMarkup] = useState(0);
    
        
        const handleViewNumbers = () => {
            setShowNumbers(true); 
            fetchShortTermMdnData(); 
            fetchMarkup();
        };

        const fetchMarkup = async () => {
            try {
                console.log("🔍 Fetching markup...");
                const response = await fetch("http://localhost/admin/markup", {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                });
    
                if (!response.ok) throw new Error(`Failed to fetch markup: ${response.status}`);
    
                const data = await response.json();
                console.log("📩 Markup Response:", data);
    
                if (typeof data.markup !== "number") {
                    throw new Error("⚠️ Markup field is missing or invalid.");
                }
    
                setMarkup(data.markup);
                localStorage.setItem("markup", data.markup);
            } catch (err) {
                console.error("❌ Error fetching markup:", err.message);
                setMarkup(parseFloat(localStorage.getItem("markup")) || 0);
            }
        };
    
    const expirePhoneNumber = async (phoneNumber) => {
        const token = localStorage.getItem("token");

        console.log("📌 We delete the number after 15 minutes of inactivity:", phoneNumber);

        if (!token) {
            console.error("❌ The token is missing, the number cannot be deleted.");
            return;
        }

        try {
            const response = await fetch(`http://localhost/api/phone-numbers/short-term-expire/${phoneNumber}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            console.log("📌 Server response (number deletion):", data);

            if (!response.ok) {
                throw new Error(data.message || `❌ I could not see the number (code ${response.status})`);
            }

            setPhoneNumbers((prevNumbers) => prevNumbers.filter((num) => num.phoneNumber !== phoneNumber));

        } catch (error) {
            console.error("❌ Number deletion error:", error.message);
        }
    };

    const fetchUserBalance = async () => {
        try {
            const response = await fetch("http://localhost/api/auth/profile", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
    
            if (!response.ok) {
                throw new Error("❌ I couldn't get the balance");
            }
    
            const data = await response.json();
            console.log("📌 Otrimano balance:", data.balance);
    
            setBalance(data.balance.toFixed(2)); 
        } catch (error) {
            console.error("❌ Error in receiving a balance:", error.message);
            setBalance("N/A"); 
        }
    };

    const buyPhoneNumber = async () => {
        if (!selectedService || !selectedPrice) {
            setPurchaseStatus("❌ Authorization error. Please log in again.");
            return;
        }

        const username = localStorage.getItem("username");
        const token = localStorage.getItem("token");

        if (!username || !token) {
            setPurchaseStatus("❌ Authorization error. Please log in again.");
            return;
        }

        const parsedPrice = parseFloat(selectedPrice);
        const finalPrice = (parsedPrice * (1 + markup / 100)).toFixed(2); 

        if (isNaN(finalPrice)) {
            setPurchaseStatus("❌ Incorrect price. Enter the correct value.");
            return;
        }

        try {
            console.log("📌 Send a purchase request:", JSON.stringify({
                username: username,
                service: selectedService,
                price: finalPrice,
                rentalType: "short_term",
            }));

            const response = await fetch("http://localhost/api/phone-numbers/purchase", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: username,
                    service: selectedService,
                    price: finalPrice,
                    rentalType: "short_term",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `❌ I couldn't buy the number (code ${response.status})`);
            }

            console.log("✅ The purchase is successful:", data);
            setPurchaseStatus(`✅ Bought number:${data.phoneNumber}`);

            setPhoneNumbers((prevNumbers) => [
                ...prevNumbers,
                { phoneNumber: data.phoneNumber, serviceName: selectedService, expires_at: "15 minutes" }
            ]);

            if (expireTimer) clearTimeout(expireTimer);
            expireTimer = setTimeout(() => {
                expirePhoneNumber(data.phoneNumber);
            }, 900000); 

            fetchUserBalance();

        } catch (error) {
            console.error("❌ Purchase error:", error.message);
            setPurchaseStatus(error.message);
        }
    };
    const filterServices = (query) => {
        console.log("📌 All services before filtering:", services);
        console.log("🔍 Filter by request:", query);
    
        if (!services || services.length === 0) {
          console.error("❌ There are no filtering services.");
          setFilteredServices([]);
          return;
        }
    
        const filtered = query
          ? services.filter((service) =>
              service.name.toLowerCase().includes(query.toLowerCase())
            )
          : services;
    
        console.log("✅ Filtered services:", filtered);
        setFilteredServices(filtered);
      };

    const fetchServices = async () => {
        try {
            const response = await fetch("http://localhost/api/proxy/short-term-services", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`❌ Server error: ${response.status}`);
            }

            const data = await response.json();

            const shortTermServices = data.message.map((service) => ({
                name: service.name,
                ltr_available: parseInt(service.ltr_available, 10) || 0,
                original_price: parseFloat(service.ltr_short_price) ? parseFloat(service.ltr_short_price).toFixed(2) : "N/A",
                ltr_short_price: parseFloat(service.ltr_short_price)
                    ? (parseFloat(service.ltr_short_price) * (1 + markup / 100)).toFixed(2)
                    : "N/A",
            }));

            setServices(shortTermServices);
            setFilteredServices(shortTermServices);
        } catch (error) {
            console.error("❌ Error fetching services:", error);
            setServices([]);
            setFilteredServices([]);
        }
    };
    const fetchShortTermMdnData = async () => {
        try {
            const response = await fetch("http://localhost/api/phone-numbers/short-term-mdn", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to fetch data.");
            }

            const data = await response.json();
            let phoneNumbersArray = Array.isArray(data) ? data : data.message || [];

            const formattedNumbers = phoneNumbersArray.map((num) => ({
                serviceName: num.serviceName || "Unknown",
                phoneNumber: num.phoneNumber || "N/A",
                expires_at: num.expires_at ? new Date(num.expires_at).toLocaleString() : "N/A",
                status: num.status || "Unknown",
                message: "No messages",
            }));

            setPhoneNumbers(formattedNumbers);
            setShowNumbers(true);
        } catch (error) {
            console.error("❌ Error fetching short-term MDNs:", error.message);
            setPhoneNumbers([]);
        }
    };

    
    
    const fetchSMSMessages = async () => {
        if (!selectedNumber) {
            setPurchaseStatus("❌ Select a number before receiving messages!");
            return;
        }
    
        if (expireTimer) {
            clearTimeout(expireTimer);
            console.log("✅ Deletion timer canceled: user pressed 'Get Message'");
        }
    
        try {
            console.log("📩 Receive a message for the number:", selectedNumber);
    
            const response = await fetch("http://localhost/api/sms/messages", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ phoneNumber: selectedNumber }),
            });
    
            const messages = await response.json();
            console.log("📩 Messages received:", messages);
    
            const latestMessage = messages.length > 0
                ? `${messages[0].sender}: ${messages[0].message}`
                : "No messages";

            setPhoneNumbers((prevNumbers) =>
                prevNumbers.map((num) =>
                    num.phoneNumber === selectedNumber
                        ? { ...num, message: latestMessage }
                        : num
                )
            );
        } catch (error) {
            console.error("❌ Error receiving messages:", error.message);
        }
    };
        

  useEffect(() => {
      fetchUserBalance();
      fetchServices();
      fetchMarkup();
  }, [markup]);
  useEffect(() => {
    filterServices(searchQuery);
  }, [searchQuery, services]);
    const handleRowClick = (service) => {
        console.log("🟢 Choosed a service:", service);
        setSelectedService(service.name);
        setSelectedPrice(service.ltr_short_price);
    };
    const handleNumberClick = (phoneNumber) => {
        console.log("🟢 Choosed a number:", phoneNumber);
        setSelectedNumber(phoneNumber);
    };
     
  return (
    <div className="long-basic-section">
      {/* Header */}
      <header className="long-header">
        <div className="long-logo">
            <span className="icon">
                <img src="/imgs/icon.png" width={"30px"} style={{position: "relative", top: "7px"}}/> Realsimus
            </span>
        </div>
        <h1 className="long-title">SMS Number Rental</h1>
        <button className="long-profile-button"  onClick={() => navigate("/profile")}>👤 Profile</button>
      </header>

      
      <div className="long-container">
        {/* Balance Section */}
        <div className="long-balance-section">
            <div className="long-flag-container"><img src="/imgs/americflag.png" alt="USA Flag" height={"100px"} width={"175px"} /></div>
            <div className="long-balance-content-title">
                <h2>Short-Term-Rent US mobile numbers</h2>
                <div className="long-balance-content">
                    <div className="long-crypto-img"><img src="/imgs/main1.jpg" alt="USA Flag" height={"150px"} width={"150px"} /></div>
                    <div style={{margin: "5px 20px"}}>
                        <p className="long-balance-text">Balance: <span>${balance !== null ? balance : "Loading..."}</span></p>
                        <div className="long-buttons">
                            <button className="long-crypto-topup-button" onClick={() => navigate("/cryptocurency")}>Cryptocurrency top-up</button>
                            <button className="long-short-term-button" onClick={() => navigate("/long")}>Go to long-term rent</button>
                        </div>
                    </div>
                    <div className="long-crypto-img"><img src="/imgs/main2.jpg" alt="USA Flag" height={"150px"} width={"150px"} /></div>
                </div>
            </div>
            <div className="long-flag-container"><img src="/imgs/americflag.png" alt="USA Flag" height={"100px"} width={"175px"} /></div>
        </div>
        <div className="long-main">
            <div className="long-left">
                {/* Search Section */}
                
                <div className="long-search-section">
                    <div>
                        <label>Service:</label>
                        <input
                            type="text"
                            className="long-service-input"
                            style={{ width: "46%", margin: "0px 5px" }}
                            value={selectedService}
                            readOnly
                        />
                        <input
                            type="text"
                            className="long-amount-input"
                            style={{ width: "15%", marginRight: "5px" }}
                            value={selectedPrice}
                            readOnly
                        />
                        <button className="long-buy-button" onClick={buyPhoneNumber}>Buy!</button>
                    </div>
                    <div>
                        <label>Search:</label>
                        <input type="text" className="long-search-input"  style={{width: "58%", margin: "0px 19px"}}
                        value={tempSearchQuery} 
                        onChange={(e) => setTempSearchQuery(e.target.value)}
                        />
                        <button className="long-filter-button" onClick={() => setSearchQuery(tempSearchQuery)}>Filter</button>
                    </div>
                    <button className="long-view-rental-button" onClick={handleViewNumbers}>Click to view 30-day rental</button>
                </div>
                {/* Tables */}
                {showNumbers && (
                <div className="long-table-section">
                    <table className="long-service-table">
                        <thead>
                        <tr>
                            <th>Service</th>
                            <th>Amount</th>
                            <th>Price</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredServices.length > 0 ? (
                            filteredServices.map((service, index) => (
                                <tr key={index} onClick={() => handleRowClick(service)} style={{ cursor: "pointer" }}>
                                <td>{service.name}</td>
                                <td>{service.ltr_available}</td>
                                <td>${service.ltr_short_price}</td>
                            </tr>
                            ))
                        ) : (
                            <tr>
                            <td colSpan="3" style={{ textAlign: "center" }}>No services available</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
                )}

            </div>
            
            <div className="long-right">
                {/* Number Selection */}
                <div className="long-number-selection">
                    <label htmlFor="chooseNumber">Choose a number:</label>
                    <input type="text" className="long-number-input" id="chooseNumber" value={selectedNumber} readOnly/>
                    <button className="long-message-button" onClick={fetchSMSMessages} style={{width: "100%"}}>Get a message! 💬</button>
                </div>
                {/* Tables */}
                <div className="long-table-section" style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #ccc" }}>
                    <table className="long-number-table">
                        <thead>
                            <tr>
                                <th>Service</th>
                                <th>Phone Number</th>
                                <th>End Date</th>
                                <th>Status</th>
                                <th>Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {phoneNumbers.length > 0 ? (
                                phoneNumbers.map((num, index) => (
                                    <tr key={index} onClick={() => handleNumberClick(num.phoneNumber)} style={{ cursor: "pointer" }}>
                                        <td>{num.serviceName}</td>
                                        <td>{num.phoneNumber}</td>
                                        <td>{new Date(num.expires_at).toLocaleString()}</td>
                                        <td>{!num.status || num.status.trim() === "" ? "offline" : num.status}</td>
                                        <td>{num.message || "No messages"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="long-no-data">No purchased numbers</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
    
      </div>
      
    </div>
  );
};

export default Short;
