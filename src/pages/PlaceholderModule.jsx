import React from 'react';

const PlaceholderModule = ({ title }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-2xl font-bold text-darkBlue mb-4">{title}</h2>
      <p className="text-gray-500 max-w-md mx-auto">
        This module is currently a placeholder. Full functionality will be implemented in a future phase.
      </p>
    </div>
  );
};

export default PlaceholderModule;
