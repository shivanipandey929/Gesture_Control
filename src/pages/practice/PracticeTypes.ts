export type ArcadeTab = 'balloon' | 'fruit' | 'match' | 'draw' | 'rps' | 'count';

export interface Balloon {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  type: 'standard' | 'gold' | 'bomb' | 'clock';
  popped: boolean;
  hoverStartTime?: number;
}

export interface Fruit {
  id: number;
  name: string;
  emoji: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isBomb: boolean;
  slashed: boolean;
  rotation: number;
  rotSpeed: number;
  halves?: {
    leftX: number;
    leftY: number;
    rightX: number;
    rightY: number;
    vxLeft: number;
    vxRight: number;
  };
}

export interface JuiceParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

export interface GameRecord {
  id: string;
  timestamp: number;
  game: string;
  score: number;
  accuracy: number;
  difficulty: 'easy' | 'medium' | 'hard';
  result: 'completed' | 'failed';
}

export const BALLOON_COLORS = ['#1D63E8', '#0E9AB8', '#16A34A', '#D97706', '#EC4899', '#8B5CF6'];

export const FRUIT_TYPES = [
  { name: 'Watermelon', emoji: '🍉', color: '#10B981', radius: 34, isBomb: false },
  { name: 'Apple', emoji: '🍎', color: '#EF4444', radius: 28, isBomb: false },
  { name: 'Orange', emoji: '🍊', color: '#F97316', radius: 28, isBomb: false },
  { name: 'Mango', emoji: '🥭', color: '#FBBF24', radius: 30, isBomb: false },
  { name: 'Banana', emoji: '🍌', color: '#EAB308', radius: 30, isBomb: false },
  { name: 'Bomb', emoji: '💣', color: '#475569', radius: 28, isBomb: true },
];

export const MATCH_GESTURES = [
  { name: 'Open_Palm', label: 'Open Palm', emoji: '✋' },
  { name: 'Closed_Fist', label: 'Closed Fist', emoji: '✊' },
  { name: 'Pointing_Up', label: 'Pointing Up', emoji: '☝️' },
  { name: 'Victory', label: 'Victory / Peace', emoji: '✌️' },
  { name: 'Thumb_Up', label: 'Thumb Up', emoji: '👍' },
  { name: 'Thumb_Down', label: 'Thumb Down', emoji: '👎' },
];

export const AIR_DRAW_COLORS = [
  '#1D63E8',
  '#06B6D4',
  '#16A34A',
  '#EF4444',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#FFFFFF',
];
