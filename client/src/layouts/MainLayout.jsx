import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import SearchBar from '../components/SearchBar';
import './MainLayout.css';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="layout">
      <header className="header">
        <nav className="nav-container">
          <button 
            className="menu-toggle" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </button>
          
          <div className="nav-content">
            <SearchBar />
            <NotificationMenu />
            <Navbar />
          </div>
        </nav>
      </header>

      <div className="main-container">
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <Sidebar />
        </aside>
        
        <main className="content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
