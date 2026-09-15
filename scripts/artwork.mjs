export const themes = ['lighthouse', 'door', 'lantern', 'pier', 'bird', 'flower', 'kite', 'teacup', 'tree', 'mushroom', 'mountain', 'moon', 'umbrella', 'balloon', 'book', 'key', 'clock', 'bicycle', 'cat', 'fish', 'snail', 'fox', 'rabbit', 'butterfly', 'bee', 'shell', 'bridge', 'windmill', 'telescope', 'violin', 'suitcase', 'fountain'];
const existing = {
  '2026-09-10-37996063-2d48-4021-ab7a-aca60c167397': 'door',
  '2026-09-10-c4293193-c732-453a-a80b-ec5c6e215d4e': 'lantern',
  '2026-09-10-561a89f5-4a64-4490-8e90-884593098efc': 'pier',
  '2026-09-11-2e8f9e6d-c805-4d12-aca9-9530e9d5a51c': 'lighthouse',
};
const motifs = {
  snail: /\b(snails?|shell trail)\b/gi, fox: /\b(fox|foxes)\b/gi,
  rabbit: /\b(rabbits?|hares?|bunnies)\b/gi, butterfly: /\b(butterflies|butterfly)\b/gi,
  bee: /\b(bees?|honey|hives?)\b/gi, shell: /\b(shells?|seashells?)\b/gi,
  bridge: /\b(bridges?)\b/gi, windmill: /\b(windmills?|mills?)\b/gi,
  telescope: /\b(telescopes?|observatory|astronomers?)\b/gi, violin: /\b(violins?|fiddles?)\b/gi,
  suitcase: /\b(suitcases?|luggage|trunks?)\b/gi, fountain: /\b(fountains?)\b/gi,
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
export function seedHash(seed) {
  let value = 2166136261;
  for (const char of seed) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0;
}
export function chooseDoodleTheme(card) {
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

export const validArtwork = value => typeof value === 'string' && /^v1\/[a-z]+\/[012]$/.test(value) && themes.includes(value.split('/')[1]);
export const chronological = (a,b) => (a.created || a.date || '').localeCompare(b.created || b.date || '') || a.id.localeCompare(b.id);
export function selectArtwork(card, history = []) {
  const recent = [...history].sort(chronological).reverse().slice(0,12);
  const usage = theme => recent.filter(c => (c.artwork?.split('/')[1] || chooseDoodleTheme(c)) === theme).length;
  const scores = themes.map(theme => (card.title.match(motifs[theme])?.length || 0)*5 + (card.body.match(motifs[theme])?.length || 0));
  const best = Math.max(...scores);
  let candidates = themes.filter((_,i) => scores[i] === best);
  const least = Math.min(...candidates.map(usage));
  candidates = candidates.filter(theme => usage(theme) === least);
  const theme = candidates[seedHash(card.id) % candidates.length];
  const ids = [0,1,2].map(n => `v1/${theme}/${n}`);
  const age = id => { const i=recent.findIndex(c => c.artwork === id); return i < 0 ? Infinity : i; };
  const oldest = Math.max(...ids.map(age));
  const choices = ids.filter(id => age(id) === oldest);
  return choices[seedHash(card.id + ':composition') % choices.length];
}
