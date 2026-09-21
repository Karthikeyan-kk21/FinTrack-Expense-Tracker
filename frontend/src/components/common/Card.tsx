import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  header,
  footer,
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-surface-200/80 shadow-card transition-all duration-200 overflow-hidden ${
        hoverEffect ? 'hover:shadow-card-hover hover:border-surface-300' : ''
      } ${className}`}
      {...props}
    >
      {header && <div className="border-b border-surface-100 px-6 py-4">{header}</div>}
      <div className="p-6">{children}</div>
      {footer && <div className="border-t border-surface-100 bg-surface-50/50 px-6 py-3.5">{footer}</div>}
    </div>
  );
};
