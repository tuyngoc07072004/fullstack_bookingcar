import React from 'react';

interface InputGroupProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}

export const InputGroup: React.FC<InputGroupProps> = ({ label, children, required }) => {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
};