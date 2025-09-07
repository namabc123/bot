import './HeaderHome.css'
import SearchBar from '../../Header/SearchBar/SearchBar'

const HeaderHome = () => {
  return ( 
    <div className="home-page-header">
        <div className="home-page-content">
        <span className="title">MoonBot Tracking Tool</span>
        <span className="title">
            Trade <span className="highlight">Smarter</span>, Move <span className="highlight">Faster</span>.
        </span>
        <span className="sub-title">AI-powered insights for safer, smarter crypto trading.</span>
        </div>
        <SearchBar design="homepage" />
    </div>
  )
}

export default HeaderHome