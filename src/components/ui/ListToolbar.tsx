"use client";

import { Search } from "lucide-react";

type ListToolbarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rightSlot?: React.ReactNode;
  searchClassName?: string;
};

export default function ListToolbar({
  value,
  onChange,
  placeholder = "Search records...",
  rightSlot,
  searchClassName = "",
}: ListToolbarProps) {
  return (
    <div className="dashboard-surface flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
      <div className={`relative group w-full ${searchClassName || "md:flex-1"}`}>
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-800/30 transition-colors group-focus-within:text-emerald-600"
          size={18}
        />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="dashboard-control pl-12 pr-4 py-3.5"
        />
      </div>
      {rightSlot}
    </div>
  );
}
