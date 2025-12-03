// Seeded random number generator using mulberry32
export function createSeededRandom(seed: number) {
  let state = seed;

  return function random(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getDailySeed(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  return year * 10000 + month * 100 + day;
}

export function getDateFromSeed(seed: number): Date {
  const year = Math.floor(seed / 10000);
  const month = Math.floor((seed % 10000) / 100);
  const day = seed % 100;
  return new Date(year, month, day);
}

export function shuffleArray<T>(array: T[], random: () => number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function pickRandom<T>(array: T[], random: () => number): T {
  return array[Math.floor(random() * array.length)];
}

export function pickRandomN<T>(array: T[], n: number, random: () => number): T[] {
  return shuffleArray(array, random).slice(0, n);
}
