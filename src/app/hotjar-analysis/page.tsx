'use client';

import { useEffect, useState, useRef } from 'react';
import { ChevronDown, Menu, X, Home, ChevronRight } from 'lucide-react';

export default function HotjarAnalysisPage() {
  const [htmlContent, setHtmlContent] = useState('');
  const [activeSection, setActiveSection] = useState('exec-summary');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const sections = [
    { id: 'exec-summary', title: 'Executive Summary', icon: '📊' },
    { id: 'business-context', title: 'Business Context', icon: '💰' },
    { id: 'buyer-journey', title: 'Buyer Journey', icon: '🛤️' },
    { id: 'five-problems', title: 'Systemic Problems', icon: '⚠️' },
    { id: 'performance', title: 'Performance Dashboard', icon: '📈' },
    { id: 'page-analysis', title: 'Page Analysis', icon: '🔍' },
    { id: 'whats-right', title: 'What Works', icon: '✅' },
    { id: 'site-wide', title: 'Recommendations', icon: '💡' },
    { id: 'page-punch', title: 'Punch List', icon: '📝' },
    { id: 'mobile', title: 'Mobile Strategy', icon: '📱' },
    { id: 'revenue', title: 'Revenue Opportunity', icon: '💵' },
    { id: 'roadmap', title: 'Implementation', icon: '🗺️' },
    { id: 'redirects', title: 'Redirects', icon: '↪️' },
    { id: 'measurement', title: 'Measurement', icon: '📏' },
  ];

  // Load HTML content
  useEffect(() => {
    fetch('/hotjar-analysis-content.html')
      .then(res => res.text())
      .then(html => {
        // Extract body content
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch) {
          setHtmlContent(bodyMatch[1]);
        }
      });
  }, []);

  // Handle scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);

      // Update active section
      const scrollPosition = window.scrollY + 120;
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Inject custom styles after content loads
  useEffect(() => {
    if (htmlContent && contentRef.current) {
      // Add smooth scroll behavior to all anchor links
      const links = contentRef.current.querySelectorAll('a[href^="#"]');
      links.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = link.getAttribute('href')?.substring(1);
          if (targetId) {
            const element = document.getElementById(targetId);
            element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });
    }
  }, [htmlContent]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100; // Account for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Sticky Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-xl border-b border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-md">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">QBTraining.com</div>
                <div className="text-xs text-gray-500 font-medium">Behavioral Analysis</div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden xl:flex items-center space-x-1">
              {sections.slice(0, 7).map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`group relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeSection === section.id
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-1">{section.icon}</span>
                  <span className="hidden 2xl:inline">{section.title}</span>
                  {activeSection === section.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
                  )}
                </button>
              ))}
              <div className="h-6 w-px bg-gray-300 mx-2" />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
              >
                More <ChevronDown className="w-4 h-4 inline ml-1" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile/More Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`flex items-center space-x-3 p-4 rounded-xl text-left transition-all duration-200 ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    <span className="text-2xl">{section.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{section.title}</div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${activeSection === section.id ? 'text-white' : 'text-gray-400'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Progress Bar */}
      <div className="fixed top-16 left-0 right-0 h-1 bg-gray-100 z-40">
        <div
          className="h-full bg-gradient-to-r from-red-500 via-red-600 to-red-500 transition-all duration-150 shadow-lg"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Main Content */}
      <main className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Content Container */}
          <div
            ref={contentRef}
            className="prose prose-lg prose-gray max-w-none prose-headings:scroll-mt-24 prose-h1:text-4xl prose-h1:font-extrabold prose-h1:text-gray-900 prose-h1:mb-6 prose-h1:pb-4 prose-h1:border-b-4 prose-h1:border-red-500 prose-h2:text-3xl prose-h2:font-bold prose-h2:text-gray-800 prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-3 prose-h2:border-b-2 prose-h2:border-gray-200 prose-h3:text-xl prose-h3:font-bold prose-h3:text-red-600 prose-h3:mt-8 prose-h3:mb-3 prose-h3:uppercase prose-h3:tracking-wide prose-h3:border-l-4 prose-h3:border-red-500 prose-h3:pl-4 prose-h4:text-lg prose-h4:font-semibold prose-h4:text-gray-700 prose-h4:mt-6 prose-h4:mb-2 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-strong:font-bold prose-ul:my-4 prose-li:my-2 prose-table:my-8 prose-th:bg-gray-900 prose-th:text-white prose-th:p-3 prose-th:text-left prose-th:font-bold prose-td:p-3 prose-td:border-b prose-td:border-gray-200 prose-tr:hover:bg-gray-50 prose-blockquote:border-l-4 prose-blockquote:border-red-500 prose-blockquote:bg-gray-50 prose-blockquote:p-4 prose-blockquote:italic prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:text-red-600"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </main>

      {/* Floating Action Button - Back to Top */}
      {scrollProgress > 20 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full shadow-2xl hover:shadow-red-500/50 hover:scale-110 transition-all duration-200 z-40 flex items-center justify-center group"
        >
          <svg className="w-6 h-6 transform group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Custom Styles for Injected HTML */}
      <style jsx global>{`
        .cover {
          text-align: center;
          padding: 4rem 1rem;
          margin-bottom: 3rem;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #f8f9fa 100%);
          border-radius: 1.5rem;
          border: 2px solid #e2e8f0;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }
        .stat-card {
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          border: 2px solid #e2e8f0;
          border-radius: 1rem;
          padding: 2rem 1.5rem;
          text-align: center;
          transition: all 0.3s;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
          border-color: #cbd5e0;
        }
        .stat-card .value {
          display: block;
          font-size: 2.5rem;
          font-weight: 800;
          color: #1a1a2e;
          margin-bottom: 0.5rem;
        }
        .stat-card.red .value { color: #e53e3e; }
        .stat-card.green .value { color: #38a169; }
        .stat-card.blue .value { color: #3182ce; }
        .stat-card .label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .big-number {
          background: linear-gradient(135deg, #1a1a2e 0%, #2d3748 100%);
          color: white;
          padding: 3rem 2rem;
          border-radius: 1.5rem;
          text-align: center;
          margin: 3rem 0;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        .big-number .number {
          display: block;
          font-size: 3.5rem;
          font-weight: 800;
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
        }
        .big-number .label {
          font-size: 0.875rem;
          font-weight: 600;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .callout {
          background: linear-gradient(90deg, #fef5f5 0%, #ffffff 100%);
          border-left: 4px solid #e53e3e;
          padding: 1.5rem 1.5rem;
          margin: 1.5rem 0;
          border-radius: 0 0.75rem 0.75rem 0;
          box-shadow: 0 4px 12px rgba(229, 62, 62, 0.08);
        }
        .callout.green {
          background: linear-gradient(90deg, #f0fdf4 0%, #ffffff 100%);
          border-left-color: #38a169;
          box-shadow: 0 4px 12px rgba(56, 161, 105, 0.08);
        }
        .callout.blue {
          background: linear-gradient(90deg, #ebf8ff 0%, #ffffff 100%);
          border-left-color: #3182ce;
          box-shadow: 0 4px 12px rgba(49, 130, 206, 0.08);
        }
        .callout.amber {
          background: linear-gradient(90deg, #fffbeb 0%, #ffffff 100%);
          border-left-color: #d69e2e;
          box-shadow: 0 4px 12px rgba(214, 158, 46, 0.08);
        }
        .journey {
          display: flex;
          align-items: stretch;
          justify-content: center;
          gap: 1rem;
          margin: 2rem 0;
          flex-wrap: wrap;
        }
        .journey-step {
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          border: 2px solid #cbd5e0;
          border-radius: 1rem;
          padding: 2rem 1.5rem;
          text-align: center;
          min-width: 200px;
          flex: 1;
          transition: all 0.3s;
        }
        .journey-step:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
        }
        .journey-step .step-num {
          display: inline-flex;
          align-items: center;
          justify-center;
          width: 3rem;
          height: 3rem;
          background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
          color: white;
          border-radius: 50%;
          font-size: 1.25rem;
          font-weight: 800;
          margin-bottom: 1rem;
          box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3);
        }
        .journey-step .step-title {
          display: block;
          font-weight: 700;
          font-size: 1.125rem;
          color: #1a1a2e;
          margin-bottom: 0.5rem;
        }
        .journey-step .step-desc {
          font-size: 0.875rem;
          color: #4a5568;
          line-height: 1.6;
        }
        .toc {
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          border: 2px solid #e2e8f0;
          border-radius: 1.5rem;
          padding: 2rem;
          margin: 2rem 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        table {
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }
        @media (max-width: 768px) {
          .big-number .number { font-size: 2.5rem; }
          .stat-card .value { font-size: 2rem; }
          .journey { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
