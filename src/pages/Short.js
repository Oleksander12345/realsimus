import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Short() {
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
    let expireTimer = null;
    const [showNumbers, setShowNumbers] = useState(false); // Контроль показу
    const [markup, setMarkup] = useState(0);
    
    
        const handleViewNumbers = () => {
            setShowNumbers(true); // Включаємо завантаження номерів
            fetchLongTermMdnData(); // Завантажуємо номери
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

        setMarkup(data.markup); // Оновлюємо стан
        localStorage.setItem("markup", data.markup); // Зберігаємо в localStorage
    } catch (err) {
        console.error("❌ Error fetching markup:", err.message);
        setMarkup(parseFloat(localStorage.getItem("markup")) || 0); // Використовуємо значення з localStorage
    }
};
    // Функція видалення номера через API
    const expirePhoneNumber = async (phoneNumber) => {
        const token = localStorage.getItem("token");

        console.log("📌 Видаляємо номер через 15 хвилин бездіяльності:", phoneNumber);

        if (!token) {
            console.error("❌ Токен відсутній, номер не можна видалити.");
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
            console.log("📌 Відповідь сервера (видалення номера):", data);

            if (!response.ok) {
                throw new Error(data.message || `❌ Не вдалося видалити номер (код ${response.status})`);
            }

            // Видаляємо номер з інтерфейсу
            setPhoneNumbers((prevNumbers) => prevNumbers.filter((num) => num.phoneNumber !== phoneNumber));

        } catch (error) {
            console.error("❌ Помилка видалення номера:", error.message);
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
        const token = localStorage.getItem("token");

        if (!username || !token) {
            setPurchaseStatus("❌ Помилка авторизації. Будь ласка, увійдіть ще раз.");
            return;
        }

        const parsedPrice = parseFloat(selectedPrice);
        const finalPrice = (parsedPrice * (1 + markup / 100)).toFixed(2); // Додаємо націнку

        if (isNaN(finalPrice)) {
            setPurchaseStatus("❌ Некоректна ціна. Введіть правильне значення.");
            return;
        }

        try {
            console.log("📌 Надсилаємо запит на покупку:", JSON.stringify({
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
                throw new Error(data.message || `❌ Не вдалося купити номер (код ${response.status})`);
            }

            console.log("✅ Покупка успішна:", data);
            setPurchaseStatus(`✅ Куплено номер: ${data.phoneNumber}`);

            // Додаємо номер до списку телефонів
            setPhoneNumbers((prevNumbers) => [
                ...prevNumbers,
                { phoneNumber: data.phoneNumber, serviceName: selectedService, expires_at: "15 хвилин" }
            ]);

            // Запускаємо таймер на 15 хвилин (900000 мс)
            if (expireTimer) clearTimeout(expireTimer);
            expireTimer = setTimeout(() => {
                expirePhoneNumber(data.phoneNumber);
            }, 900000); // 900000 мс = 15 хвилин

            fetchUserBalance(); // Оновлення балансу після покупки

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
            const response = await fetch("http://localhost/api/proxy/short-term-services", {
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

            const shortTermServices = data.message.map((service) => ({
                name: service.name,
                ltr_available: parseInt(service.ltr_available, 10) || 0,
                original_price: parseFloat(service.ltr_price) ? parseFloat(service.ltr_price).toFixed(2) : "N/A",
                ltr_price: parseFloat(service.ltr_price)
                    ? (parseFloat(service.ltr_price) * (1 + markup / 100)).toFixed(2)
                    : "N/A",
            }));
    
            setServices(shortTermServices);
            setFilteredServices(shortTermServices);// Оновлюємо список для фільтрації
        } catch (error) {
            console.error("❌ Помилка отримання сервісів:", error);
            setServices([]);
            setFilteredServices([]);
        }
    };
  
  // Отримання телефонних номерів
    const fetchLongTermMdnData = async () => {
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
                message: "No messages", // Початково порожнє повідомлення
            }));

            setPhoneNumbers(formattedNumbers);
            setShowNumbers(true); // Відобразити номери після завантаження
        } catch (error) {
            console.error("❌ Error fetching short-term MDNs:", error.message);
            setPhoneNumbers([]);
        }
    };

    
    
    const fetchSMSMessages = async () => {
        if (!selectedNumber) {
            setPurchaseStatus("❌ Виберіть номер перед отриманням повідомлень!");
            return;
        }
    
        // ❌ ВАЖЛИВО: СКАСОВУЄМО АВТОМАТИЧНЕ ВИДАЛЕННЯ
        if (expireTimer) {
            clearTimeout(expireTimer);
            console.log("✅ Таймер видалення скасовано: користувач натиснув 'Get Message'");
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
        } catch (error) {
            console.error("❌ Помилка отримання повідомлень:", error.message);
        }
    };
        

  useEffect(() => {
      fetchUserBalance();
      fetchServices();
      fetchMarkup();
  }, []);
  useEffect(() => {
    filterServices(searchQuery);
  }, [searchQuery, services]);
    const handleRowClick = (service) => {
        console.log("🟢 Вибрано сервіс:", service);
        setSelectedService(service.name);
        setSelectedPrice(service.ltr_price);
    };
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
                                <td>${service.ltr_price}</td>
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

export default Short;
