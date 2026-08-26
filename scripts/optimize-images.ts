// muraqib-unreachable: flagged by automated triage. Review before removal.
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

async function optimizeImage(filePath: string, maxKb = 500) {
  const stat = fs.statSync(filePath);
  const kb = Math.round(stat.size / 1024);
  console.log(`Found image: ${filePath} (${kb} KB)`);

  if (kb <= maxKb) {
    console.log('Already under threshold; skipping');
    return false;
  }

  const ext = path.extname(filePath).toLowerCase();
  const tmpPath = filePath + '.opt' + ext;

  try {
    const image = sharp(filePath);
    const meta = await image.metadata();

    // Try a sensible resize + compression based on original dimensions
    let pipeline = image;

    if (meta.width && meta.width > 1200) {
      pipeline = pipeline.resize(Math.round(meta.width * 0.7));
    }

    if (ext === '.png') {
      await pipeline.png({ quality: 80, compressionLevel: 9, palette: true }).toFile(tmpPath);
    } else if (ext === '.jpg' || ext === '.jpeg') {
      await pipeline.jpeg({ quality: 80 }).toFile(tmpPath);
    } else if (ext === '.webp') {
      await pipeline.webp({ quality: 80 }).toFile(tmpPath);
    } else {
      // fallback to webp
      await pipeline.webp({ quality: 80 }).toFile(tmpPath);
    }

    const newStat = fs.statSync(tmpPath);
    const newKb = Math.round(newStat.size / 1024);
    console.log(`Optimized size: ${newKb} KB`);

    if (newKb <= maxKb) {
      fs.renameSync(tmpPath, filePath);
      console.log(`Replaced original with optimized image (${newKb} KB)`);
      return true;
    } else {
      // If not small enough, keep it but also replace (we prefer smaller)
      fs.renameSync(tmpPath, filePath);
      console.log(`Replaced original; optimized size is ${newKb} KB (still larger than threshold)`);
      return true;
    }
  } catch (err) {
    console.error('Image optimization failed', err);
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    return false;
  }
}

async function run() {
  const assetsDir = path.join(process.cwd(), 'public', 'assets');
  if (!fs.existsSync(assetsDir)) {
    console.log('No public/assets directory found; nothing to optimize.');
    return;
  }

  const files = fs.readdirSync(assetsDir).filter(f => /\.(png|jpe?g|webp)$/i.test(f));
  for (const f of files) {
    const p = path.join(assetsDir, f);
    await optimizeImage(p, 500);
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
