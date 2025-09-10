import React, { useState } from 'react';
import HierarchicalSidebar from './HierarchicalSidebar';
import HeaderBar from './HeaderBar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <HierarchicalSidebar onExpandChange={setIsHeaderExpanded} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isHeaderExpanded ? 'ml-64' : 'ml-16'
      }`}>
        <HeaderBar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;