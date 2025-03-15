import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Long() {
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
    const [markup, setMarkup] = useState(0);
    const token = localStorage.getItem("token");
    const [activationMessage, setActivationMessage] = useState("");

    const [showNumbers, setShowNumbers] = useState(false);
    const [showServices, setShowServices] = useState(false);

    const handleViewNumbers = () => {
        setShowNumbers(true);
        fetchMarkup();
        fetchLongTermMdnData();
    };

    useEffect(() => {
        const loadData = async () => {
            console.log("📌 Loading data...");
            await fetchMarkup(); // ✅ Сначала загружаем наценку
            fetchServices();      // ✅ Потом загружаем сервисы с учетом наценки
            fetchLongTermMdnData();
        };

        loadData();
    }, [markup]); // ✅ Теперь сервисы обновятся после загрузки `markup`





    useEffect(() => {
        const interval = setInterval(() => {
            setPhoneNumbers((prevNumbers) =>
                prevNumbers.map((num) => ({
                    ...num,
                    till_change: num.till_change > 0 ? num.till_change - 1 : 0,
                }))
            );
        }, 1000);

        return () => clearInterval(interval);
    }, []);


    const API_URL = process.env.REACT_APP_API_URL;

    const fetchMarkup = async () => {
        try {
            console.log("📌 Fetching markup...");
            const response = await fetch(`${API_URL}/api/admin/markup`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error(`❌ Failed to fetch markup: ${response.status}`);

            const data = await response.text(); // Читаем как текст
            console.log("✅ Markup response:", data); // Лог ответа API

            const parsedMarkup = parseFloat(data);
            if (isNaN(parsedMarkup)) {
                console.error("❌ API returned invalid markup:", data);
                throw new Error("⚠️ Markup field is missing or invalid.");
            }

            setMarkup(parsedMarkup);
            console.log("✅ Markup set to:", parsedMarkup);
        } catch (err) {
            console.error("❌ Error fetching markup:", err.message);
            setMarkup(parseFloat(localStorage.getItem("markup")) || 0);
        }
    };






    const fetchUserBalance = async () => {
        try {
            const response = await fetch(`${API_URL}/api/auth/profile`, {
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

            setBalance(data.balance.toFixed(2));
        } catch (error) {
            console.error("❌ Error in receiving a balance:", error.message);
            setBalance("N/A");
        }
    };

    const buyPhoneNumber = async () => {
        if (!selectedService || !selectedPrice) {
            setPurchaseStatus("❌ Choose a service before buying!");
            return;
        }

        const username = localStorage.getItem("username");
        if (!username) {
            setPurchaseStatus("❌ Authorization error. Please log in again.");
            return;
        }

        try {
            console.log("📌 Sending purchase request...");
            console.log("🔹 Service:", selectedService);
            console.log("🔹 Final price (already with markup):", selectedPrice);

            const response = await fetch(`${API_URL}/api/phone-numbers/purchase`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: username,
                    service: selectedService,
                    price: selectedPrice,
                    rentalType: "long_term",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "❌ Purchase failed.");
            }

            setPurchaseStatus(`✅ Bought a number: ${data.phoneNumber}`);
            hideMessage(setPurchaseStatus);
            fetchUserBalance();
        } catch (error) {
            console.error("❌ Purchase error:", error.message);
            setPurchaseStatus(error.message);
        }
    };

    const filterServices = (query) => {
        if (!Array.isArray(services) || services.length === 0) {
            console.error("❌ There are no services for filtering.");
            setFilteredServices([]);
            return;
        }

        const filtered = query
            ? services.filter((service) =>
                service.name.toLowerCase().includes(query.toLowerCase())
            )
            : services;

        setFilteredServices(filtered);
    };
    const fetchServices = async () => {
        try {
            console.log("📌 Fetching services...");
            console.log("✅ Current markup:", markup); // Лог наценки

            const response = await fetch(`${API_URL}/api/proxy/services`, {
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
            console.log("✅ Services response:", data); // Лог ответа API

            const longTermServices = data.message.map((service) => {
                const basePrice = parseFloat(service.ltr_price) || 0;
                const finalPrice = (basePrice * (1 + markup / 100)).toFixed(2); // ✅ Применяем наценку

                return {
                    name: service.name,
                    ltr_available: parseInt(service.ltr_available, 10) || 0,
                    original_price: basePrice.toFixed(2), // Исходная цена
                    ltr_price: finalPrice // ✅ Цена с наценкой
                };
            });

            console.log("✅ Processed services:", longTermServices);
            setServices(longTermServices);
            setFilteredServices(longTermServices);
        } catch (error) {
            console.error("❌ Error fetching services:", error.message);
            setServices([]);
            setFilteredServices([]);
        }
    };




    const fetchLongTermMdnData = async () => {
        try {
            const response = await fetch(`${API_URL}/api/phone-numbers/long-term-mdn`, {
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
            console.log(data)
            let phoneNumbersArray = Array.isArray(data) ? data : data.message || [];

            const formattedNumbers = phoneNumbersArray.map((num) => {
                const basePrice = num.price ? parseFloat(num.price) : 0; // ✅ Исправлено: если `num.price === null`, то будет 0
                const finalPrice = (basePrice * (1 + markup / 100)).toFixed(2); // ✅ Исправлено округление

                return {
                    serviceName: num.serviceName || "Unknown",
                    phoneNumber: num.phoneNumber || "N/A",
                    expires_at: num.expires_at ? new Date(num.expires_at).toLocaleString() : "N/A",
                    status: num.status || "offline",
                    till_change: num.till_change || 0,
                    final_price: finalPrice, // ✅ Теперь округлено до 2 знаков после запятой
                    message: "No messages",
                };
            });



            console.log(formattedNumbers.till_change)
            formattedNumbers.forEach(num => {
                console.log(`🔹 Number: ${num.phoneNumber}, Till Change: ${num.till_change}`);
            });
            localStorage.setItem("formattedNumbers", JSON.stringify(formattedNumbers));


            setPhoneNumbers(formattedNumbers);
            setPhoneNumbers((prevNumbers) => {
                const updatedNumbers = formattedNumbers.map((num) => {
                    const existingNum = prevNumbers.find((prevNum) => prevNum.phoneNumber === num.phoneNumber);
                    return {
                        ...num,
                        status: existingNum?.status || num.status || "offline",
                        till_change: existingNum?.till_change > 0 ? existingNum.till_change : num.till_change || 0,
                    };
                });

                localStorage.setItem("phoneNumbers", JSON.stringify(updatedNumbers));
                return updatedNumbers;
            });
        } catch (error) {
            console.error("❌ Error fetching long-term MDNs:", error.message);
            setPhoneNumbers([]);
        }
    };

    const activatePhoneNumber = async () => {
        if (!selectedNumber) {
            setPurchaseStatus("❌ Select the number before activation!");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/phone-numbers/activate?mdn=${selectedNumber}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            console.log(data)
            if (!response.ok) {
                throw new Error(data.message || "❌ Number could not be activated");
            }
            setActivationMessage(data.message);

            setTimeout(() => checkPhoneNumberStatus(selectedNumber), 5000);
            setPurchaseStatus("✅ Activated number!");
            hideMessage(setPurchaseStatus);

            if (data.till_change) {
                checkPhoneNumberStatus(selectedNumber);
            }
        } catch (error) {
            console.error("❌ Activation error:", error.message);
            setPurchaseStatus(error.message);
        }
    };
    const checkPhoneNumberStatus = async (phoneNumber) => {
        try {
            const response = await fetch(`${API_URL}/api/phone-numbers/status?mdn=${phoneNumber}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            setPhoneNumbers((prevNumbers) =>
                prevNumbers.map((num) =>
                    num.phoneNumber === phoneNumber
                        ? { ...num, status: data.ltr_status, till_change: data.till_change }
                        : num
                )
            );

            if (data.ltr_status === "offline") {
                setTimeout(() => checkPhoneNumberStatus(phoneNumber), 5000);
            }
        } catch (error) {
            console.error("❌ Error checking number status:", error.message);
        }
    };
    const fetchSMSMessages = async () => {
        if (!selectedNumber) {
            setPurchaseStatus("❌ Select a number before receiving notifications!");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/sms/messages`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ phoneNumber: selectedNumber }),
            });

            const messages = await response.json();

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

            setTimeout(() => handleReturnPhoneNumber(selectedNumber), 3600000);
        } catch (error) {
            console.error("❌ Error receiving messages:", error.message);
        }
    };
    const handleReturnPhoneNumber = async (phoneNumber) => {
        const username = localStorage.getItem("username");

        try {
            const response = await fetch(`${API_URL}/api/phone-numbers/return`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, phoneNumber }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "❌ You couldn't turn the number");
            }

            setPhoneNumbers((prevNumbers) => prevNumbers.filter((num) => num.phoneNumber !== phoneNumber));
        } catch (error) {
            console.error("❌ Mistake of number reversal:", error.message);
        }
    };


    const handleRowClick = (service) => {
        setSelectedService(service.name);
        setSelectedPrice(service.ltr_price);
    };
    const hideMessage = (setStateFunction, delay = 5000) => {
        setTimeout(() => {
            setStateFunction("");
        }, delay);
    };

    useEffect(() => {
        fetchUserBalance();
        fetchServices();
        fetchLongTermMdnData();
    }, [markup]);
    useEffect(() => {
        filterServices(searchQuery);
    }, [searchQuery, services]);
    const handleNumberClick = (phoneNumber) => {
        setSelectedNumber(phoneNumber);
    };
    useEffect(() => {
        if (activationMessage) {
            const timer = setTimeout(() => {
                setActivationMessage("");
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, [activationMessage]);
    useEffect(() => {
        const savedNumbers = localStorage.getItem("formattedNumbers");
        if (savedNumbers) {
            setPhoneNumbers(JSON.parse(savedNumbers));
        }

        fetchLongTermMdnData();
    }, []);


    return (
        <div className="long-basic-section">
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
                <div className="long-balance-section">
                    <div className="long-flag-container"><img src="/imgs/americflag.png" alt="USA Flag" height={"100px"} width={"175px"} /></div>
                    <div className="long-balance-content-title">
                        <h2>Long-Term-Rent US mobile numbers</h2>
                        <div className="long-balance-content">
                            <div className="long-crypto-img"><img src="/imgs/main1.jpg" alt="USA Flag" height={"150px"} width={"150px"} /></div>
                            <div style={{margin: "5px 20px"}}>
                                <p className="long-balance-text">Balance: <span>${balance !== null ? balance : "Loading..."}</span></p>
                                <div className="long-buttons">
                                    <button className="long-crypto-topup-button" onClick={() => navigate("/cryptocurency")}>Cryptocurrency top-up</button>
                                    <button className="long-short-term-button" onClick={() => navigate("/short")}>Go to short-term rent</button>
                                </div>
                            </div>
                            <div className="long-crypto-img"><img src="/imgs/main2.jpg" alt="USA Flag" height={"150px"} width={"150px"} /></div>
                        </div>
                    </div>
                    <div className="long-flag-container"><img src="/imgs/americflag.png" alt="USA Flag" height={"100px"} width={"175px"} /></div>
                </div>
                <div className="long-main">
                    <div className="long-left">
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
                            <button className="long-view-rental-button"  onClick={handleViewNumbers}>Click to view 30-day rental</button>
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
                                                <td>{service.ltr_price ? `$${service.ltr_price}` : "N/A"}</td>
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
                            <button className="long-error-button" style={{marginLeft: "0"}} onClick={() => handleReturnPhoneNumber(selectedNumber)}>Mdn doesn't work! ❌</button>
                            <button className="long-activate-button" onClick={activatePhoneNumber}>Activate mdn! ✅</button>
                            <button className="long-message-button" onClick={fetchSMSMessages}>Get a message! 💬</button>
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
                                            <td>
                                                {num.status !== "active" ? num.status : "no activated"}
                                                {num.till_change ? ` (Till change: ${num.till_change}s)` : ""}
                                            </td>
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

export default Long;