import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ComponentProps } from 'react';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface Sport {
  label: string;
  value: string;
  icon: IconName;
  color: string;
}

export const SPORTS: Sport[] = [
  { label: 'Football', value: 'Football', icon: 'football', color: '#E74C3C' },
  { label: 'Basketball', value: 'Basketball', icon: 'basketball', color: '#F39C12' },
  { label: 'Soccer', value: 'Soccer', icon: 'soccer', color: '#2ECC71' },
  { label: 'Track & Field', value: 'Track & Field', icon: 'run-fast', color: '#1ABC9C' },
  { label: 'Baseball', value: 'Baseball', icon: 'baseball', color: '#3498DB' },
  { label: 'Volleyball', value: 'Volleyball', icon: 'volleyball', color: '#F1C40F' },
  { label: 'Softball', value: 'Softball', icon: 'softball', color: '#E91E63' },
  { label: 'Field Hockey', value: 'Field Hockey', icon: 'hockey-sticks', color: '#00BCD4' },
];

// Avatar colors assigned deterministically by name
const AVATAR_COLORS = [
  '#4A90D9',
  '#E74C3C',
  '#9B59B6',
  '#2ECC71',
  '#F39C12',
  '#1ABC9C',
  '#E91E63',
  '#00BCD4',
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Gradient pairs for large profile avatars
export function getAvatarGradient(name: string): [string, string] {
  const base = getAvatarColor(name);
  // Lighten the base color for the gradient end
  const gradients: Record<string, [string, string]> = {
    '#4A90D9': ['#4A90D9', '#A8D0F0'],
    '#E74C3C': ['#E74C3C', '#F5A6A0'],
    '#9B59B6': ['#9B59B6', '#D2A8E0'],
    '#2ECC71': ['#2ECC71', '#A8E6CF'],
    '#F39C12': ['#F39C12', '#FDDBA5'],
    '#1ABC9C': ['#1ABC9C', '#A3E4D7'],
    '#E91E63': ['#E91E63', '#F8A4C0'],
    '#00BCD4': ['#00BCD4', '#A0E7F0'],
  };
  return gradients[base] ?? ['#F39C12', '#FDDBA5'];
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// Position badge colors
export function getBadgeColor(position: string): string {
  const pos = position.toUpperCase();
  if (pos.includes('HEAD COACH')) return '#D4A017';
  if (pos.includes('RECRUITING')) return '#4A90D9';
  if (pos.includes('ASSOCIATE')) return '#9B59B6';
  if (pos.includes('ASSISTANT')) return '#7B68EE';
  if (pos.includes('COORDINATOR')) return '#4A90D9';
  if (pos.includes('DIRECTOR') || pos.includes('DIR')) return '#8E8E93';
  if (pos.includes('OFFENSIVE') || pos.includes('DEFENSIVE')) return '#E67E22';
  return '#636366';
}
