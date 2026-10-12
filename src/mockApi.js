const API=" http://localhost:5116";

export async function fetchUsers({ cursor = 0, limit = 50, search = '' }) {
  const params = new URLSearchParams({ cursor, limit, search });
  const res = await fetch(`${API}/api/users?${params}`);
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  return res.json();
}