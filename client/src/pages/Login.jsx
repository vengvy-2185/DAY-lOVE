import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("phone"); // "phone" | "code"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function requestCode(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/login", { phone });
      setStep("code");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function submitCode(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify", { phone, code });
      login(data.token, data.user);
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-base-950 dark:bg-base-950">
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-accent2/20 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm surface-panel border rounded-3xl p-6 shadow-glow">
        <div className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center text-white font-bold text-lg mb-4 shadow-glow">
          DL
        </div>
        <h1 className="text-xl font-semibold mb-1">Day Life</h1>
        <p className="text-sm text-muted mb-6">
          Private access only. Sign in with your phone number and the one-time code your admin gave you.
        </p>

        {step === "phone" && (
          <form onSubmit={requestCode} className="space-y-3">
            <input
              type="tel"
              required
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full surface-raised border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/50 transition placeholder:text-muted"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              disabled={loading}
              className="w-full bg-brand-gradient text-white rounded-xl py-2.5 text-sm font-semibold shadow-glow disabled:opacity-50 hover:opacity-90 active:scale-[0.98] transition"
            >
              {loading ? "Checking…" : "Continue"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={submitCode} className="space-y-3">
            <p className="text-xs text-muted">
              Code sent to <span className="text-accent font-medium">{phone}</span> by your admin. It expires in 5 minutes and can only be used once.
            </p>
            <input
              type="text"
              required
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full surface-raised border rounded-xl px-3 py-2.5 text-sm tracking-[0.3em] text-center outline-none focus:ring-2 focus:ring-accent/50 transition placeholder:tracking-normal placeholder:text-muted"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              disabled={loading}
              className="w-full bg-brand-gradient text-white rounded-xl py-2.5 text-sm font-semibold shadow-glow disabled:opacity-50 hover:opacity-90 active:scale-[0.98] transition"
            >
              {loading ? "Verifying…" : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="w-full text-xs text-muted py-1 hover:text-accent transition"
            >
              Use a different phone number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
