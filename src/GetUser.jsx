import {useState, useEffect} from 'react';
import Cookies from 'js-cookie';

export default function GetUser() {
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() =>{
        const token = Cookies.get("accessToken");

        if (!token) {
            window.location.href = "/";
            return;
        }

        async function fetchUserData() {
          try {
          const token = Cookies.get("accessToken");
          const API_GET_USER_URL = "http://212.113.98.188:8000/api/v1/auth/me";
          
          const response = await fetch(API_GET_USER_URL, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              window.location.href = "/";
              return;
            }
            throw new Error(`Ошибка загрузки данных: ${response.status}`);
          }
          
          const data = await response.json();
          
          setUserData(data);
          setIsLoading(false);
        } catch (error) {
          console.error("Ошибка при запросе:", error);
          setIsLoading(false);
        }
        }

        fetchUserData();
    }, []);

    return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="border-2 border-gray-300 rounded-[30px] p-10">
        {isLoading ? (
          <p>Загрузка...</p>
        ) : userData ? (
          <div>
            <h1 className="text-2xl font-bold mb-4">Данные пользователя</h1>
            <p>Логин: {userData.login}</p>
            <p>Пароль: {userData.password}</p>
          </div>
        ) : (
          <p>Не удалось загрузить данные</p>
        )}
      </div>
    </div>
  );
}
