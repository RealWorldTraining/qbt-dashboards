'use client';

import { useEffect, useState } from 'react';

export default function HotjarAnalysisPage() {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    fetch('/hotjar-analysis-content.html')
      .then(res => res.text())
      .then(html => {
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch) {
          setHtmlContent(bodyMatch[1]);
        }
      });
  }, []);

  if (!htmlContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div 
        className="max-w-5xl mx-auto px-4 py-8"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
