import Card from "react-bootstrap/Card"
import { ArrowDown } from "lucide-react"
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts"
import IndicatorGrowth from "../../../Common/IndicatorGrowth/IndicatorGrowth"

const data = [
  { value: 400 },
  { value: 300 },
  { value: 600 },
  { value: 500 },
  { value: 700 },
  { value: 650 },
  { value: 800 },
]

export default function TradingVolumeCard() {
  return (
    <Card
      className="bg-[#0A0E19] border border-[#151B2D] rounded-3xl shadow-lg w-[278px] h-[140px] p-3"
    >
      <Card.Body className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">24h Trading Volume</span>
          <IndicatorGrowth value="-8.14"/>
        </div>

        <div className="text-xl font-semibold text-white">
          $823,372,957
        </div>

        <div className="h-[60px]">
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
        </div>
      </Card.Body>
    </Card>
  )
}
