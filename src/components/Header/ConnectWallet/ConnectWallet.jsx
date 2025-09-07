import React, { useState, useEffect } from "react";

const wallets = [
  { name: "Metamask", icon: "/metamask.png" },
  { name: "Phantom", icon: "/phantom.png" },
  { name: "Ledger", icon: "/ledger.png" },
  { name: "Solflare", icon: "/solflare.png" },
];

const ConnectWallet = ({ onClose }) => {
  const [user, setUser] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (wallet) => {
    setSelectedWallet(wallet.name)
    // Simulate a wallet ID and fake token
    const fakeWalletId = "0x" + Math.random().toString(16).substring(2, 10).padEnd(40, "0");
    const fakeToken = "fake-jwt-token-" + Date.now();

    const userData = {
      walletId: fakeWalletId,
      username: "TestUser",
      email: "testuser@example.com",
      token: fakeToken,
    };

    // Save to localStorage
    localStorage.setItem("token", fakeToken);
    localStorage.setItem("user", JSON.stringify(userData));

    setUser(userData);

    // Redirect and refresh
    window.location.href = "/home";
  };

  const handleLogout = (wallet) => {
    setSelectedWallet(wallet.name)
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);

    // Redirect and refresh
    window.location.href = "/home";
  };

  return (
    <div className="fixed inset-0 bg-[#151B2DF2] bg-opacity-95 flex items-center justify-center z-50">
      <div className="bg-[#0A0E19] p-6 rounded-[16px] w-[420px] h-[412px] max-w-full border-[#151B2D] p-[32px] flex flex-col gap-[32px] relative">
        <div className="flex items-center align-center gap-[16px]">
        <button
            onClick={onClose}
            className="flex items-center justify-center text-white text-lg font-bold"
            style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                gap: "10px",
                transform: "rotate(0deg)",
                opacity: 1,
                paddingTop: "8px",
                paddingRight: "16px",
                paddingBottom: "8px",
                paddingLeft: "16px",
                background: "#192033",
            }}
            >
            &larr;
        </button>

        <div className="flex justify-center align-center w-[244px] h-[32px]">
          <h2 className="text-[24px] font-[400] mx-auto text-[#E4EEFE]">Connect Wallet</h2>
        </div>
        </div>

        {/* Wallet options */}
        <div className="grid grid-cols-2 gap-4">
          {wallets.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => user ? handleLogout(wallet) : handleLogin(wallet)}
              className={`flex flex-col items-center justify-center pt-[16px] pr-[10px] pb-[16px] pl-[10px] rounded-[10px] ${
                selectedWallet === wallet.name
                  ? "text-[#1967FF] border bg-[#1967FF1F]"
                  : "text-[#E4EEFE] bg-[#050811]"
              } hover:border-blue-400 transition`}
            >
              <img
                src={wallet.icon}
                alt={wallet.name}
                className="w-10 h-10 mb-2"
              />
              <span>{wallet.name}</span>
            </button>
          ))}
        </div>

        {/* Show more button */}
        <button className="w-full bg-[#192033] pt-[8px] pr-[16px] pl-[16px] pb-[8px] rounded-[10px] text-[14px] text-[#E4EEFE] flex gap-[4px] justify-center">
            <img
                src="/chevron-down.png"
                className="w-[20px] h-[20px]"
              />
            Show more
        </button>
      </div>
    </div>
  );
};

export default ConnectWallet;
