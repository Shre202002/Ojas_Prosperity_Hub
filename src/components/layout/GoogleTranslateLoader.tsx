'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { LANGUAGES } from './LanguageSwitcher';

/** Loads Google's website translator once (hidden); the visible UI is LanguageSwitcher, which sets the googtrans cookie. */
export function GoogleTranslateLoader() {
  // Google re-injects its top banner and offsets <body>; keep both out of the layout.
  useEffect(() => {
    const clean = () => {
      document.querySelectorAll('iframe.skiptranslate, .VIpgJd-ZVi9od-ORHb-OEVmcd').forEach((el) => ((el as HTMLElement).style.display = 'none'));
      if (document.body.style.top) document.body.style.top = '0px';
    };
    clean();
    const observer = new MutationObserver(clean);
    observer.observe(document.body, { childList: true, attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  const init = `function googleTranslateElementInit(){new google.translate.TranslateElement({pageLanguage:'en',includedLanguages:'${LANGUAGES.filter(l => l.code !== 'en').map(l => l.code).join(',')}',autoDisplay:false},'google_translate_element');}`;
  return (
    <>
      <div id="google_translate_element" className="hidden" aria-hidden />
      <Script id="gt-init" strategy="afterInteractive">{init}</Script>
      <Script src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" strategy="afterInteractive" />
    </>
  );
}
