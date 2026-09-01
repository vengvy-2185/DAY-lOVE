import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await api.get("/admin/users");
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(id, field, value) {
    await api.patch(`/admin/users/${id}`, { [field]: value });
    load();
  }

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">User Management</h1>
        <button
          onClick={() => navigate("/admin")}
          className="text-sm px-3 py-1.5 rounded bg-base-800 hover:bg-base-700"
        >
          Back to Admin
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <div className="bg-base-900 border border-base-700 rounded-2xl divide-y divide-base-800">
          {users.map((u) => (
            <div key={u.id} className="p-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium text-sm flex items-center gap-2">
                  {u.name}
                  <span className={`w-2 h-2 rounded-full ${u.online ? "bg-emerald-400" : "bg-slate-600"}`} />
                  {u.isAdmin && (
                    <span className="text-[10px] uppercase bg-accent/20 text-accent px-1.5 py-0.5 rounded">
                      Admin
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400">{u.phone}</div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => toggle(u.id, "approved", !u.approved)}
                  className={`text-xs px-2 py-1 rounded ${
                    u.approved ? "bg-emerald-500/20 text-emerald-300" : "bg-base-800 hover:bg-base-700"
                  }`}
                >
                  {u.approved ? "Approved" : "Approve"}
                </button>
                <button
                  onClick={() => toggle(u.id, "disabled", !u.disabled)}
                  className={`text-xs px-2 py-1 rounded ${
                    u.disabled ? "bg-red-500/20 text-red-300" : "bg-base-800 hover:bg-base-700"
                  }`}
                >
                  {u.disabled ? "Disabled" : "Disable"}
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <p className="p-4 text-sm text-slate-500">No users yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
