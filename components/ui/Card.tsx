import React from 'react';

// FIX: Extend CardProps with React.HTMLAttributes<HTMLDivElement> to allow passing standard div props like onClick.
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    // FIX: Spread the rest of the props onto the div element.
    <div className={`bg-white rounded-xl shadow-md p-6 sm:p-8 ${className}`} {...props}>
      {children}
    </div>
  );
};
