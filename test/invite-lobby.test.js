const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Exercise the actual lobby callbacks without needing PeerJS or a browser connection.
test('lobby keeps the QR and copied invite in sync across room updates and leave/rejoin', () => {
  class Element {
    constructor() {
      this.style = {};
      this.classList = { toggle() {}, add() {}, remove() {} };
      this.listeners = {};
      this.children = [];
      this.value = '';
    }
    addEventListener(event, fn) { this.listeners[event] = fn; }
    replaceChildren(...children) { this.children = children; }
    querySelector() { return new Element(); }
    getContext() { return {}; }
    setAttribute() {}
  }
  const elements = new Map();
  const get = (id) => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  };
  const handlers = {};
  let nextRoom = 'HCFQ';
  const payload = (code) => ({ ok: true, roomCode: code, playerId: 'p1', hostId: 'p1', players: [] });
  const socket = {
    on(event, fn) { handlers[event] = fn; },
    emit(event, callback) { if (event === 'createRoom') callback(payload(nextRoom)); },
  };
  const rendered = [];
  const window = {
    TankmatesNet: { createNet: () => socket },
    addEventListener() {},
    renderInviteQR(canvas, link) { assert.equal(canvas, get('invite-qr')); rendered.push(link); },
  };
  const context = {
    window,
    document: {
      getElementById: get,
      createElement: () => new Element(),
      body: new Element(),
    },
    location: { origin: 'https://syntblockchain.github.io', pathname: '/tankmates/', search: '' },
    history: { replaceState() {} },
    localStorage: { getItem: () => null },
    Audio: class { addEventListener() {} pause() {} },
    requestAnimationFrame() {},
    URLSearchParams,
    setTimeout,
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../public/client.js'), 'utf8'), context);
  get('create-btn').listeners.click();
  const first = 'https://syntblockchain.github.io/tankmates/hcfq';
  assert.equal(get('share-link').value, first);
  assert.deepEqual(rendered, [first]);
  handlers.lobbyUpdate(payload('HCFQ'));
  assert.equal(rendered.length, 1, 'unchanged lobby updates do not regenerate the QR');
  handlers.lobbyUpdate(payload('ABCD'));
  assert.equal(get('share-link').value, 'https://syntblockchain.github.io/tankmates/abcd');
  assert.equal(rendered.at(-1), get('share-link').value);
  get('leave-btn').listeners.click();
  assert.equal(get('share-link').value, '');
  nextRoom = 'HCFQ';
  get('create-btn').listeners.click();
  assert.equal(rendered.at(-1), first);
  assert.equal(rendered.length, 3);
});
