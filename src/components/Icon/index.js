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

// Lucide dropped brand icons, so the GitHub mark is drawn here.
const Github = ({ size }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.386-1.333-1.756-1.333-1.756-1.089-.747.083-.729.083-.729 1.205.084 1.838 1.238 1.838 1.238 1.07 1.834 2.809 1.305 3.495.998.108-.775.418-1.305.762-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.96-.267 1.983-.399 3.002-.405 1.02.006 2.042.138 3.003.405 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.241 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.37.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

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
  github: Github,
};

const Icon = ({ name, size = 24 }) => {
  const Component = ICONS[name];
  return <Component size={size} strokeWidth={1.8} aria-hidden="true" />;
};

export default Icon;
