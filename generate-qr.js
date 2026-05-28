import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

const url = 'https://lemon-islands-joke.loca.lt';

async function generate() {
  try {
    // 1. Print QR code to terminal
    const terminalQR = await QRCode.toString(url, { type: 'terminal', small: true });
    console.log('\nScan this QR code with your phone to open the menu:\n');
    console.log(terminalQR);

    // 2. Save QR code as PNG to workspace root
    const workspacePath = path.resolve('qr.png');
    await QRCode.toFile(workspacePath, url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#78350f', // Dark Brown to fit the Crazy Cheesy theme!
        light: '#ffffff'
      }
    });
    console.log(`Saved QR code image to workspace: ${workspacePath}`);

    // 3. Save QR code as PNG to public assets
    const publicPath = path.resolve('public/qr.png');
    await QRCode.toFile(publicPath, url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#78350f',
        light: '#ffffff'
      }
    });
    console.log(`Saved QR code image to public directory: ${publicPath}`);

    // 4. Save QR code as PNG to artifacts directory
    const artifactDir = 'C:/Users/kalea.000/.gemini/antigravity-ide/brain/110a13ce-ab54-47fa-aa9f-9bdf5e3623ae';
    if (fs.existsSync(artifactDir)) {
      const artifactPath = path.join(artifactDir, 'qr.png');
      await QRCode.toFile(artifactPath, url, {
        width: 400,
        margin: 2,
        color: {
          dark: '#78350f',
          light: '#ffffff'
        }
      });
      console.log(`Saved QR code image to artifacts: ${artifactPath}`);
    }
  } catch (err) {
    console.error('Error generating QR code:', err);
  }
}

generate();
