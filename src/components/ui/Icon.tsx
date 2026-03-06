import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconProps {
  icon: LucideIcon;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4', 
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export const Icon: React.FC<IconProps> = ({ 
  icon: IconComponent, 
  size = 'md', 
  className 
}) => {
  return (
    <IconComponent 
      className={cn(
        sizeMap[size],
        'stroke-current',
        className
      )} 
    />
  );
};

// Re-export commonly used icons for convenience
export {
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  User,
  Users,
  Settings,
  Home,
  Mail,
  Phone,
  Calendar,
  Clock,
  History,
  SquareSplitHorizontal,
  MapPin,
  Star,
  Heart,
  Share,
  Download,
  Upload,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Info,
  ExternalLink,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Play,
  Grid,
  MoreHorizontal,
  Slash,
  Folder,
  Link,
  GripVertical,
  Building2,
  Palette,
  Camera,
  Layers,
  RotateCcw,
  Cloud,
  Package,
  Sparkles,
  Zap,
  Lightbulb,
  PanelLeft,
  PanelLeftOpen,
  PanelRight,
  PanelRightOpen,
  PanelTop,
  PanelTopOpen,
  Sliders,
  Video,
  Target,
} from 'lucide-react'; 