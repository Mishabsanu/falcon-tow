"use client";

import { useEffect, useState } from "react";

export default function NotificationPanel() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((res) => setData(res.data));
  }, []);

  return (
    <div className="bg-white shadow p-4">
      <h3 className="font-semibold mb-2">Notifications</h3>

      <ul>
        {data.map((n) => (
          <li
            key={n._id}
            className={n.isRead ? "text-gray-400" : "font-semibold"}
          >
            {n.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
