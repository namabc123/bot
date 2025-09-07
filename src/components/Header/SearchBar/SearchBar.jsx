'use client'

import { Search } from "lucide-react"
import './SearchBar.css'

export default function SearchBar({ design = "" }) {
  return (
    <div className={`search-bar ${design}`}>
      <input
        type="text"
        placeholder="Search group"
      />
      <Search size={18} />
    </div>
  )
}
