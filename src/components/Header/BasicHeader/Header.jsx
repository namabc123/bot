'use client'

import Logo from "../Logo/Logo"
import NavMenu from "../NavMenu/NavMenu"
import SearchBar from "../SearchBar/SearchBar"
import WalletButton from "../WalletButton/WalletButton"
import "./Header.css"

export default function Header() {
  return (
    <header className="main-header">
        <Logo />
        <NavMenu />
        <SearchBar />
        <WalletButton />
    </header>
  )
}
