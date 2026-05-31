import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Get local IPv4 address dynamically
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      // Look for non-internal IPv4 addresses (skip typical virtual network IPs like VirtualBox if possible)
      if (iface.family === 'IPv4' && !iface.internal) {
        if (!iface.address.startsWith('192.168.56.') && !iface.address.startsWith('192.168.99.')) {
          return iface.address;
        }
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();
const url = `http://${localIp}:5174`;

async function generate() {
  try {
    console.log(`Generating local QR code for: ${url}`);
    
    // 1. Print QR code to terminal
    const terminalQR = await QRCode.toString(url, { type: 'terminal', small: true });
    console.log('\nScan this QR code with your phone (must be on the same Wi-Fi network) to open the local dev menu:\n');
    console.log(terminalQR);

    // 2. Save QR code as PNG to workspace root
    const workspacePath = path.resolve('qr-local.png');
    await QRCode.toFile(workspacePath, url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#78350f',
        light: '#ffffff'
      }
    });
    console.log(`Saved QR code image to workspace: ${workspacePath}`);

    // 3. Save QR code as PNG to public assets
    const publicPath = path.resolve('public/qr-local.png');
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
    const artifactDir = 'C:/Users/kalea.000/.gemini/antigravity-ide/brain/2e837234-70a9-4b25-9bf3-207087b5306a';
    if (fs.existsSync(artifactDir)) {
      const artifactPath = path.join(artifactDir, 'qr-local.png');
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
    console.error('Error generating local QR code:', err);
  }
}

generate();
