import React from "react";
import { FiExternalLink } from "react-icons/fi";

const featuredGroups = [
  {
    name: "Tether",
    country: "USA",
    description: "Tether is a telegram group for those who seeks victory.",
    coinLaunched: 5,
    members: 125,
    logo: "/monero.png", // sample logo
  },
  {
    name: "Forces88",
    country: "USA",
    description: "Tether is a telegram group for those who seeks victory.",
    coinLaunched: 5,
    members: 128,
    logo: "/monero.png",
  },
  {
    name: "RockingGo",
    country: "USA",
    description: "Tether is a telegram group for those who seeks victory.",
    coinLaunched: 5,
    members: 130,
    logo: "/monero.png", // just example
  },
  {
    name: "RambledMonkey",
    country: "USA",
    description: "Tether is a telegram group for those who seeks victory.",
    coinLaunched: 5,
    members: 132,
    logo: "/monero.png",
  },
];

export default function FeaturedGroup() {
  return (
    <div className="flex flex-col gap-[20px] w-[760px] h-[386px] bg-transparent">
      <h2 className="text-[#E4EEFE] font-normal text-[28px] leading-[100%]">Featured Group</h2>

      <div className="grid grid-cols-2 gap-[12px]">
        {featuredGroups.map((group, idx) => (
          <div
            key={idx}
            className="bg-[#0B0E1A] rounded-xl p-[16px] flex justify-between shadow-md w-[374px] h-[163px] gap-[16px] opacity-100 border border-[#151B2D]"
          >
            <img
              src={group.logo}
              alt={group.name}
              className="w-[48px] h-[48px] rounded-[12px]"
            />
            <div className="gap-[8px] flex flex-col justify-between w-[278px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white font-[400] text-[20px]">
                    {group.name}{" "}
                    <span className="text-gray-400 text-[14px]">
                      {group.country}
                    </span>
                  </span>
                </div>
                <button className="flex items-start justify-start gap-1 h-[28px] px-4 rounded-lg bg-[#151B2D] text-[12px] text-[#9499AA] font-[400] leading-[28px]">
                  Track <FiExternalLink size={14} className="relative top-[6px]" />
                </button>
              </div>

              <p className="text-gray-400 text-sm">{group.description}</p>

              <div className="flex justify-between items-center text-sm text-gray-400">
                <div>
                  <div>Coin Launched</div>
                  <div className="text-blue-400">{group.coinLaunched}</div>
                </div>
                <div className="flex flex-col items-end">
                  <span>Members</span>
                  <div className="flex items-center gap-1">
                    <img
                      src="https://i.pravatar.cc/20?img=1"
                      className="w-5 h-5 rounded-full"
                    />
                    <img
                      src="https://i.pravatar.cc/20?img=2"
                      className="w-5 h-5 rounded-full -ml-2"
                    />
                    <img
                      src="https://i.pravatar.cc/20?img=3"
                      className="w-5 h-5 rounded-full -ml-2"
                    />
                    <span className="ml-1 text-gray-300">{group.members}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
