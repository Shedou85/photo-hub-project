import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/login`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (response.ok && data.status === "OK" && data.user) {
        login(data.user);
        navigate('/collections');
      } else {
        setError(
          `${t('login.failed')} ${data.error || data.message || "The server returned an unexpected response."}`
        );
      }
    } catch (err) {
      setError(`${t('login.networkError')} ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
      <div className="bg-white border border-gray-200 rounded-[10px] px-8 py-8 w-full max-w-[400px]">
        <h1 className="mt-0 mb-6 text-[22px] font-bold text-gray-900">
          {t('login.title')}
        </h1>

        <form onSubmit={handleSubmit}>
          {/* Email field */}
          <div className="mb-4">
            <label htmlFor="email" className="block mb-[5px] text-[13px] font-semibold text-gray-700">
              {t('login.email')}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full py-[9px] px-3 text-sm text-gray-800 bg-white border-[1.5px] border-gray-300 focus:border-blue-500 rounded-md outline-none box-border transition-colors duration-150 font-sans"
            />
          </div>

          {/* Password field */}
          <div className="mb-6">
            <label htmlFor="password" className="block mb-[5px] text-[13px] font-semibold text-gray-700">
              {t('login.password')}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full py-[9px] px-3 text-sm text-gray-800 bg-white border-[1.5px] border-gray-300 focus:border-blue-500 rounded-md outline-none box-border transition-colors duration-150 font-sans"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-0 flex items-start gap-[10px] px-[14px] py-3 mb-4 bg-red-50 border border-red-200 rounded-md text-[13px] text-red-800">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="w-full py-[9px] px-[22px] text-sm font-semibold text-white rounded-md border-none font-sans cursor-pointer hover:opacity-[0.88] transition-opacity duration-150 bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)]"
          >
            {t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
