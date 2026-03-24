import { useState } from "react";
import Cookies from "js-cookie";
import "./App.css";
import "./index.css";

const API_URL = "http://212.113.98.188:8000/api/v1/auth/login"

export default function App() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = login.trim().length > 0 && password.trim().length > 0;

  async function handleSubmit(event) {
    event.preventDefault();
    
    setIsLoading(true);
    try{
      const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({login, password}),
    });

    if (!response.ok){
      throw new Error('Ошибка авторизации')
    }

    const data = await response.json();
    console.log(data)

    Cookies.set("accessToken", data.access_token, {expires: 7, secure: true, sameSite: "Strict"});

    window.location.href = "/getuser";
    } catch (error) {
      console.error("Ошибка при входе:", error.message);
    } finally{
      setIsLoading(false);
    }

    
  }

  return (
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
          onChange={(e) => {
            setLogin(e.target.value);
          }}
          disabled={isLoading}
          className="rounded-[15px] h-8.75 pl-1.5 w-[90%] border border-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100"
        />
        
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
          }}
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
      </form>
    </div>
  );
}