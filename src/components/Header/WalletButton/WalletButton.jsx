'use client';
import './WalletButton.css';
import ConnectWallet from '../ConnectWallet/ConnectWallet';
import { useState, useEffect } from "react";

export default function WalletButton() {
  const [user, setUser] = useState(null);
  const [openWallet, setOpenWallet] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const toggleWallet = () => {
    setOpenWallet(prev => !prev);
  };
  
  return (
    <>
      <button className="wallet-button" onClick={toggleWallet}>
        <img src="/wallet.svg" alt="Wallet" />
        <span className="wallet-text">
          {user ? user.walletId : "Connect Wallet"}
        </span>
      </button>
      {openWallet && <ConnectWallet onClose={toggleWallet}/>}
    </>
  );
}