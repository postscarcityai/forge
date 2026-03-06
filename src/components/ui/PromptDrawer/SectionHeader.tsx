import React from 'react';
import { 
  Icon, 
  ChevronDown, 
  ChevronUp, 
  Edit, 
  Users, 
  MapPin, 
  Camera, 
  Palette, 
  Cloud, 
  Layers, 
  Sliders,
  Video,
  Zap,
  Target
} from '@/components/ui/Icon';
import { LucideIcon } from 'lucide-react';

// Map string icon names to actual icon components
const iconMap: Record<string, LucideIcon> = {
  Edit,
  Users,
  MapPin,
  Camera,
  Palette,
  Cloud,
  Layers,
  Sliders,
  Video,
  Zap,
  Target
};

interface SectionHeaderProps {
  icon?: string;
  title: string;
  wordBudget: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  wordBudget,
  isExpanded,
  onToggle,
}) => {
  // Get the actual icon component from the string name
  const IconComponent = icon ? iconMap[icon] : null;

  return (
    <div className="flex items-center p-3">
      <button
        onClick={onToggle}
        className="flex-1 flex items-center justify-between hover:bg-accent/30 transition-colors rounded-md p-1 group"
      >
        <div className="flex items-center space-x-2">
          {IconComponent && <Icon icon={IconComponent} size="sm" className="text-primary" />}
          <span className="text-sm font-medium text-foreground">{title}</span>
          <span className="text-xs text-muted-foreground">{wordBudget}w</span>
        </div>
        <div className="ml-2 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
          <Icon 
            icon={isExpanded ? ChevronUp : ChevronDown} 
            size="xs" 
            className="text-muted-foreground" 
          />
        </div>
      </button>
    </div>
  );
}; 