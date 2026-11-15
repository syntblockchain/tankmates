const test = require('node:test');
const assert = require('node:assert/strict');
const jsQR = require('jsqr');
const renderInviteQR = require('../public/invite-qr.js');

// A tiny canvas substitute preserves the actual pixels drawn by the production renderer.
function makeCanvas() {
  const canvas = { width: 0, height: 0, pixels: null };
  const context = {
    fillStyle: '',
    fillRect(x, y, width, height) {
      if (!canvas.pixels || canvas.pixels.length !== canvas.width * canvas.height * 4) {
        canvas.pixels = new Uint8ClampedArray(canvas.width * canvas.height * 4);
      }
      const color = this.fillStyle === '#fff' ? 255 : 0;
      for (let row = y; row < y + height; row++) {
        for (let col = x; col < x + width; col++) {
          const i = (row * canvas.width + col) * 4;
          canvas.pixels.set([color, color, color, 255], i);
        }
      }
    },
  };
  canvas.getContext = () => context;
  return canvas;
}

test('QR encodes the exact room invite and can be replaced for another room', () => {
  const canvas = makeCanvas();
  for (const link of [
    'https://syntblockchain.github.io/tankmates/hcfq',
    'https://syntblockchain.github.io/tankmates/abcd',
    'http://localhost:3000/zyxw',
  ]) {
    renderInviteQR(canvas, link);
    assert.equal(jsQR(canvas.pixels, canvas.width, canvas.height).data, link);
    // The quiet zone must stay white for phone scanners.
    assert.deepEqual([...canvas.pixels.slice(0, 4)], [255, 255, 255, 255]);
  }
});
