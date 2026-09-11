import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseDoodleTheme, seedHash } from '../src/doodle-theme.ts';
test('themes follow story subjects and prioritize title', () => {
  for (const [title, expected] of [['The Lighthouse at Rest','lighthouse'],['An Open Door','door'],['The Little Lantern','lantern'],['The Patient Ferry','pier']]) {
    assert.equal(chooseDoodleTheme({id:'new-card',title,body:'A quiet afternoon.'}),expected);
  }
  assert.equal(chooseDoodleTheme({id:'new',title:'The Lantern',body:'A door stood beside a boat.'}),'lantern');
});
test('unmatched stories get reproducible, varied fallback themes', () => {
  const card={id:'fixed-id',title:'A Quiet Afternoon',body:'Clouds wandered slowly.'};
  assert.equal(chooseDoodleTheme(card),chooseDoodleTheme({...card}));
  const results=new Set(Array.from({length:200},(_,i)=>chooseDoodleTheme({...card,id:`card-${i}`})));
  assert.equal(results.size,20);
  assert.notEqual(seedHash('card-1'),seedHash('card-2'));
});
test('original postcard artwork stays unchanged when text is edited', () => {
  assert.equal(chooseDoodleTheme({id:'2026-09-10-37996063-2d48-4021-ab7a-aca60c167397',title:'A Lantern',body:'A boat.'}),'door');
});
