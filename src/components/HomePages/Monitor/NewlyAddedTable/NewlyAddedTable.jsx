import { FiExternalLink } from "react-icons/fi";

const coins = [
  { name: "RockingGo", logo: "monero.png", launched: 4, pump: "3.15x" },
  { name: "Tether", logo: "monero.png", launched: 4, pump: "3.15x" },
  { name: "Forces88", logo: "monero.png", launched: 4, pump: "3.15x" },
  { name: "RambledMonkey", logo: "monero.png", launched: 4, pump: "3.15x" },
  { name: "Birdmanly", logo: "monero.png", launched: 4, pump: "3.15x" },
  { name: "Tether", logo: "monero.png", launched: 4, pump: "3.15x" },
];

export default function NewlyAddedTable() {
  return (
    <div className="bg-[#0A0E19] border border-[#151B2D] rounded-[24px] shadow-md p-[32px] flex flex-col gap-[28px] h-[542px] w-[500px]">
      <h2 className="text-[24px] font-[400] text-[#E4EEFE] h-[24px] flex items-center">
        Newly Added
      </h2>

      <div className="w-full text-sm h-[426px] overflow-y-auto custom-scrollbar gap-[6px] flex flex-col">
        <div className="grid grid-cols-[144px_82px_60px_78px] bg-[#0F1523] text-[#9499AA] text-[12px] font-[400] rounded-[12px] flex items-center gap-[16px] pt-[6px] pr-[12px] pb-[6px] pl-[12px]">
          <span>Name</span>
          <span className="text-center">Coin Launched</span>
          <span className="text-center">Avg. Pump</span>
          <span></span>
        </div>

        {coins.map((coin, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[144px_82px_60px_78px] flex items-center gap-[16px] pt-[6px] pr-[12px] pb-[6px] pl-[12px] py-3 h-[60px]"
          >
            <div className="flex items-center gap-2">
              <img
                src={coin.logo}
                alt={coin.name}
                className="w-[28px] h-[28px] rounded-full"
              />
              <span className="text-[#FFFFFF] text-[14px] font-[400]">{coin.name}</span>
            </div>

            <div className="text-center text-[#E4EEFE] text-[12px] font-[400]">{coin.launched}</div>

            <div className="text-center text-[#1967FF] text-[12px] font-[400]">{coin.pump}</div>

            <div className="flex justify-end">
              <button className="flex items-start justify-start gap-1 h-[28px] px-4 rounded-lg bg-[#151B2D] text-[12px] text-[#9499AA] font-[400] leading-[28px]">
                Track <FiExternalLink size={14} className="relative top-[6px]" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
