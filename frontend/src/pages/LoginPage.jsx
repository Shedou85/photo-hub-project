import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

function LoginPage() {
  const [email, setEmail] = useState("marius@visaginas.lt");
  const [password, setPassword] = useState("Slaptazodis123");
  const [error, setError] = useState("");
  const [output, setOutput] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setOutput("");

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
      setOutput(JSON.stringify(data, null, 2));

      if (response.ok && data.status === "OK" && data.user) {
        login(data.user);
        navigate('/');
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
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto", fontFamily: "sans-serif" }}>
      <h2>{t('login.title')}</h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <div>
          <label htmlFor="email">{t('login.email')}:</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password">{t('login.password')}:</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit">{t('login.submit')}</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {output && <pre>{output}</pre>}
    </div>
  );
}

export default LoginPage;
