import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [issued, setIssued] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateCode(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setIssued(null);
    try {
      const { data } = await api.post("/admin/code", { phone, name: name || undefined });
      setIssued(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/admin/users")}
            className="text-sm px-3 py-1.5 rounded bg-base-800 hover:bg-base-700"
          >
            Manage Users
          </button>
          <button
            onClick={() => navigate("/chat")}
            className="text-sm px-3 py-1.5 rounded bg-base-800 hover:bg-base-700"
          >
            Back to Chat
          </button>
        </div>
      </div>

      <div className="bg-base-900 border border-base-700 rounded-2xl p-5">
        <h2 className="font-medium mb-3">Generate one-time login code</h2>
        <form onSubmit={generateCode} className="space-y-3">
          <input
            type="tel"
            required
            placeholder="User phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-base-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
          />
          <input
            type="text"
            placeholder="Display name (only used if creating a new user)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-base-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            disabled={loading}
            className="bg-accent rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate code"}
          </button>
        </form>

        {issued && (
          <div className="mt-4 p-4 rounded-lg bg-base-800 border border-base-600">
            <p className="text-xs text-slate-400 mb-1">
              Share this code with {issued.phone} — it expires in {issued.expiresInMinutes} minutes and works once only. It will not be shown again.
            </p>
            <p className="text-2xl tracking-widest font-mono">{issued.code}</p>
            {!issued.name && (
              <p className="text-xs text-amber-400 mt-2">
                Remember: the user still needs to be approved under Manage Users before they can sign in.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
