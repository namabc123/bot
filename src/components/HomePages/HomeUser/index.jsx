'use client'

import { useEffect, useState } from 'react';
import './HomePage.css'
import HeaderHome from '../HomePages/HeaderHome/HeaderHome'
import FearGreedGauge from '../HomePages/Monitor/FearGreedGauge/FearGreedGauge'
import TradingVolumeCard from '../HomePages/Monitor/TradingVolumeCard/TradingVolumeCard'
import NewlyAddedTable from '../HomePages/Monitor/NewlyAddedTable/NewlyAddedTable'
import FeaturedGroup from '../HomePages/Monitor/FeaturedGroup/FeaturedGroup'
import GroupList from '../HomePages/GroupList/GroupList'

const HomeUser = () => {
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
      
    </div>
  )
}

export default HomePage
