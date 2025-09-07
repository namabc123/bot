import React, { useState } from "react";
import { Dropdown, ButtonGroup, Button } from "react-bootstrap";
import { FaChevronDown } from 'react-icons/fa';
import { FiExternalLink } from "react-icons/fi";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts"
import './GroupList.css';
import IndicatorGrowth from "../../Common/IndicatorGrowth/IndicatorGrowth"
import CustomPagination from "../../Common/Pagination/Pagination";

const data = [
  { value: 400 },
  { value: 300 },
  { value: 600 },
  { value: 500 },
  { value: 700 },
  { value: 650 },
  { value: 800 },
]

const groupData = [
  {
    name: 'Tether USA',
    logo: '/monero.png',
    country: 'US',
    members: 125,
    coinsLaunched: 4,
    avgPump: '3.15x',
    bestCoin: { name: 'XRP', change: '+8.14' },
    worstCoin: { name: 'ETH', change: '-8.14' },
    avgTrend: [50, 55, 60, 65, 63, 70], // sample trend values
  },
  {
    name: 'RockingGo IND',
    logo: '/monero.png',
    country: 'IN',
    members: 125,
    coinsLaunched: 4,
    avgPump: '3.15x',
    bestCoin: { name: 'XRP', change: '+8.14' },
    worstCoin: { name: 'ETH', change: '-8.14' },
    avgTrend: [45, 50, 48, 52, 55, 57],
  },
  {
    name: 'Birdmanly RUS',
    logo: '/monero.png',
    country: 'RU',
    members: 125,
    coinsLaunched: 4,
    avgPump: '3.15x',
    bestCoin: { name: 'XRP', change: '+8.14' },
    worstCoin: { name: 'ETH', change: '-8.14' },
    avgTrend: [60, 62, 61, 63, 65, 67],
  },
  {
    name: 'Forces88 JAP',
    logo: '/monero.png',
    country: 'JP',
    members: 125,
    coinsLaunched: 4,
    avgPump: '3.15x',
    bestCoin: { name: 'XRP', change: '+8.14' },
    worstCoin: { name: 'ETH', change: '-8.14' },
    avgTrend: [40, 42, 41, 45, 43, 44],
  },
  {
    name: 'RambledMonkey CAN',
    logo: '/monero.png',
    country: 'CA',
    members: 125,
    coinsLaunched: 4,
    avgPump: '3.15x',
    bestCoin: { name: 'XRP', change: '+8.14' },
    worstCoin: { name: 'ETH', change: '-8.14' },
    avgTrend: [30, 35, 32, 34, 33, 31],
  },
];

const GroupList = () => {
  const [page, setPage] = useState(1);
  const [activeRange, setActiveRange] = useState("12h");
  const ranges = ["1h", "6h", "12h", "1d", "7d"];

  return (
    <div className="mt-[50px] flex flex-col gap-[24px]">
      <h2 className="text-[#E4EEFE] font-normal text-[28px] leading-[100%]">Group List</h2>
      <div className="p-[32px] bg-[#0A0E19] border border-[#151B2D] rounded-[24px] shadow-md flex flex-col gap-[12px]">
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-[8px]">
            <Dropdown>
              <Dropdown.Toggle
                variant="secondary"
                className="w-[120px] h-[36px] rounded-[1000px] px-[12px] text-[#E4EEFE] text-[12px] bg-[#192033] gap-[4px] flex items-center justify-center cursor-pointer border-none"
                style={{ backgroundColor: "#192033" }}
              >
                <img src="/menu.svg" alt="Sort Icon" className="mr-1" />
                Sort By <FaChevronDown size={12} className="ml-1" />
              </Dropdown.Toggle>
              <Dropdown.Menu className="grouplist-menu">
                <Dropdown.Item>Option 1</Dropdown.Item>
                <Dropdown.Item>Option 2</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown>
              <Dropdown.Toggle
                variant="secondary"
                className="w-[100px] h-[36px] rounded-[1000px] px-[12px] text-[#E4EEFE] text-[12px] bg-[#192033] gap-[4px] flex items-center justify-center cursor-pointer border-none"
                style={{ backgroundColor: "#192033" }}
              >
                <img src="/filter.svg" alt="Sort Icon" className="mr-1" />
                Filter <FaChevronDown size={12} className="ml-1" />
              </Dropdown.Toggle>
              <Dropdown.Menu className="grouplist-menu">
                <Dropdown.Item>Option 1</Dropdown.Item>
                <Dropdown.Item>Option 2</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>

          <div className="flex justify-end items-center text-[#6F7486]">
            <ButtonGroup className="bg-[#151B2D] rounded-[1000px] w-[258px] h-[36px] p-[4px] flex">
              {ranges.map((range) => (
                <Button
                  key={range}
                  className={`cursor-pointer flex-1 h-full rounded-[1000px] text-[12px] ${
                    activeRange === range
                      ? "bg-[#1967FF] text-[#E4EEFE]"
                      : "bg-transparent text-[#6F7486]"
                  }`}
                  onClick={() => setActiveRange(range)}
                >
                  {range}
                </Button>
              ))}
            </ButtonGroup>
          </div>
        </div>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="grid grid-cols-[3%_32%_12%_12%_9%_9%_9%_9%_9%] bg-[#0F1523] text-[#9499AA] text-[12px] font-[400] rounded-[12px] h-[30px] pr-[12px] pl-[12px]">
              <th className="text-center p-2 align-middle">#</th>
              <th className="text-left p-2 align-middle">Name</th>
              <th className="text-right p-2 align-middle">Members</th>
              <th className="text-center p-2 align-middle">Coins Launched</th>
              <th className="text-center p-2 align-middle">Avg. Pump</th>
              <th className="text-left p-2 align-middle">Best Coin</th>
              <th className="text-left p-2 align-middle">Worst Coin</th>
              <th className="text-center p-2 align-middle">Avg. Trend</th>
              <th className="text-left p-2 align-middle"></th>
            </tr>
          </thead>

          <tbody>
            {groupData.map((group, index) => (
              <tr
                key={index}
                className="grid grid-cols-[3%_32%_12%_12%_9%_9%_9%_9%_9%] border-b border-gray-800 hover:bg-gray-800 text-[#E4EEFE] flex items-center h-[60px] pt-[6px] pr-[12px] pb-[6px] pl-[12px]"
              >
                <td className="text-center p-2">{index + 1}</td>
                <td className="text-center p-2 flex items-center gap-2">
                  <img
                    src={group?.logo}
                    alt={group?.name}
                    className="w-[28px] h-[28px] rounded-full"
                  />
                  <span className="text-[#FFFFFF] text-[14px] font-[400]">
                    {group.name}
                  </span>
                  <span className="ml-1 text-[10px] text-[#1967FF] bg-[#1967FF1F] flex items-center h-[15px] pt-[2px] pr-[6px] pb-[2px] pl-[6px] rounded-[100px]">New</span>
                </td>
                <td className="text-center p-2">{group.members}</td>
                <td className="text-center p-2 text-[#E4EEFE] text-[12px]">{group.coinsLaunched}</td>
                <td className="text-center p-2 text-[#1967FF] text-[12px] font-[700]">{group.avgPump}</td>
                <td className="text-center p-2 flex text-[#E4EEFE] text-[12px]">
                  {group.bestCoin.name} <IndicatorGrowth value={group.bestCoin.change} />
                </td>
                <td className="text-center p-2 flex text-[#E4EEFE] text-[12px]">
                  {group.worstCoin.name} <IndicatorGrowth value={group.worstCoin.change} />
                </td>
                <td className="text-center p-2" style={{ width: "100px", height: "50px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1E90FF" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#1E90FF" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#1E90FF"
                        fill="url(#colorGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </td>
                <td className="text-center p-2">
                  <button className="flex items-start justify-start gap-1 h-[28px] px-4 rounded-lg bg-[#151B2D] text-[12px] text-[#9499AA] font-[400] leading-[28px]">
                    Track <FiExternalLink size={14} className="relative top-[6px]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex justify-between items-center">
          <div>
             <CustomPagination
                totalPages={25}
                currentPage={page}
                onPageChange={(p) => setPage(p)}
              />
          </div>
          <div>
            <p className="inline text-[#9499AA] text-[14px] font-[400]">Show:</p>
            <div className="relative inline-block">
            <select
              className="ml-[16px] pt-[8px] pr-[24px] pb-[8px] pl-[16px] bg-[#151B2D] border border-[#151B2D] rounded-[12px] text-[#E4EEFE] text-[14px] font-[400] appearance-none"
            >
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>

            {/* Custom arrow */}
            <div className="pointer-events-none absolute right-[8px] top-1/2 transform -translate-y-1/2 text-[#E4EEFE]">
              <FaChevronDown size={12} className="ml-1" />
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupList;
