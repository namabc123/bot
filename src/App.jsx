import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import GroupList from "./components/GroupList.jsx";
import HomePages from "./components/HomePages";
import GroupOverview from "./components/GroupOverview.jsx";
import GroupPage from "./components/GroupPage.jsx";
import { fetchChats } from "./api";
import { DATA_REFRESH_INTERVAL } from "./Constants";
import MainLayout from "./layouts/MainLayout.jsx";

const AppContent = () => {
  const [chats, setChats] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const chatsData = await fetchChats();
        setChats(chatsData);
        setError("");
      } catch (err) {
        setError(err.message || "Unknown error");
      }
    };

    loadData();
    const interval = setInterval(loadData, DATA_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
      <Routes>
        {/* <Route path="/" element={<GroupList chats={chats} />} /> */}
        <Route path="/" element={<HomePages />} />
        <Route path="/group/:groupName" element={<GroupOverview />} />
        <Route path="/group/:groupName/page" element={<GroupPage />} />
      </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <MainLayout>
        <AppContent />
      </MainLayout>
    </Router>
  );
};

export default App;
