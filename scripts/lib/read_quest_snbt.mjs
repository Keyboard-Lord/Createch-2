import assert from 'node:assert/strict';

// Structural reader for authored FTB quest SNBT. Commas are optional in FTB
// files; quoted strings are opaque so nested item/task IDs cannot become quests.
export function readQuestSnbt(text, file = '<SNBT>') {
  let index = 0;
  const fail = message => { throw new Error(`${file}:${index}: ${message}`); };
  function skip() {
    while (index < text.length) {
      if (/\s/.test(text[index])) index++;
      else if (text.startsWith('//', index) || text[index] === '#') {
        while (index < text.length && text[index] !== '\n') index++;
      } else break;
    }
  }
  function quoted() {
    const quote = text[index++];
    let value = '';
    while (index < text.length) {
      const char = text[index++];
      if (char === quote) return value;
      if (char === '\\') {
        if (index === text.length) fail('Unterminated escape');
        const escape = text[index++];
        value += ({n: '\n', r: '\r', t: '\t'})[escape] ?? escape;
      } else value += char;
    }
    fail('Unterminated string');
  }
  function bare(key = false) {
    const start = index;
    while (index < text.length && !/[\s{},\[\]]/.test(text[index]) && !(key && text[index] === ':')) index++;
    if (index === start) fail('Expected token');
    return text.slice(start, index);
  }
  function value() {
    skip();
    if (text[index] === '"' || text[index] === "'") return quoted();
    if (text[index] === '{') {
      index++;
      const object = Object.create(null);
      while (true) {
        skip();
        if (text[index] === '}') { index++; return object; }
        const key = text[index] === '"' || text[index] === "'" ? quoted() : bare(true);
        skip();
        if (text[index++] !== ':') fail('Expected colon');
        assert(!Object.hasOwn(object, key), `${file}: duplicate key ${key}`);
        object[key] = value();
        skip();
        if (text[index] === ',') index++;
      }
    }
    if (text[index] === '[') {
      index++;
      const array = [];
      while (true) {
        skip();
        if (text[index] === ']') { index++; return array; }
        array.push(value());
        skip();
        if (text[index] === ',') index++;
      }
    }
    return bare();
  }
  const result = value();
  skip();
  if (index !== text.length) fail('Unexpected trailing content');
  return result;
}
