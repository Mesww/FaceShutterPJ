import React from 'react';

interface SwitchProps {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({ id, checked, onChange, className = '' }) => {
  return (
    <div className={`relative inline-block w-10 mr-2 align-middle select-none ${className}`}>
      <input
        type="checkbox"
        name={id}
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
      />
      <label
        htmlFor={id}
        className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
      ></label>
    </div>
  );
};

export default Switch;