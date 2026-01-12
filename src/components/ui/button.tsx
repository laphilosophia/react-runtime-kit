import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

const buttonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '0.375rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  fontFamily: 'ui-monospace, monospace',
  backgroundColor: 'rgba(31, 41, 55, 0.9)',
  color: '#d1d5db',
  border: '1px solid rgba(75, 85, 99, 0.5)',
  borderRadius: '0.5rem',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

export const Button = ({ children, style, ...props }: ButtonProps) => {
  return (
    <button
      style={{ ...buttonStyle, ...style }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(55, 65, 81, 0.95)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(31, 41, 55, 0.9)';
      }}
      {...props}
    >
      {children}
    </button>
  );
};
