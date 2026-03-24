import { useState, useEffect } from "react";
import Cookies from "js-cookie";
export default function AuthDemo() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isFormValid = login.trim() && password.trim();

  useEffect(() => {
    const savedToken = Cookies.get("accessToken");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchUser = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("http://212.113.98.188:8000/api/v1/auth/me", {
          method:"GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Ошибка получения данных");

        const data = await res.json();
        console.log(data)
        setUserData(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("http://212.113.98.188:8000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ login, password }),
      });

      if (!res.ok) throw new Error("Ошибка авторизации");

      const data = await res.json();
      const receivedToken = data.access_token;

      Cookies.set("accessToken", data.access_token, {expires: 7, secure: true, sameSite: "Strict"});
      setToken(receivedToken);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove("accessToken");
    setToken(null);
    setUserData(null);
  };

  return (
    <div className="min-h-screen flex justify-center items-center">
      {!token ? (
        <div className="min-h-screen flex justify-center items-center p-[10px_150px]">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2.5 items-center h-75 w-100 border-2 border-gray-300 rounded-[30px] p-5"
          >
            <h1 className="pb-2.5 my-2.5 text-2xl font-bold">
              Вход в учетную запись
            </h1>

            <input
              type="text"
              placeholder="Логин"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              disabled={isLoading}
              className="rounded-[15px] h-8.75 pl-1.5 w-[90%] border border-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100"
            />

            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="rounded-[15px] h-8.75 pl-1.5 w-[90%] border border-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100"
            />

            <button
              type="submit"
              className="h-12.5 rounded-[20px] w-[60%] bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 disabled:cursor-not-allowed flex justify-center items-center p-0 transition-colors duration-300"
              disabled={!isFormValid || isLoading}
            >
              <h2 className="m-0 text-xl text-white">
                {isLoading ? "Вход..." : "Войти"}
              </h2>
            </button>

            {error && <p className="text-red-500">{error}</p>}
          </form>
        </div>
      ) : (
        <div className="border-2 border-gray-300 rounded-[30px] p-10">
          {isLoading ? (
            <p>Загрузка...</p>
          ) : userData ? (
            <div>
              <h1 className="text-2xl font-bold mb-4">Данные пользователя</h1>
              <p>Логин: {userData.login}</p>
              <p>Пароль: {userData.password}</p>
              <button
                onClick={handleLogout}
                className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
              >
                Выйти
              </button>
            </div>
          ) : (
            <p>Не удалось загрузить данные</p>
          )}
        </div>
      )}
    </div>
  );
}
