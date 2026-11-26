import {
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  House,
  Menu,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Smartphone,
  Tag,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
// Lucide has no brand icons, so logos come from Simple Icons via react-icons.
import { SiGithub } from "react-icons/si";

const ICONS = {
  menu: Menu,
  search: Search,
  play: Play,
  pause: Pause,
  shorts: Smartphone,
  volume: Volume2,
  muted: VolumeX,
  up: ChevronUp,
  down: ChevronDown,
  plus: Plus,
  home: House,
  tag: Tag,
  trash: Trash2,
  retry: RotateCcw,
  close: X,
  external: ExternalLink,
  download: Download,
  bell: Bell,
  check: Check,
  sliders: SlidersHorizontal,
  // filled logo: skip the stroke width the Lucide icons get
  github: ({ size }) => <SiGithub size={size} aria-hidden="true" />,
};

const Icon = ({ name, size = 24 }) => {
  const Component = ICONS[name];
  return <Component size={size} strokeWidth={1.8} aria-hidden="true" />;
};

export default Icon;
