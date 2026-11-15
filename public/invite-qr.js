// Render locally so invite links aren't sent to a third-party QR service.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./vendor/qrcode-generator.js'));
  } else {
    root.renderInviteQR = factory(root.qrcode);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (qrcode) {
  return function renderInviteQR(canvas, link) {
    const qr = qrcode(0, 'M');
    qr.addData(link, 'Byte');
    qr.make();

    // Four white modules around the symbol are required for reliable scanning.
    const quiet = 4;
    const scale = 6;
    const count = qr.getModuleCount();
    canvas.width = canvas.height = (count + quiet * 2) * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.isDark(row, col)) ctx.fillRect((col + quiet) * scale, (row + quiet) * scale, scale, scale);
      }
    }
  };
}));
