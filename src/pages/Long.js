import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Long() {
    const navigate = useNavigate();
    const [services, setServices] = useState([]); // Всі сервіси
    const [filteredServices, setFilteredServices] = useState([]); // Відфільтровані сервіси
    const [searchQuery, setSearchQuery] = useState(""); // Фактичний пошуковий запит
    const [tempSearchQuery, setTempSearchQuery] = useState(""); // Тимчасове поле вводу
    const [phoneNumbers, setPhoneNumbers] = useState([]); // Номери
    const [selectedNumber, setSelectedNumber] = useState(""); // Вибраний номер телефону
    const [selectedService, setSelectedService] = useState(""); // Вибраний сервіс
    const [selectedPrice, setSelectedPrice] = useState(""); // Вибрана ціна
    const [purchaseStatus, setPurchaseStatus] = useState("");
    const [balance, setBalance] = useState(null);
    const token = localStorage.getItem("token"); // Токен авторизації
    const [showNumbers, setShowNumbers] = useState(false); // Контролює завантаження номерів

    const handleViewNumbers = () => {
        setShowNumbers(true); // Включаємо завантаження номерів
        fetchLongTermMdnData(); // Завантажуємо номери
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
                throw new Error("❌ Не вдалося отримати баланс");
            }
    
            const data = await response.json();
            console.log("📌 Отримано баланс:", data.balance);
    
            setBalance(data.balance.toFixed(2)); // Округлюємо баланс до двох знаків після коми
        } catch (error) {
            console.error("❌ Помилка отримання балансу:", error.message);
            setBalance("N/A"); // Якщо сталася помилка, показуємо "N/A"
        }
    };
  // Функція покупки номера
  const buyPhoneNumber = async () => {
    if (!selectedService || !selectedPrice) {
        setPurchaseStatus("❌ Виберіть сервіс перед покупкою!");
        return;
    }

    const username = localStorage.getItem("username");
    if (!username) {
        setPurchaseStatus("❌ Помилка авторизації. Будь ласка, увійдіть ще раз.");
        return;
    }

    try {
        const finalPrice = applyMarkup(selectedPrice); // Додаємо націнку

        console.log("📌 Надсилаємо запит на покупку:", {
            username: username,
            service: selectedService,
            price: finalPrice, // Використовуємо ціну з націнкою
            rentalType: "long_term",
        });

        const response = await fetch("http://localhost/api/phone-numbers/purchase", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: username,
                service: selectedService,
                price: finalPrice, // Використовуємо змінену ціну
                rentalType: "long_term",
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "❌ Не вдалося купити номер");
        }

        console.log("✅ Покупка успішна:", data);
        setPurchaseStatus(`✅ Куплено номер: ${data.phoneNumber}`);

        fetchLongTermMdnData();
        fetchUserBalance();
    } catch (error) {
        console.error("❌ Помилка покупки:", error.message);
        setPurchaseStatus(error.message);
    }
};

    const filterServices = (query) => {
        console.log("📌 Усі сервіси перед фільтрацією:", services);
        console.log("🔍 Фільтруємо за запитом:", query);
    
        if (!services || services.length === 0) {
          console.error("❌ Немає сервісів для фільтрації.");
          setFilteredServices([]); // Очищаємо список
          return;
        }
    
        const filtered = query
          ? services.filter((service) =>
              service.name.toLowerCase().includes(query.toLowerCase())
            )
          : services;
    
        console.log("✅ Відфільтровані сервіси:", filtered);
        setFilteredServices(filtered);
      };
  // Отримання сервісів
    const fetchServices = async () => {
        try {
            const response = await fetch("http://localhost/api/proxy/services", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`❌ Помилка сервера: ${response.status}`);
            }

            const data = await response.json();

            const longTermServices = data.message.map((service) => ({
                name: service.name,
                ltr_available: parseInt(service.ltr_available, 10) || 0,
                ltr_price: parseFloat(service.ltr_price) ? parseFloat(service.ltr_price).toFixed(2) : "N/A",
            }));

            setServices(longTermServices);
            setFilteredServices(longTermServices); // Оновлюємо список для фільтрації
        } catch (error) {
            console.error("❌ Помилка отримання сервісів:", error);
            setServices([]);
            setFilteredServices([]);
        }
    };
  
  // Отримання телефонних номерів
    const fetchLongTermMdnData = async () => {
        try {
            const response = await fetch("http://localhost/api/phone-numbers/long-term-mdn", {
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
                message: "No messages", // Початково порожнє повідомлення
            }));

            setPhoneNumbers(formattedNumbers);
        } catch (error) {
            console.error("❌ Error fetching long-term MDNs:", error.message);
            setPhoneNumbers([]);
        }
    };

    const activatePhoneNumber = async () => {
        if (!selectedNumber) {
            setPurchaseStatus("❌ Виберіть номер перед активацією!");
            return;
        }
    
        try {
            console.log("📌 Активація номера:", selectedNumber);
    
            const response = await fetch(`http://localhost/api/phone-numbers/activate?mdn=${selectedNumber}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.message || "❌ Не вдалося активувати номер");
            }
    
            console.log("✅ Номер активовано:", data);
            setPurchaseStatus("✅ Номер активовано!");
    
            // Якщо активація відбудеться через час, запускаємо перевірку статусу
            if (data.till_change) {
                checkPhoneNumberStatus(selectedNumber);
            }
        } catch (error) {
            console.error("❌ Помилка активації:", error.message);
            setPurchaseStatus(error.message);
        }
    };
    const checkPhoneNumberStatus = async (phoneNumber) => {
        try {
            const response = await fetch(`http://localhost/api/phone-numbers/status?mdn=${phoneNumber}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
    
            const data = await response.json();
            console.log(`📌 Статус номера ${phoneNumber}:`, data.ltr_status);
    
            // Оновлюємо статус у таблиці
            setPhoneNumbers((prevNumbers) =>
                prevNumbers.map((num) =>
                    num.phoneNumber === phoneNumber
                        ? { ...num, status: data.ltr_status }
                        : num
                )
            );
    
            // Якщо номер ще офлайн, повторно перевіряємо через 30 секунд
            if (data.ltr_status === "offline") {
                setTimeout(() => checkPhoneNumberStatus(phoneNumber), 30000);
            }
        } catch (error) {
            console.error("❌ Помилка перевірки статусу номера:", error.message);
        }
    };
    const fetchSMSMessages = async () => {
        if (!selectedNumber) {
            setPurchaseStatus("❌ Виберіть номер перед отриманням повідомлень!");
            return;
        }
    
        try {
            console.log("📩 Отримуємо повідомлення для номера:", selectedNumber);
    
            const response = await fetch("http://localhost/api/sms/messages", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ phoneNumber: selectedNumber }),
            });
    
            const messages = await response.json();
            console.log("📩 Отримані повідомлення:", messages);
    
            const latestMessage = messages.length > 0
                ? `${messages[0].sender}: ${messages[0].message}`
                : "No messages";
    
            // Оновлюємо state з отриманими повідомленнями
            setPhoneNumbers((prevNumbers) =>
                prevNumbers.map((num) =>
                    num.phoneNumber === selectedNumber
                        ? { ...num, message: latestMessage }
                        : num
                )
            );
    
            // Таймер: якщо користувач не натисне кнопку протягом 1 години – видаляємо номер
            setTimeout(() => handleReturnPhoneNumber(selectedNumber), 3600000);
        } catch (error) {
            console.error("❌ Помилка отримання повідомлень:", error.message);
        }
    };
    const handleReturnPhoneNumber = async (phoneNumber) => {
        const username = localStorage.getItem("username");
    
        try {
            console.log("🔄 Видаляємо номер:", phoneNumber);
    
            const response = await fetch("http://localhost/api/phone-numbers/return", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, phoneNumber }),
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.message || "❌ Не вдалося повернути номер");
            }
    
            console.log("✅ Номер повернуто:", data);
    
            // Видаляємо номер з таблиці
            setPhoneNumbers((prevNumbers) => prevNumbers.filter((num) => num.phoneNumber !== phoneNumber));
        } catch (error) {
            console.error("❌ Помилка повернення номера:", error.message);
        }
    };
    const applyMarkup = (price) => {
        const markupPercentage = parseFloat(localStorage.getItem("markup")) || 0; // Отримуємо націнку
        return (parseFloat(price) * (1 + markupPercentage / 100)).toFixed(2); // Додаємо відсоток
    };
    
    const handleRowClick = (service) => {
        console.log("🟢 Вибрано сервіс:", service);
        setSelectedService(service.name);
        setSelectedPrice(applyMarkup(service.ltr_price)); // Оновлюємо ціну з націнкою
    };
    
  useEffect(() => {
    fetchUserBalance();
    fetchServices();
}, []);
  useEffect(() => {
    filterServices(searchQuery);
  }, [searchQuery, services]);
    const handleNumberClick = (phoneNumber) => {
        console.log("🟢 Вибрано номер:", phoneNumber);
        setSelectedNumber(phoneNumber); // Зберігаємо вибраний номер у стані
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
                {/* Search Section */}
                
                <div className="long-search-section">
                    <div>
                        <label>Service:</label>
                        <input
                            type="text"
                            className="long-service-input"
                            style={{ width: "46%", margin: "0px 5px" }}
                            value={selectedService} // Встановлюємо вибраний сервіс
                            readOnly // Робимо поле тільки для читання (щоб уникнути введення вручну)
                        />
                        <input
                            type="text"
                            className="long-amount-input"
                            style={{ width: "15%", marginRight: "5px" }}
                            value={selectedPrice} // Встановлюємо вибрану ціну
                            readOnly
                        />
                        <button className="long-buy-button" onClick={buyPhoneNumber}>Buy!</button>
                    </div>
                    <div>
                        <label>Search:</label>
                        <input type="text" className="long-search-input"  style={{width: "58%", margin: "0px 19px"}}
                        value={tempSearchQuery} // Використовуємо тимчасове поле
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
                                    <td>${applyMarkup(service.ltr_price)}</td>
                                </tr>
                                ))
                            ) : (
                                <tr>
                                <td colSpan="3" style={{ textAlign: "center" }}>Немає доступних сервісів</td>
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
                                <th>Message</th> {/* Додаємо нову колонку */}
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
                                        <td>{num.message || "No messages"}</td> {/* Відображення повідомлення */}
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