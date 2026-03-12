// Powered by OnSpace.AI
export type PersonalityType =
  | 'joyful'
  | 'listener'
  | 'resonance'
  | 'vibe'
  | 'philosopher'
  | 'blunt'
  | 'observer'
  | 'rational'
  | 'highenergy'
  | 'controller'
  | 'soul'
  | 'antiroutine';

export type FreePersonalityType = 'joyful' | 'listener' | 'resonance' | 'vibe' | 'philosopher' | 'blunt';
export type PremiumPersonalityType = 'observer' | 'rational' | 'highenergy' | 'controller' | 'soul' | 'antiroutine';

export const FREE_PERSONALITIES: FreePersonalityType[] = ['joyful', 'listener', 'resonance', 'vibe', 'philosopher', 'blunt'];
export const PREMIUM_PERSONALITIES: PremiumPersonalityType[] = ['observer', 'rational', 'highenergy', 'controller', 'soul', 'antiroutine'];

export interface PersonalityTheme {
  id: PersonalityType;
  name: string;
  tagline: string;
  primary: string;
  secondary: string;
  accent: string;
  gradient: [string, string];
  surface: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  tabBarActive: string;
  emoji: string;
  isPremium: boolean;
}

export const PERSONALITY_THEMES: Record<PersonalityType, PersonalityTheme> = {
  // ── FREE PERSONALITIES ──────────────────────────────────────────
  joyful: {
    id: 'joyful',
    name: '欢脱逗趣型',
    tagline: '笑点低，但你永远笑得最大声',
    primary: '#FF6B35',
    secondary: '#FFB347',
    accent: '#FFD166',
    gradient: ['#FF6B35', '#FFB347'],
    surface: '#1A0900',
    cardBg: '#2A1400',
    textPrimary: '#FFFFFF',
    textSecondary: '#FFD166',
    tabBarActive: '#FF6B35',
    emoji: '🎪',
    isPremium: false,
  },
  listener: {
    id: 'listener',
    name: '慢热倾听型',
    tagline: '话不多，但每句话都值得被听见',
    primary: '#8B78FF',
    secondary: '#6C5CE7',
    accent: '#B8AEFF',
    gradient: ['#6C5CE7', '#8B78FF'],
    surface: '#0A0814',
    cardBg: '#14102A',
    textPrimary: '#FFFFFF',
    textSecondary: '#B8AEFF',
    tabBarActive: '#8B78FF',
    emoji: '🌙',
    isPremium: false,
  },
  resonance: {
    id: 'resonance',
    name: '情绪共鸣型',
    tagline: '你的感受，我都懂',
    primary: '#0096C7',
    secondary: '#0077B6',
    accent: '#48CAE4',
    gradient: ['#0077B6', '#0096C7'],
    surface: '#000D1A',
    cardBg: '#001828',
    textPrimary: '#FFFFFF',
    textSecondary: '#48CAE4',
    tabBarActive: '#0096C7',
    emoji: '💙',
    isPremium: false,
  },
  vibe: {
    id: 'vibe',
    name: '氛围烘托表达型',
    tagline: '任何场合都能炒热气氛',
    primary: '#E91E8C',
    secondary: '#FF6584',
    accent: '#FF99C3',
    gradient: ['#E91E8C', '#FF6584'],
    surface: '#1A0010',
    cardBg: '#2A0020',
    textPrimary: '#FFFFFF',
    textSecondary: '#FF99C3',
    tabBarActive: '#E91E8C',
    emoji: '🎭',
    isPremium: false,
  },
  philosopher: {
    id: 'philosopher',
    name: '深夜哲思型',
    tagline: '凌晨三点，才是真正的灵魂时刻',
    primary: '#3D84A8',
    secondary: '#1B4F72',
    accent: '#7FB3D3',
    gradient: ['#1B4F72', '#3D84A8'],
    surface: '#020810',
    cardBg: '#061022',
    textPrimary: '#FFFFFF',
    textSecondary: '#7FB3D3',
    tabBarActive: '#3D84A8',
    emoji: '🌌',
    isPremium: false,
  },
  blunt: {
    id: 'blunt',
    name: '直言炮筒型',
    tagline: '说真话，哪怕有点辣',
    primary: '#E74C3C',
    secondary: '#C0392B',
    accent: '#FF7675',
    gradient: ['#C0392B', '#E74C3C'],
    surface: '#150200',
    cardBg: '#280500',
    textPrimary: '#FFFFFF',
    textSecondary: '#FF7675',
    tabBarActive: '#E74C3C',
    emoji: '🔥',
    isPremium: false,
  },

  // ── PREMIUM PERSONALITIES ───────────────────────────────────────
  observer: {
    id: 'observer',
    name: '神秘观察者',
    tagline: '沉默是我的语言，观察是我的力量',
    primary: '#9B59B6',
    secondary: '#6C3483',
    accent: '#D7BDE2',
    gradient: ['#6C3483', '#9B59B6'],
    surface: '#0D0010',
    cardBg: '#1A0028',
    textPrimary: '#FFFFFF',
    textSecondary: '#D7BDE2',
    tabBarActive: '#9B59B6',
    emoji: '🔮',
    isPremium: true,
  },
  rational: {
    id: 'rational',
    name: '冷静理性型',
    tagline: '情绪是噪音，逻辑是答案',
    primary: '#00B4D8',
    secondary: '#0077B6',
    accent: '#90E0EF',
    gradient: ['#0077B6', '#00B4D8'],
    surface: '#000F1A',
    cardBg: '#001E30',
    textPrimary: '#FFFFFF',
    textSecondary: '#90E0EF',
    tabBarActive: '#00B4D8',
    emoji: '❄️',
    isPremium: true,
  },
  highenergy: {
    id: 'highenergy',
    name: '高能输出型',
    tagline: '能量满格，话量也满格',
    primary: '#F1C40F',
    secondary: '#F39C12',
    accent: '#FAD7A0',
    gradient: ['#F39C12', '#F1C40F'],
    surface: '#151000',
    cardBg: '#2A2000',
    textPrimary: '#FFFFFF',
    textSecondary: '#FAD7A0',
    tabBarActive: '#F1C40F',
    emoji: '⚡',
    isPremium: true,
  },
  controller: {
    id: 'controller',
    name: '氛围掌控型',
    tagline: '整个对话的节奏，都在我掌心',
    primary: '#2ECC71',
    secondary: '#1A8A4A',
    accent: '#82E0AA',
    gradient: ['#1A8A4A', '#2ECC71'],
    surface: '#011008',
    cardBg: '#012015',
    textPrimary: '#FFFFFF',
    textSecondary: '#82E0AA',
    tabBarActive: '#2ECC71',
    emoji: '🎯',
    isPremium: true,
  },
  soul: {
    id: 'soul',
    name: '灵魂共鸣型',
    tagline: '相遇即缘，句句直达灵魂',
    primary: '#E8A0BF',
    secondary: '#C2577B',
    accent: '#F5CDD9',
    gradient: ['#C2577B', '#E8A0BF'],
    surface: '#150009',
    cardBg: '#280018',
    textPrimary: '#FFFFFF',
    textSecondary: '#F5CDD9',
    tabBarActive: '#E8A0BF',
    emoji: '✨',
    isPremium: true,
  },
  antiroutine: {
    id: 'antiroutine',
    name: '反套路玩家',
    tagline: '你猜不到我下一句说什么',
    primary: '#00D2FF',
    secondary: '#7B2FBE',
    accent: '#FF6B6B',
    gradient: ['#7B2FBE', '#00D2FF'],
    surface: '#060012',
    cardBg: '#0D0028',
    textPrimary: '#FFFFFF',
    textSecondary: '#FF6B6B',
    tabBarActive: '#00D2FF',
    emoji: '🃏',
    isPremium: true,
  },
};

export const BASE_THEME = {
  background: '#080808',
  surface: '#111111',
  border: '#1E1E1E',
  textMuted: '#555555',
  white: '#FFFFFF',
  error: '#FF4444',
  success: '#44CC44',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT = {
  sm: 13,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 36,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

// Achievement definitions
export interface Achievement {
  id: string;
  label: string;
  personality: PersonalityType;
  threshold: number; // consecutive days
  icon: string;
  color: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'dark_enigma', label: '暗黑谜人', personality: 'observer', threshold: 5, icon: '🔮', color: '#9B59B6' },
  { id: 'ice_king', label: '冰川之王', personality: 'rational', threshold: 5, icon: '❄️', color: '#00B4D8' },
  { id: 'big_e', label: '外向E人', personality: 'joyful', threshold: 5, icon: '🎪', color: '#FF6B35' },
  { id: 'night_thinker', label: '深夜思想家', personality: 'philosopher', threshold: 5, icon: '🌌', color: '#3D84A8' },
  { id: 'blunt_master', label: '话痨炮王', personality: 'blunt', threshold: 5, icon: '🔥', color: '#E74C3C' },
  { id: 'soul_connector', label: '灵魂摆渡人', personality: 'soul', threshold: 5, icon: '✨', color: '#E8A0BF' },
  { id: 'vibe_king', label: '氛围天花板', personality: 'vibe', threshold: 5, icon: '🎭', color: '#E91E8C' },
  { id: 'empathy_god', label: '共情大神', personality: 'resonance', threshold: 5, icon: '💙', color: '#0096C7' },
  { id: 'energy_bomb', label: '能量炸弹', personality: 'highenergy', threshold: 5, icon: '⚡', color: '#F1C40F' },
  { id: 'silent_listener', label: '灵魂倾听者', personality: 'listener', threshold: 5, icon: '🌙', color: '#8B78FF' },
  { id: 'scene_master', label: '场控大师', personality: 'controller', threshold: 5, icon: '🎯', color: '#2ECC71' },
  { id: 'chaos_lord', label: '混沌领主', personality: 'antiroutine', threshold: 5, icon: '🃏', color: '#00D2FF' },
];
