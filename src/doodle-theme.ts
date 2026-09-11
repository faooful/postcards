export type DoodleTheme = 'lighthouse' | 'door' | 'lantern' | 'pier' | 'bird' | 'flower' | 'kite' | 'teacup' | 'tree' | 'mushroom' | 'mountain' | 'moon' | 'umbrella' | 'balloon' | 'book' | 'key' | 'clock' | 'bicycle' | 'cat' | 'fish';
const themes: DoodleTheme[] = ['lighthouse', 'door', 'lantern', 'pier', 'bird', 'flower', 'kite', 'teacup', 'tree', 'mushroom', 'mountain', 'moon', 'umbrella', 'balloon', 'book', 'key', 'clock', 'bicycle', 'cat', 'fish'];
const existing: Record<string, DoodleTheme> = {
  '2026-09-10-37996063-2d48-4021-ab7a-aca60c167397': 'door',
  '2026-09-10-c4293193-c732-453a-a80b-ec5c6e215d4e': 'lantern',
  '2026-09-10-561a89f5-4a64-4490-8e90-884593098efc': 'pier',
  '2026-09-11-2e8f9e6d-c805-4d12-aca9-9530e9d5a51c': 'lighthouse',
};
const motifs: Record<DoodleTheme, RegExp> = {
  tree: /\b(trees?|forests?|woods?|branches?|orchards?)\b/gi,
  mushroom: /\b(mushrooms?|toadstools?|fungi)\b/gi,
  mountain: /\b(mountains?|peaks?|summits?|hills?)\b/gi,
  moon: /\b(moons?|stars?|constellations?|night)\b/gi,
  umbrella: /\b(umbrellas?|rain|rainy|drizzle)\b/gi,
  balloon: /\b(balloons?)\b/gi,
  book: /\b(books?|pages?|libraries|library|stories)\b/gi,
  key: /\b(keys?|locks?|locksmith)\b/gi,
  clock: /\b(clocks?|watches|watch|hours?|minutes?)\b/gi,
  bicycle: /\b(bicycles?|bikes?|cycling|pedals?)\b/gi,
  cat: /\b(cats?|kittens?)\b/gi,
  fish: /\b(fish|fishes|ponds?|trout)\b/gi,

  bird: /\b(birds?|sparrows?|robins?|wings?|feathers?)\b/gi,
  flower: /\b(flowers?|gardens?|petals?|blossoms?)\b/gi,
  kite: /\b(kites?|ribbons?)\b/gi,
  teacup: /\b(teacups?|tea|teapots?|kettles?)\b/gi,
  lighthouse: /\b(lighthouses?|beacons?|cape|cliffs?)\b/gi,
  door: /\b(doors?|doorways?|gates?|thresholds?|cottages?|houses?)\b/gi,
  lantern: /\b(lanterns?|lamps?|lampposts?|candles?|flames?|embers?)\b/gi,
  pier: /\b(piers?|boats?|ships?|skiffs?|sails?|sailboats?|ferr(?:y|ies|ymen)|dingh(?:y|ies)|docks?)\b/gi,
};
export function seedHash(seed: string): number {
  let value = 2166136261;
  for (const char of seed) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0;
}
export function chooseDoodleTheme(card: {id: string; title: string; body: string}): DoodleTheme {
  if (Object.hasOwn(existing, card.id)) return existing[card.id];
  // Prefer the title's subject. Only fiction is inspected, never work references.
  const scores = themes.map(theme => {
    const pattern = motifs[theme];
    return (card.title.match(pattern)?.length || 0) * 5 + (card.body.match(pattern)?.length || 0);
  });
  const best = Math.max(...scores);
  const candidates = themes.filter((_, index) => scores[index] === best);
  // Also handles stories with no recognized subject. No network or model call.
  return candidates[seedHash(card.id) % candidates.length];
}
