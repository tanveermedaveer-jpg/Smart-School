import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PasswordInput = ({ className = '', ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  const combinedClassName = `${className} pr-10`.trim();

  return (
    <div className="relative w-full flex items-center">
      <input
        {...props}
        type={showPassword ? 'text' : 'password'}
        className={combinedClassName}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors flex items-center justify-center"
        title={showPassword ? "Hide Password" : "Show Password"}
        aria-label={showPassword ? "Hide Password" : "Show Password"}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

export default PasswordInput;
