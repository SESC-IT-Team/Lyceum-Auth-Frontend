import { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";

const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL;

export default function Auth() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const [redirectFrom, setRedirectFrom] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Начинаем в состоянии загрузки
  const [error, setError] = useState(null);

  const isFormValid = login.trim() && password.trim();

  // Хелпер для редиректа
  const performRedirect = useCallback(() => {
    if (redirectFrom) {
      try {
        const url = decodeURIComponent(redirectFrom);
        window.location.replace(url);
      } catch (e) {
        console.warn("Invalid redirect URL", e);
      }
    }
  }, [redirectFrom]);

  // Основная логика проверки авторизации
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get("from");
    if (fromParam) setRedirectFrom(fromParam);

    const checkAuth = async () => {
      const savedToken = Cookies.get("accessToken");
      
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        // 1. Пробуем получить /me
        const res = await fetch(`${AUTH_API_URL}/api/v1/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${savedToken}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setUserData(data);
          setToken(savedToken);
          performRedirect(); // Если всё ок — уходим на исходную страницу
          return;
        }

        // 2. Если /me не прошел (например, 401), пробуем /refresh
        const refreshRes = await fetch(`${AUTH_API_URL}/api/v1/auth/refresh`, {
          method: "POST", // Обычно POST, проверьте ваш API
          credentials: "include",
          headers: { "Content-Type": "application/json" }
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newToken = refreshData.access_token;
          
          setToken(newToken);
          // После рефреша можно либо снова дернуть /me, либо сразу редиректнуть
          performRedirect();
        } else {
          // Если рефреш не удался — удаляем старый токен и показываем форму
          handleLogout();
        }
      } catch (e) {
        console.error("Auth check error:", e);
        setError("Ошибка связи с сервером");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [performRedirect]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${AUTH_API_URL}/api/v1/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail === "Invalid login or password" ? "Неверный логин или пароль" : errorData.detail || "Ошибка входа");
      }

      const data = await res.json();
      setToken(data.access_token);
      performRedirect();
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

  // Если идет первичная проверка — лучше показать спиннер на весь экран
  if (isLoading && !token && !error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 px-4 py-8 sm:px-6 content-center">
      <div className="mx-auto w-full max-w-md">
        <div className="card border border-primary/20 bg-base-100 shadow-xl">
          <div className="card-body">
            {!token ? (
              <>
                <div className="mb-4 text-center">
                  <h1 className="font-bold sm:text-4xl text-primary">Авторизация</h1>
                </div>
                <form className="flex flex-col gap-2.5 items-center" onSubmit={handleSubmit}>
                  <fieldset className="fieldset border-primary border-2 rounded-box w-full p-4">
                    <input 
                      type="text" 
                      className={`input w-full ${isLoading ? 'input-disabled' : ''}`} 
                      placeholder="Login" 
                      value={login} 
                      onChange={(e) => setLogin(e.target.value)} 
                    />
                    <input 
                      type="password" 
                      className={`input w-full ${isLoading ? 'input-disabled' : ''}`} 
                      placeholder="Password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                    />
                    <button 
                      type="submit"
                      className={`btn btn-primary mt-2 w-full ${!isFormValid || isLoading ? 'btn-disabled' : ''}`}
                    >
                      {isLoading ? "Вход..." : "Войти"}
                    </button>
                  </fieldset>
                </form>
                {error && (
                  <div className="rounded-box bg-error/5 p-4 w-full mt-4">
                    <div className="text-sm leading-relaxed text-warning">
                      <p className="font-bold">Ошибка:</p>
                      {error}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center">
                <h1 className="font-bold sm:text-3xl text-primary mb-4">Успешно авторизованы</h1>
                {redirectFrom && (
                  <p className="mb-4">Перенаправление из {redirectFrom}...</p>
                )}
                <button onClick={handleLogout} className="btn btn-error w-full">Выйти</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}