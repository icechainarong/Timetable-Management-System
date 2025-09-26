import React, { useEffect } from 'react';
import type { PrintSettings } from '../types';

const FONT_MAP: Record<string, string> = {
    'Sarabun': "'Sarabun', sans-serif",
    'Sans': "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
};

interface DynamicPrintStylesProps {
  settings: PrintSettings;
}

export const DynamicPrintStyles: React.FC<DynamicPrintStylesProps> = ({ settings }) => {
  useEffect(() => {
    const styleId = 'dynamic-print-styles';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    const { paperSize, orientation, marginTop, marginBottom, marginLeft, marginRight, fontFamily } = settings;
    
    const selectedFont = FONT_MAP[fontFamily] || FONT_MAP['Sarabun'];

    const styleContent = `
      @media print {
        @page {
          size: ${paperSize} ${orientation};
          margin: ${marginTop}cm ${marginRight}cm ${marginBottom}cm ${marginLeft}cm;
        }
        .printable-container {
            font-family: ${selectedFont};
        }
      }
      /* Apply font to screen preview as well */
      .printable-container {
        font-family: ${selectedFont};
      }
    `;

    if (styleTag.innerHTML !== styleContent) {
        styleTag.innerHTML = styleContent;
    }

  }, [settings]);

  return null; // This component does not render anything
};