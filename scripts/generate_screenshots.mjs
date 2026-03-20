// Generatore di screenshot Playwright per l'App Store
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Risoluzione esatta per App Store (iPhone 6.7")
const SCREENSHOT_WIDTH = 1290;
const SCREENSHOT_HEIGHT = 2796;

const screenshots = [
  {
    name: '1_home',
    title: 'Preparati in modo\\nintelligente',
    subtitle: 'La tua carriera nella Pubblica Amministrazione inizia qui',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
    image: 'raw_1.png'
  },
  {
    name: '2_quiz',
    title: "Simula l'esame\\nufficiale",
    subtitle: 'Mettiti alla prova con i quiz aggiornati e scopri il tuo livello',
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    image: 'raw_2.png'
  },
  {
    name: '3_ai_coach',
    title: "Il tuo Tutor\\nSempre Attivo",
    subtitle: "Hai un dubbio? L'Ai Coach ti spiega la risposta corretta",
    gradient: 'linear-gradient(135deg, #064e3b 0%, #0ea5e9 100%)',
    image: 'raw_3.png'
  },
  {
    name: '4_stats',
    title: 'Monitora la\\ntua crescita',
    subtitle: 'Statistiche dettagliate per superare i tuoi limiti',
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #2563eb 100%)',
    image: 'raw_4.png'
  },
  {
    name: '5_classifica',
    title: 'Sfida la\\nClassifica',
    subtitle: 'Competi con altri candidati e scala la vetta',
    gradient: 'linear-gradient(135deg, #7e22ce 0%, #db2777 100%)',
    image: 'raw_5.png'
  }
];

// iPhone 15 Pro Max bezel SVG
const bezelSvg = `
<svg width="1070" height="2170" viewBox="0 0 1070 2170" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="15" y="15" width="1040" height="2140" rx="140" fill="transparent" stroke="#333" stroke-width="30"/>
  <rect x="25" y="25" width="1020" height="2120" rx="130" fill="transparent" stroke="#111" stroke-width="10"/>
  <rect x="350" y="30" width="370" height="100" rx="50" fill="#000"/>
</svg>
`;

async function generateScreenshots() {
  const inputDir = path.join(import.meta.dirname, 'raw');
  const outputDir = path.join(import.meta.dirname, 'out');

  if (!fs.existsSync(inputDir)) fs.mkdirSync(inputDir, { recursive: true });
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  console.log('Avviando il generatore di screenshot per App Store...');
  console.log('Cerco le raw_1.png... raw_5.png in: ' + inputDir);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: SCREENSHOT_WIDTH, height: SCREENSHOT_HEIGHT },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  let generatedCount = 0;

  for (const shot of screenshots) {
    const rawImagePath = path.join(inputDir, shot.image);
    
    if (!fs.existsSync(rawImagePath)) {
      console.log(`[SKIPPED] Immagine mancante: \${shot.image} (devi salvarla in \${inputDir})`);
      continue;
    }

    const imageBase64 = fs.readFileSync(rawImagePath).toString('base64');
    const imageExt = path.extname(rawImagePath).replace('.', '');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
          
          body {
            margin: 0;
            padding: 0;
            width: \${SCREENSHOT_WIDTH}px;
            height: \${SCREENSHOT_HEIGHT}px;
            background: \${shot.gradient};
            font-family: 'Inter', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow: hidden;
            letter-spacing: -1px;
          }

          .header {
            margin-top: 180px;
            text-align: center;
            color: white;
            padding: 0 80px;
            z-index: 10;
          }

          h1 {
            font-size: 110px;
            font-weight: 800;
            line-height: 1.1;
            margin: 0;
            letter-spacing: -2px;
            text-shadow: 0 10px 30px rgba(0,0,0,0.3);
            white-space: pre-line;
          }

          p {
            font-size: 50px;
            font-weight: 400;
            color: rgba(255,255,255,0.9);
            margin-top: 50px;
            line-height: 1.3;
            max-width: 1000px;
          }

          .device-container {
            position: absolute;
            bottom: -50px;
            width: 1070px;
            height: 2170px;
            filter: drop-shadow(0 40px 80px rgba(0,0,0,0.6));
            border-radius: 140px;
            background: #000;
          }

          .device-screen {
            position: absolute;
            top: 25px;
            left: 25px;
            width: 1020px;
            height: 2120px;
            border-radius: 120px;
            overflow: hidden;
            background: #000;
          }

          .device-screen img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: top;
          }

          .bezel {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>\${shot.title}</h1>
          <p>\${shot.subtitle}</p>
        </div>
        
        <div class="device-container">
          <div class="device-screen">
            <img src="data:image/\${imageExt};base64,\${imageBase64}" />
          </div>
          <div class="bezel">
            \${bezelSvg}
          </div>
        </div>
      </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'networkidle' });
    
    // Attendi caricamente font
    await page.evaluate(() => document.fonts.ready);

    const outPath = path.join(outputDir, `\${shot.name}.png`);
    await page.screenshot({ path: outPath });
    console.log(`✅ Fatto!! Screenshot finale salvato in: \${outPath}`);
    generatedCount++;
  }

  await browser.close();
  
  if (generatedCount === 0) {
    console.log('\\n⚠️ Non ho trovato nessuna immagine! Metti raw_1.png... nella cartella raw/');
  } else {
    console.log(`\\n🎉 Finito! Ho generato \${generatedCount} screenshot.`);
  }
}

generateScreenshots().catch(console.error);
