import React from 'react';

interface Tab {
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: number;
  onChange: (index: number) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => !tab.disabled && onChange(index)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === index
                  ? 'border-blue-500 text-blue-600'
                  : tab.disabled
                    ? 'border-transparent text-gray-400 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              disabled={tab.disabled}
            >
              {tab.label}
              {tab.disabled && (
                <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
                  Indisponible
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
      <div className="py-6">
        {tabs[activeTab].content}
      </div>
    </div>
  );
};