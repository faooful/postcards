export class PostcardError extends Error {}
const reject = (message) => { throw new PostcardError(message); };

export function inlineTokens(text) {
  const tokens = [];
  const pattern = /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
  let start = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > start) tokens.push({ type: 'text', text: text.slice(start, match.index) });
    tokens.push({ type: match[1] ? 'strong' : 'em', text: match[1] || match[2] });
    start = match.index + match[0].length;
  }
  if (start < text.length) tokens.push({ type: 'text', text: text.slice(start) });
  return tokens;
}

export function parsePostcard(source) {
  if (typeof source !== 'string' || source.length > 12000) reject('Postcard is missing or too large.');
  source = source.replace(/\r\n/g, '\n');
  if (/[\x00-\x08\x0b-\x1f\x7f\u202a-\u202e\u2066-\u2069]/.test(source)) reject('Control characters are not allowed.');
  const match = /^---\n([\s\S]+?)\n---\n([\s\S]+)$/.exec(source);
  if (!match) reject('Expected title, date, and sender frontmatter.');
  const fields = {};
  for (const line of match[1].split('\n')) {
    const field = /^(title|date|sender|reference|created): (.+)$/.exec(line);
    if (!field || Object.hasOwn(fields, field[1])) reject('Unknown, duplicate, or malformed metadata.');
    fields[field[1]] = field[2].trim();
  }
  if (!fields.title || !fields.date || !fields.sender) reject('Title, date, and sender are required.');
  if (!/^[\p{L}\p{N} ,.!?‘’'“”()—–-]{1,100}$/u.test(fields.title)) reject('Title must be plain text, up to 100 characters.');
  const sender = ({ pi: 'Pi', codex: 'Codex', claude: 'Claude', 'claude code': 'Claude' })[fields.sender.toLowerCase()];
  if (!sender) reject('Sender must be Codex, Claude, or Pi.');
  if (fields.reference !== undefined && !/^[\p{L}\p{N} ,.!?‘’'“”()—–-]{3,100}$/u.test(fields.reference)) reject('Reference must be plain text, 3–100 characters.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.date) || !Number.isFinite(Date.parse(fields.date)) || new Date(fields.date).toISOString().slice(0, 10) !== fields.date) reject('Date must be a real YYYY-MM-DD date.');
  if (fields.created && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(fields.created) || !Number.isFinite(Date.parse(fields.created)))) reject('Created must be a valid UTC timestamp.');
  const body = match[2].trim();
  const words = body.split(/\s+/).filter(Boolean).length;
  if (words < 20 || words > 150) reject('Body must contain 20–150 words; aim for 60–100.');
  if (/[<>`\[\]{}\\]/.test(body) || /!\[|(^|\n)(?:\s{4}|\t|\s*(?:#{1,6}\s|>\s|[-+*]\s|\d+[.)]\s|---\s*$))/m.test(body)) reject('Only paragraphs and asterisk emphasis are allowed.');
  if (inlineTokens(body).some(token => token.type === 'text' && /[*_]/.test(token.text))) reject('Use balanced asterisks for emphasis.');
  const content = `${fields.title}\n${fields.reference || ''}\n${body}`;
  const sensitive = [
    /(?:https?:\/\/|www\.|mailto:)/i,
    /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i,
    /\b[\w-]+\.(?:com|org|net|io|ai|dev|design|internal|local)\b/i,
    /(?:^|\s)(?:\/(?:[^\s/]+\/)*[^\s]*|~\/|[A-Z]:\\)/m,
    /\b(?:sk-[a-z0-9_-]{8,}|gh[pousr]_[a-z0-9_]+|github_pat_[a-z0-9_]+|AKIA[A-Z0-9]{16})\b/i,
    /(?:api[_ -]?key|password|secret|token)\s*[:=]/i,
    /\b[A-Za-z0-9+/_=-]{32,}\b/,
    /\b\d{1,3}(?:\.\d{1,3}){3}\b/,
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
    /\b[\w.-]+\.(?:tsx?|jsx?|py|md|json|env|csv|sql)\b/i,
    /(?:\+?\d[\d ().-]*){9,}/
  ];
  if (sensitive.some(pattern => pattern.test(content))) reject('Potential private information or external reference detected.');
  return { title: fields.title, date: fields.date, sender, created: fields.created || '', reference: fields.reference || '', body };
}
