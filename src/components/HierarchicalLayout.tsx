import React, { useState } from 'react';
import HierarchicalSidebar from './HierarchicalSidebar';

interface HierarchicalLayoutProps {
  children: React.ReactNode;
}

const HierarchicalLayout: React.FC<HierarchicalLayoutProps> = ({ children }) => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <HierarchicalSidebar onExpandChange={setIsSidebarExpanded} />
      <main className={`flex-1 transition-all duration-300 ${
        isSidebarExpanded ? 'ml-64' : 'ml-16'
      }`}>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default HierarchicalLayout;