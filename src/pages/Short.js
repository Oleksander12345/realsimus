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
    const [timers, setTimers] = useState({});
    const token = localStorage.getItem("token");
    let expireTimer = null;
    const [showNumbers, setShowNumbers] = useState(false);

    const [markup, setMarkup] = useState(0);

    const API_URL = process.env.REACT_APP_API_URL;
    const handleViewNumbers = () => {
        setShowNumbers(true);
        fetchShortTermMdnData();
        fetchMarkup();
    };

    useEffect(() => {
        const loadData = async () => {
            console.log("📌 Loading markup...");
            await fetchMarkup(); // ✅ Дожидаемся загрузки наценки
            fetchServices(); // ✅ Теперь загружаем сервисы с правильной наценкой
            fetchShortTermMdnData(); // ✅ Загружаем номера
        };

        loadData();
    }, [markup]);


    const saveTimersToLocalStorage = (timers) => {
        localStorage.setItem("timers", JSON.stringify(timers));
    };

    const saveNumbersToLocalStorage = (numbers) => {
        localStorage.setItem("phoneNumbers", JSON.stringify(numbers));
    };
    const loadTimersFromLocalStorage = () => {
        const savedTimers = localStorage.getItem("timers");
        return savedTimers ? JSON.parse(savedTimers) : {};
    };

    const fetchMarkup = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/markup`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error(`Failed to fetch markup: ${response.status}`);

            const textData = await response.text(); // Читаем ответ как текст
            console.log("📌 Markup Response:", textData);

            const parsedMarkup = parseFloat(textData); // Парсим число
            if (isNaN(parsedMarkup)) {
                throw new Error("⚠️ Markup field is missing or invalid.");
            }

            setMarkup(parsedMarkup);
            localStorage.setItem("markup", parsedMarkup);
        } catch (err) {
            console.error("❌ Error fetching markup:", err.message);
            setMarkup(parseFloat(localStorage.getItem("markup")) || 0);
        }
    };


    const expirePhoneNumber = async (phoneNumber) => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.error("❌ The token is missing, the number cannot be deleted.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/phone-numbers/short-term-expire/${phoneNumber}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || `❌ Could not delete the number (code ${response.status})`);
            }

            // setPhoneNumbers((prevNumbers) => prevNumbers.filter((num) => num.phoneNumber !== phoneNumber));

            // setTimers((prevTimers) => {
            //     const newTimers = { ...prevTimers };
            //     delete newTimers[phoneNumber];
            //     return newTimers;
            // });
            setPhoneNumbers((prevNumbers) => {
                const updatedNumbers = prevNumbers.filter((num) => num.phoneNumber !== phoneNumber);
                saveNumbersToLocalStorage(updatedNumbers);
                return updatedNumbers;
            });
            setTimers((prevTimers) => {
                const updatedTimers = { ...prevTimers };
                delete updatedTimers[phoneNumber];
                saveTimersToLocalStorage(updatedTimers);
                return updatedTimers;
            });

        } catch (error) {
            console.error("❌ Error deleting number:", error.message);
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
        const storedNumbers = JSON.parse(localStorage.getItem("phoneNumbers")) || [];

        if (storedNumbers.length >= 2) {
            setPurchaseStatus("❌ You can only buy 2 numbers!");
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
            console.log("🔹 Final price (calculated with markup):", selectedPrice);

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
                    rentalType: "short_term",
                }),
            });

            const data = await response.json();
            console.log(data.selectedPrice)
            if (!response.ok) {
                throw new Error(data.message || "❌ Purchase failed.");
            }

            setPurchaseStatus(`✅ Bought a number: ${data.phoneNumber}`);
            const expireTime = Date.now() + 15 * 60 * 1000;

            setPhoneNumbers((prevNumbers) => [
                ...prevNumbers,
                { phoneNumber: data.phoneNumber, serviceName: selectedService, expires_at: expireTime }
            ]);

            setTimers((prevTimers) => ({
                ...prevTimers,
                [data.phoneNumber]: expireTime,
            }));

            setTimeout(() => {
                expirePhoneNumber(data.phoneNumber);
            }, 15 * 60 * 1000);

            fetchUserBalance();
        } catch (error) {
            console.error("❌ Purchase error:", error.message);
            setPurchaseStatus(error.message);
        }
    };



    const filterServices = (query) => {

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

        setFilteredServices(filtered);
    };

    const fetchServices = async () => {
        try {
            const response = await fetch(`${API_URL}/api/proxy/short-term-services`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error(`❌ Server error: ${response.status}`);
            }

            const data = await response.json();

            if (!data.message || data.message.length === 0) {
                throw new Error("❌ No services received from the server.");
            }

            console.log("📌 Services before markup:", data.message);

            const shortTermServices = data.message.map((service) => {
                const basePrice = parseFloat(service.price) || 0;
                const finalPrice = (basePrice * (1 + markup / 100)).toFixed(2); // ✅ Применяем наценку

                return {
                    name: service.name,
                    ltr_available: parseInt(service.ltr_available, 10) || 0,
                    original_price: basePrice.toFixed(2),
                    ltr_price: finalPrice // ✅ Цена с наценкой
                };
            });

            console.log("📌 Services after markup:", shortTermServices);

            setServices(shortTermServices);
            setFilteredServices(shortTermServices);
        } catch (error) {
            console.error("❌ Error fetching services:", error.message);
            setServices([]);
            setFilteredServices([]);
        }
    };




    const fetchShortTermMdnData = async () => {
        try {
            const response = await fetch(`${API_URL}/api/phone-numbers/short-term-mdn`, {
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

            // const formattedNumbers = phoneNumbersArray.map((num) => ({
            //     serviceName: num.serviceName || "Unknown",
            //     phoneNumber: num.phoneNumber || "N/A",
            //     expires_at: num.expires_at ? new Date(num.expires_at).toLocaleString() : "N/A",
            //     message: "No messages",
            // }));

            // setPhoneNumbers(formattedNumbers);

            const existingTimers = loadTimersFromLocalStorage();
            const formattedNumbers = phoneNumbersArray.map((num) => {
                const storedTime = existingTimers[num.phoneNumber];
                return {
                    serviceName: num.serviceName || "Unknown",
                    phoneNumber: num.phoneNumber || "N/A",
                    expires_at: storedTime || (Date.now() + 15 * 60 * 1000),
                    message: "No messages",
                };
            });

            setPhoneNumbers(formattedNumbers);


            const updatedTimers = { ...existingTimers };
            formattedNumbers.forEach((num) => {
                if (!updatedTimers[num.phoneNumber]) {
                    updatedTimers[num.phoneNumber] = num.expires_at;
                }
            });
            setTimers(updatedTimers);
            saveTimersToLocalStorage(updatedTimers);
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
        } catch (error) {
            console.error("❌ Error receiving messages:", error.message);
        }
    };


    useEffect(() => {
        fetchUserBalance();
        fetchServices();
        fetchMarkup();
    }, []);

    useEffect(() => {
        if (markup !== 0) {
            fetchServices();
        }
    }, [markup]);
    useEffect(() => {
        filterServices(searchQuery);
    }, [searchQuery, services]);
    useEffect(() => {
        const interval = setInterval(() => {
            const currentTime = Date.now();

            setTimers((prevTimers) => {
                const updatedTimers = { ...prevTimers };

                Object.keys(updatedTimers).forEach((phoneNumber) => {
                    const remainingTime = updatedTimers[phoneNumber] - currentTime;

                    if (remainingTime <= 0) {
                        expirePhoneNumber(phoneNumber);
                        delete updatedTimers[phoneNumber];
                    }
                });

                saveTimersToLocalStorage(updatedTimers);
                return updatedTimers;
            });

            setPhoneNumbers((prevNumbers) => {
                const filteredNumbers = prevNumbers.filter(
                    (num) => timers[num.phoneNumber] && timers[num.phoneNumber] > currentTime
                );
                saveNumbersToLocalStorage(filteredNumbers);
                return filteredNumbers;
            });

        }, 1000);

        return () => clearInterval(interval);
    }, [timers]);

// useEffect(() => {
//     const interval = setInterval(() => {
//         setTimers((prevTimers) => {
//             const updatedTimers = { ...prevTimers };

//             Object.keys(updatedTimers).forEach((phoneNumber) => {
//                 const remainingTime = updatedTimers[phoneNumber] - Date.now();
//                 if (remainingTime <= 0) {
//                     expirePhoneNumber(phoneNumber);
//                     delete updatedTimers[phoneNumber];
//                 }
//             });

//             saveTimersToLocalStorage(updatedTimers);
//             return updatedTimers;
//         });

//         setPhoneNumbers((prevNumbers) => {
//             const filteredNumbers = prevNumbers.filter(
//                 (num) => timers[num.phoneNumber] && timers[num.phoneNumber] > Date.now()
//             );
//             saveNumbersToLocalStorage(filteredNumbers);
//             return filteredNumbers;
//         });

//     }, 1000);

//     return () => clearInterval(interval);
// }, [timers]);

// useEffect(() => {
//     const savedTimers = localStorage.getItem("timers");
//     const savedNumbers = localStorage.getItem("phoneNumbers");

//     if (savedTimers) {
//         setTimers(JSON.parse(savedTimers));
//     }

//     if (savedNumbers) {
//         setPhoneNumbers(JSON.parse(savedNumbers));
//     }

//     fetchShortTermMdnData();
// }, []);

    const handleRowClick = (service) => {
        setSelectedService(service.name);
        setSelectedPrice((service.original_price * (1 + markup / 100)).toFixed(2));
    };

    const handleNumberClick = (phoneNumber) => {
        setSelectedNumber(phoneNumber);
    };
    useEffect(() => {
        fetchShortTermMdnData();
    }, []);

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
                            <button className="long-view-rental-button" onClick={handleViewNumbers}>Click to view short-term rental</button>
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
                                                <td>
                                                    ${service.ltr_price}
                                                </td>

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
                                    <th>Timer</th>
                                    <th>Message</th>
                                </tr>
                                </thead>
                                <tbody>
                                {phoneNumbers.length > 0 ? (
                                    phoneNumbers.map((num, index) => (
                                        <tr key={index} onClick={() => handleNumberClick(num.phoneNumber)} style={{ cursor: "pointer" }}>
                                            <td>{num.serviceName}</td>
                                            <td>{num.phoneNumber}</td>
                                            <td>
                                                {timers[num.phoneNumber]
                                                    ? `${Math.floor((timers[num.phoneNumber] - Date.now()) / 60000)}m 
                                                ${Math.floor(((timers[num.phoneNumber] - Date.now()) % 60000) / 1000)}s`
                                                    : null}
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

export default Short;
