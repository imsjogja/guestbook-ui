import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const qrOptions = {
  errorCorrectionLevel: 'M' as const,
  margin: 2,
  color: {
    dark: '#0f172a',
    light: '#ffffff',
  },
};

export async function buildQRCodeSvgMarkup(code: string, size = 200): Promise<string> {
  return QRCode.toString(code, {
    ...qrOptions,
    type: 'svg',
    width: size,
  });
}

export async function downloadQRCodeSvg(code: string, filename: string, size = 200) {
  const svg = await buildQRCodeSvgMarkup(code, size);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function QRCodeSVG({ code, size = 200 }: { code: string; size?: number }) {
  const [markup, setMarkup] = useState('');

  useEffect(() => {
    let mounted = true;
    setMarkup('');
    void buildQRCodeSvgMarkup(code, size)
      .then((svg) => {
        if (mounted) setMarkup(svg);
      })
      .catch(() => {
        if (mounted) setMarkup('');
      });

    return () => {
      mounted = false;
    };
  }, [code, size]);

  if (!markup) {
    return <div className="flex items-center justify-center text-xs text-[#94a3b8]" style={{ width: size, height: size }}>Menyiapkan QR...</div>;
  }

  return <div style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: markup }} />;
}
