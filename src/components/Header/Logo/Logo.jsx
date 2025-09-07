'use client'
import "./Logo.css"

export default function Logo() {
  return (
    <div className="logo">
      <div className="logo-img">
        <img src="/logo.svg" alt="MoonBot Logo" />
      </div>
      <span className="logo-text">MoonBot</span>
    </div>
  )
}