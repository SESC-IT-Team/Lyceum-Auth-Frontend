import { useState, useEffect, useCallback } from "react";

const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL;

export default function Auth() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [redirectFrom, setRedirectFrom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isFormValid = login.trim() && password.trim();

  const performRedirect = useCallback((from) => {
    const target = from ?? redirectFrom;
    if (target) {
      try {
        window.location.replace(decodeURIComponent(target));
      } catch (e) {
        console.warn("Invalid redirect URL", e);
      }
    }
  }, [redirectFrom]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get("from");
    if (fromParam) setRedirectFrom(fromParam);

    const checkAuth = async () => {
      try {
        const res = await fetch(`${AUTH_API_URL}/api/v1/auth/me`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          setIsAuthenticated(true);
          performRedirect(fromParam);
          return;
        }

        if (res.status === 401) {
          const refreshRes = await fetch(`${AUTH_API_URL}/api/v1/auth/refresh`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });

          if (refreshRes.ok) {
            setIsAuthenticated(true);
            performRedirect(fromParam);
            return;
          }
        }

        setIsAuthenticated(false);
      } catch (e) {
        console.error("Auth check error:", e);
        setError("Ошибка связи с сервером");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

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
        throw new Error(
          errorData.detail === "Invalid login or password"
            ? "Неверный логин или пароль"
            : errorData.detail || "Ошибка входа"
        );
      }

      setIsAuthenticated(true);
      performRedirect();
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${AUTH_API_URL}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.warn("Logout error", e);
    }
    setIsAuthenticated(false);
  };

  if (isLoading) {
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
            {!isAuthenticated ? (
              <>
                <div className="mb-4 text-center">
                  <h1 className="font-bold sm:text-4xl text-primary">Авторизация</h1>
                </div>
                <form className="flex flex-col gap-2.5 items-center" onSubmit={handleSubmit}>
                  <fieldset className="fieldset border-primary border-2 rounded-box w-full p-4">
                    <input
                      type="text"
                      className={`input w-full ${isLoading ? "input-disabled" : ""}`}
                      placeholder="Login"
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                    />
                    <input
                      type="password"
                      className={`input w-full ${isLoading ? "input-disabled" : ""}`}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="submit"
                      className={`btn btn-primary mt-2 w-full ${!isFormValid || isLoading ? "btn-disabled" : ""}`}
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
                {redirectFrom && <p className="mb-4">Перенаправление...</p>}
                <button onClick={handleLogout} className="btn btn-error w-full">Выйти</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}