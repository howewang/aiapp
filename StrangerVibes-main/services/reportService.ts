// Powered by OnSpace.AI
import { PersonalityType, PERSONALITY_THEMES } from '@/constants/theme';

export interface DailyReport {
  date: string;
  personality: PersonalityType;
  matchedCount: number;
  argumentsTriggered: number;
  emotionIndex: number; // 0-100
  emotionTrend: 'rising' | 'stable' | 'falling';
  quoteOfDay: string;
  harshestLine: string;
  totalChatMinutes: number;
  topMood: string;
}

const QUOTES: string[] = [
  '每一次相遇，都是宇宙的刻意安排。',
  '真正的交流，不是言语的堆砌，而是灵魂的碰撞。',
  '陌生人有时比熟人更懂你，因为他们看的是你，而不是你的过去。',
  '话说出口的那一刻，你就把自己交给了对方。',
  '沉默也是一种表达，有时候比任何言语都有力量。',
  '遇见一个人，读懂一个世界。',
  '情绪不是弱点，是你还在感受生活的证明。',
  '深夜的对话总是格外真实，因为黑暗让人放下了防备。',
];

const HARSH_LINES: string[] = [
  '你这逻辑，我合理怀疑你是用脚想的。',
  '你说的每一个字我都听懂了，合起来我没懂。',
  '我不是针对你，我是说在场的所有人逻辑都差不多。',
  '这个观点可以，但需要重做。',
  '你的自信从哪里来的，可以借我一点吗？',
  '我理解你在说什么，我不认同，但我理解。',
  '说话之前能不能先过一遍大脑？',
  '你这话说出来，我给你感到不好意思。',
];

const MOODS = ['欢乐爆棚', '平静如水', '情绪高涨', '略带感伤', '充满好奇', '慵懒随意', '认真严肃'];

export function generateDailyReport(personality: PersonalityType, usageCount: number): DailyReport {
  const now = new Date();
  const seed = now.getDate() + now.getMonth() * 31;

  const matchedCount = Math.max(1, Math.floor((usageCount * 2.7 + seed % 5)));
  const argumentsTriggered = Math.floor(matchedCount * 0.15 + seed % 3);
  const emotionIndex = Math.min(99, Math.max(20, 45 + (seed % 40) + (usageCount % 15)));
  const trendOptions: DailyReport['emotionTrend'][] = ['rising', 'stable', 'falling'];
  const emotionTrend = trendOptions[seed % 3];
  const quoteOfDay = QUOTES[seed % QUOTES.length];
  const harshestLine = HARSH_LINES[(seed + usageCount) % HARSH_LINES.length];
  const totalChatMinutes = Math.max(5, matchedCount * 8 + seed % 20);
  const topMood = MOODS[seed % MOODS.length];

  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

  return {
    date: dateStr,
    personality,
    matchedCount,
    argumentsTriggered,
    emotionIndex,
    emotionTrend,
    quoteOfDay,
    harshestLine,
    totalChatMinutes,
    topMood,
  };
}

export function getEmotionLabel(index: number): string {
  if (index >= 80) return '情绪极度高涨';
  if (index >= 60) return '情绪积极活跃';
  if (index >= 40) return '情绪平稳适中';
  if (index >= 20) return '情绪略显低落';
  return '情绪沉静内敛';
}

export function getEmotionColor(index: number): string {
  if (index >= 80) return '#FF6B35';
  if (index >= 60) return '#F1C40F';
  if (index >= 40) return '#2ECC71';
  if (index >= 20) return '#3D84A8';
  return '#8B78FF';
}
