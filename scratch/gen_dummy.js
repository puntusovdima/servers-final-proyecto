import sharp from 'sharp';

async function generate() {
  await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .png()
  .toFile('temp/dummy_signature.png');
  console.log('Dummy PNG created');
}

generate();
