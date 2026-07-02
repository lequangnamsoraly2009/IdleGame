const fs = require('fs');
const path = require('path');
const JimpLib = require('jimp');
const Jimp = JimpLib.Jimp || JimpLib;

const srcDir = 'C:\\Users\\lequa\\.gemini\\antigravity-ide\\brain\\e054a939-c7a8-43ae-a3be-1e665ca96b86';
const destFile = path.join(__dirname, 'test_excalibur_perfect.png');

async function test() {
  const files = fs.readdirSync(srcDir);
  const excaliburFile = files.find(f => f.startsWith('t_wpn_excalibur_') && f.endsWith('.png'));
  if (!excaliburFile) {
    console.log("Original Excalibur file not found!");
    return;
  }
  const srcPath = path.join(srcDir, excaliburFile);
  console.log(`Reading original excalibur from ${srcPath}...`);
  const image = await Jimp.read(srcPath);

  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    
    const whiteness = Math.min(r, g, b);
    const t1 = 200; // start blending at 200
    const t2 = 254; // fully transparent at 254
    
    if (whiteness > t1) {
      if (whiteness >= t2) {
        this.bitmap.data[idx + 3] = 0;
      } else {
        const alphaFactor = 1 - (whiteness - t1) / (t2 - t1);
        const newAlpha = Math.floor(alphaFactor * 255);
        this.bitmap.data[idx + 3] = newAlpha;
        
        const a = newAlpha / 255;
        if (a > 0) {
          this.bitmap.data[idx + 0] = Math.max(0, Math.min(255, Math.round((r - (1 - a) * 255) / a)));
          this.bitmap.data[idx + 1] = Math.max(0, Math.min(255, Math.round((g - (1 - a) * 255) / a)));
          this.bitmap.data[idx + 2] = Math.max(0, Math.min(255, Math.round((b - (1 - a) * 255) / a)));
        }
      }
    }
  });

  image.resize({ w: 64, h: 64 });
  await image.write(destFile);
  console.log(`Success! Saved perfect transparent excalibur to: ${destFile}`);
}

test().catch(console.error);
