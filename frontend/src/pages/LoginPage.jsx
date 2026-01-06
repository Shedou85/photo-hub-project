import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState("marius@visaginas.lt");
  const [password, setPassword] = useState("Slaptazodis123");
  const [error, setError] = useState("");
  const [output, setOutput] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setOutput("");

    try {
      const response = await fetch("https://api.pixelforge.pro/backend", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setOutput(JSON.stringify(data, null, 2));

      // The login script auth/login.php returns status: "OK" and a user object on success.
      if (response.ok && data.status === "OK" && data.user) {
        navigate("/"); // Navigate to homepage on success
      } else {
        // Use the error from the backend if available, otherwise a generic message.
        setError(
          `Login failed: ${
            data.error ||
            data.message ||
            "The server returned an unexpected response."
          }`
        );
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "400px",
        margin: "auto",
        fontFamily: "sans-serif",
      }}
    >
      <h2>Login</h2>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit">Login</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {output && <pre>{output}</pre>}
    </div>
  );
}

export default LoginPage;
