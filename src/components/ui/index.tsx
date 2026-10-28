import React from 'react';

// Button
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';
    
    const variants = {
      primary: 'bg-[#6366f1] hover:bg-indigo-600 active:bg-indigo-700 dark:bg-[#818cf8] dark:hover:bg-indigo-400 dark:text-slate-900 text-white shadow-xs focus-visible:ring-2 focus-visible:ring-indigo-500',
      secondary: 'bg-gray-100 text-[#111827] hover:bg-gray-200 dark:bg-[#334155] dark:text-[#f1f5f9] dark:hover:bg-slate-600',
      outline: 'border border-[#e5e7eb] bg-white text-[#111827] hover:bg-gray-50 dark:border-[#334155] dark:bg-[#1e293b] dark:text-[#f1f5f9] dark:hover:bg-slate-700/80',
      ghost: 'bg-transparent text-[#6b7280] hover:text-[#111827] hover:bg-gray-100 dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] dark:hover:bg-slate-800',
      danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 dark:bg-rose-500 dark:hover:bg-rose-600',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
      icon: 'h-10 w-10 p-0',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// Input
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={`w-full rounded-xl border border-[#e5e7eb] bg-white px-3.5 py-2.5 text-sm text-[#111827] placeholder:text-[#6b7280]/70 focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#334155] dark:bg-[#1e293b] dark:text-[#f1f5f9] dark:placeholder:text-[#94a3b8]/60 dark:focus:border-[#818cf8] dark:focus:ring-[#818cf8]/20 transition-colors duration-200 ${
            error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// Card Components
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div
    className={`rounded-xl border border-[#e5e7eb] bg-white shadow-xs dark:border-[#334155] dark:bg-[#1e293b] text-[#111827] dark:text-[#f1f5f9] transition-colors duration-200 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`p-4 sm:p-5 flex flex-col space-y-1.5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className = '', children, ...props }) => (
  <h3 className={`font-semibold tracking-tight text-[#111827] dark:text-[#f1f5f9] transition-colors duration-200 ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className = '', children, ...props }) => (
  <p className={`text-xs text-[#6b7280] dark:text-[#94a3b8] transition-colors duration-200 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`p-4 sm:p-5 pt-0 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`flex items-center p-4 sm:p-5 pt-0 ${className}`} {...props}>
    {children}
  </div>
);

// Badge
export const Badge: React.FC<React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'secondary' | 'indigo' | 'outline' }> = ({
  className = '',
  variant = 'default',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-gray-100 text-[#111827] dark:bg-slate-700/80 dark:text-[#f1f5f9]',
    secondary: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
    indigo: 'bg-[#6366f1] text-white dark:bg-[#818cf8] dark:text-slate-900',
    outline: 'border border-[#e5e7eb] text-[#6b7280] dark:border-[#334155] dark:text-[#94a3b8]',
  };
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium transition-colors duration-200 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
