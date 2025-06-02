import React, { useState } from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Header onExpandChange={setIsHeaderExpanded} />
      <main className={`flex-1 p-8 transition-all duration-300 ${
        isHeaderExpanded ? 'ml-64' : 'ml-16'
      }`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;