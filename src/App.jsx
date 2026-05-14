import { useState, useEffect } from "react";
import Cookies from "js-cookie";

const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL;

export default function Auth() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const [redirectFrom, setRedirectFrom] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isFormValid = login.trim() && password.trim();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get("from");
    if (fromParam) {
      setRedirectFrom(fromParam);
    }

    const savedToken = Cookies.get("accessToken");
    if (savedToken) {
      setToken(savedToken);
      if (fromParam) {
        try {
          const url = decodeURIComponent(fromParam);
          window.location.replace(url);
          return;
        } catch (e) {
          console.warn("Invalid redirect URL in 'from' param", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchUser = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const authToken = token || Cookies.get("accessToken");
        const res = await fetch(`${AUTH_API_URL}/api/v1/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!res.ok) throw new Error("Ошибка получения данных");

        const data = await res.json();
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
      const res = await fetch(`${AUTH_API_URL}/api/v1/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ login, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail == "Invalid login or password" ? "Неверный логин или пароль" : errorData.detail || "Неизвестная ошибка");
      }

      const data = await res.json();
      const receivedToken = data.access_token;

      Cookies.set("accessToken", data.access_token, {
        expires: 7,
        secure: true,
        sameSite: "None",
        path: "/",
      });
      setToken(receivedToken);
      if (redirectFrom) {
        try {
          const url = decodeURIComponent(redirectFrom);
          window.location.replace(url);
          return;
        } catch (e) {
          console.warn("Invalid redirect URL in 'from' param", e);
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove("accessToken", { path: "/" });
    setToken(null);
    setUserData(null);
  };

  return (
    <div className="min-h-screen bg-base-200 px-4 py-8 sm:px-6 content-center">
        <div className="mx-auto w-full max-w-md">
          <div className="card border border-primary/20 bg-base-100 shadow-xl">
            <div className="card-body">
              {!token ? (
                <>
                  <div className="mb-4 text-center">
                    <h1 className={`font-bold sm:text-4xl text-primary`}>Авторизация</h1>
                  </div>
                  <div className="flex flex-col gap-2.5 items-center">
                    <fieldset className="fieldset border-primary border-2 rounded-box w-full p-4">
                      <input type="email" className={`input w-full ${isLoading ? 'input-disabled' : ''}`} placeholder="Email" value={login} onChange={(e) => setLogin(e.target.value)} />
                      <input type="password" className={`input w-full ${isLoading ? 'input-disabled' : ''}`} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                      <button className={`btn btn-primary mt-2 ${!isFormValid || isLoading ? 'btn-disabled' : ''}`} onClick={handleSubmit}>
                        {isLoading ? "Вход..." : "Войти"}
                      </button>
                    </fieldset>
                    {error && <div className="rounded-box bg-error/5 p-4 w-full"><p className="text-sm leading-relaxed text-warning"><p className="font-bold">Ошибка авторизации:</p>{error}</p></div>}
                  </div>
                </>
              ) : (
                <>
                  {isLoading ? (
                    <p>Загрузка...</p>
                  ) : userData ? (
                    <div className="mb-4 text-center">
                      <h1 className={`font-bold sm:text-3xl text-primary`}>Успешно авторизованы</h1>
                    </div>
                  ) : (
                    <div className="rounded-box bg-error/5 p-4 w-full"><div className="text-sm font-semibold leading-relaxed text-warning"><p className="font-bold">Ошибка:</p>Не удалось загрузить данные пользователя.</div></div>
                  )}
                  <button onClick={handleLogout} className="btn btn-error mt-4 w-full">Выйти</button>
                </>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}
