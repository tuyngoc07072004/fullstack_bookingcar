import { Power, Clock, AlertCircle } from 'lucide-react';

interface DriverStatusBadgeProps {
  status: 'active' | 'inactive' | 'busy';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export default function DriverStatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true,
  className = ''
}: DriverStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          text: 'Đang hoạt động',
          color: 'text-emerald-700',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          icon: <Power size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14} className="text-emerald-500" />
        };
      case 'busy':
        return {
          text: 'Đang bận',
          color: 'text-yellow-700',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: <Clock size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14} className="text-yellow-500" />
        };
      case 'inactive':
        return {
          text: 'Ngưng hoạt động',
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          border: 'border-gray-200',
          icon: <AlertCircle size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14} className="text-gray-500" />
        };
      default:
        return {
          text: 'Không xác định',
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          border: 'border-gray-200',
          icon: <AlertCircle size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14} className="text-gray-500" />
        };
    }
  };

  const config = getStatusConfig();
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2'
  };

  return (
    <div className={`inline-flex items-center rounded-full border font-medium ${config.bg} ${config.border} ${config.color} ${sizeClasses[size]} ${className}`}>
      {showIcon && config.icon}
      <span>{config.text}</span>
    </div>
  );
}