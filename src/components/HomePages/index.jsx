'use client'

import { useEffect, useState } from 'react';
import './HomePage.css'
import HeaderHome from '../HomePages/HeaderHome/HeaderHome'
import FearGreedGauge from '../HomePages/Monitor/FearGreedGauge/FearGreedGauge'
import TradingVolumeCard from '../HomePages/Monitor/TradingVolumeCard/TradingVolumeCard'
import NewlyAddedTable from '../HomePages/Monitor/NewlyAddedTable/NewlyAddedTable'
import FeaturedGroup from '../HomePages/Monitor/FeaturedGroup/FeaturedGroup'
import GroupList from '../HomePages/GroupList/GroupList'

const HomePage = () => {
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token'));
    }
  }, []);

  if (token) {
    return <div>Logged in</div>;
  }

  return (
    <div className="home-page">
      <img src="/star.svg" alt="Galaxy" className="star-img" />
      <img src="/object.svg" alt="Galaxy" className="galaxy-img" />
      <div className="home-page-body">
        <HeaderHome />
        <div className="flex mt-[100px] w-[86vw] gap-[1vw] justify-between">
          <div className="w-[59vw] flex flex-col justify-start gap-4">
            <div className="w-full flex justify-start gap-3">
              <FearGreedGauge value={50} />
              <TradingVolumeCard />
              <TradingVolumeCard />
            </div>
            <div className="w-full flex justify-start gap-5">
              <FeaturedGroup />
            </div>
          </div>
          <div className="w-[36vw] flex gap-[2vw] justify-end">
            <NewlyAddedTable />
          </div>
        </div>
        <div className="w-full">
          <GroupList />
        </div>
      </div>
    </div>
  )
}

export default HomePage
