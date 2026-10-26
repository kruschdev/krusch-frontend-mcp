/**
 * @module canonical-templates
 * Deterministic canonical page shells, components, and SVG assets for krusch.dev & homelab.
 */

export const STEALIE_BOLT_POINTS =
  '121,2 79,25 93,28 48,50 78,53 19,89 58,85 5,128 44,124 5,158 34,155 4,212 47,191 35,186 70,171 52,168 105,139 66,140 123,103 74,105 128,69 86,69 126,35 102,36';

const ALT_FAVICON_DATA_URI =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%22-44 -3 220 220%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%2278%25%22 y1=%224%25%22 x2=%2218%25%22 y2=%2296%25%22%3E%3Cstop offset=%220%25%22 stop-color=%22%236ff1fe%22/%3E%3Cstop offset=%2248%25%22 stop-color=%22%237be8ff%22/%3E%3Cstop offset=%2272%25%22 stop-color=%22%238b6eff%22/%3E%3Cstop offset=%22100%25%22 stop-color=%22%23d946ef%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpolygon points=%22' +
  STEALIE_BOLT_POINTS +
  '%22 fill=%22url(%23g)%22 stroke=%22%23ffffff%22 stroke-width=%223%22 stroke-linejoin=%22round%22/%3E%3C/svg%3E';

function renderDeadBoltSvg(suffix, indent = '') {
  const gId = `boltGrad-${suffix}`;
  const rId = `boltRim-${suffix}`;
  return `<svg class="dead-bolt" viewBox="0 -2 132 218" width="16" height="26" aria-label="13-point lightning bolt">
${indent}  <defs>
${indent}    <linearGradient id="${gId}" x1="78%" y1="4%" x2="18%" y2="96%"><stop offset="0%" stop-color="#6ff1fe"/><stop offset="24%" stop-color="#37e1ff"/><stop offset="48%" stop-color="#7be8ff"/><stop offset="72%" stop-color="#8b6eff"/><stop offset="90%" stop-color="#9d4edd"/><stop offset="100%" stop-color="#d946ef"/></linearGradient>
${indent}    <linearGradient id="${rId}" x1="80%" y1="0%" x2="15%" y2="100%"><stop offset="0%" stop-color="#bef8ff"/><stop offset="45%" stop-color="#ffffff"/><stop offset="80%" stop-color="#f5d0fe"/><stop offset="100%" stop-color="#fae8ff"/></linearGradient>
${indent}  </defs>
${indent}  <polygon points="${STEALIE_BOLT_POINTS}" fill="url(#${gId}) #37e1ff" stroke="url(#${rId})" stroke-width="2.6" stroke-linejoin="round" />
${indent}</svg>`;
}

export const CANONICAL_TEMPLATES = {
  'article-shell': {
    description: 'Canonical article page layout for krusch.dev with cyber-grid, nav-back, article container, and dead-bolt SVG footer.',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}} — Krusch Dev</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=20261025">
  <link rel="alternate icon" href="${ALT_FAVICON_DATA_URI}">
  <link rel="canonical" href="https://krusch.dev/articles/{{SLUG}}.html">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../style.css?v=20261025-bolt">
  <style>
    .article-container {
      max-width: 980px;
      margin: 0 auto var(--space-8) auto;
      background: var(--panel-bg);
      border: 1px solid var(--panel-border);
      backdrop-filter: var(--glass-filter);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      box-shadow: var(--shadow-lg);
    }
    .nav-back {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--accent-cyan);
      text-decoration: none;
      font-weight: 500;
      margin-bottom: var(--space-5);
      transition: transform 0.2s ease;
    }
    .nav-back:hover {
      transform: translateX(-4px);
    }
    .article-header {
      margin-bottom: var(--space-5);
    }
    .article-title {
      font-family: var(--font-display);
      font-size: clamp(1.85rem, 3.8vw, 2.55rem);
      font-weight: 800;
      line-height: 1.22;
      background: linear-gradient(135deg, #ffffff 0%, var(--accent-cyan) 60%, var(--accent-violet) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: var(--space-3);
    }
    .article-subhead {
      font-size: 1.12rem;
      color: var(--text-secondary);
      line-height: 1.55;
      margin-bottom: var(--space-4);
    }
    .article-meta {
      display: flex;
      gap: var(--space-4);
      color: var(--text-muted);
      font-size: 0.9rem;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: var(--space-5);
      border-bottom: 1px solid var(--panel-border);
      padding-bottom: var(--space-4);
    }
  </style>
</head>
<body>
  <div class="cyber-grid"></div>

  <header class="site-header">
    <nav class="site-nav" aria-label="Primary Navigation">
      <a href="/" class="site-brand">
        ${renderDeadBoltSvg('1', '        ')}
        <span class="site-brand-text">KRUSCH<span>.DEV</span></span>
      </a>
      <div class="site-nav-links">
        <a href="/articles/" class="site-nav-link">Publications</a>
        <a href="/sovereign/" class="site-nav-link">On-Prem Specs</a>
        <a href="/resume.html" class="site-nav-link">Resume</a>
        <a href="/contact.html" class="site-nav-cta">Engage →</a>
      </div>
    </nav>
  </header>

  <main class="article-container" style="margin-top: var(--space-6);">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: var(--space-5);">
      <a href="/" class="nav-back" style="margin-bottom: 0;">← Back to Architect Hub</a>
      <a href="/articles/" class="nav-back" style="margin-bottom: 0;">All Systems Papers →</a>
    </div>

    <header class="article-header">
      <h1 class="article-title">{{TITLE}}</h1>
      <p class="article-subhead">{{SUBHEAD}}</p>
      <div class="article-meta">
        <span>By <strong>Kevin Ruschman</strong></span>
        <span>•</span>
        <span>{{DATE}}</span>
        <span>•</span>
        <span>{{READ_TIME}} min read</span>
      </div>
    </header>

    <article class="article-body">
      {{CONTENT}}
    </article>
  </main>

  <footer class="main-footer" style="text-align: center;">
    <div class="footer-brand">
      <a href="/" class="brand-logo" style="text-decoration: none; display: inline-flex; align-items: center; gap: var(--space-2);">
        <span class="logo-icon">
          ${renderDeadBoltSvg('2', '          ')}
        </span>
        <span class="logo-text" style="font-family: var(--font-display); font-weight: 700; letter-spacing: 0.1em; color: var(--text-primary);">KRUSCH<span style="color: var(--accent-cyan);">.DEV</span></span>
      </a>
    </div>
    <p>Engineering sovereign, deterministic AI infrastructure &amp; open-source agent tooling.</p>
    <p>Follow along on <a href="https://github.com/kruschdev" target="_blank" rel="noopener" style="color: var(--accent-cyan); text-decoration: none;">GitHub (@kruschdev)</a>, <a href="https://www.linkedin.com/in/kevin-saylor-ruschman-1080493a3/" target="_blank" rel="noopener" style="color: var(--accent-cyan); text-decoration: none;">LinkedIn</a> &amp; <a href="https://x.com/Kev96790724" target="_blank" rel="noopener" style="color: var(--accent-cyan); text-decoration: none;">X (@Kev96790724)</a>.</p>
    <p class="copyright">&copy; 2026 krusch.dev · Kevin Ruschman. All rights reserved.</p>
  </footer>
</body>
</html>`
  },
  'site-header': {
    description: 'Standardized krusch.dev sticky top navigation header with 13-point dead-bolt SVG and 4 top-level links.',
    html: `<header class="site-header">
  <nav class="site-nav" aria-label="Primary Navigation">
    <a href="/" class="site-brand">
      ${renderDeadBoltSvg('hdr', '      ')}
      <span class="site-brand-text">KRUSCH<span>.DEV</span></span>
    </a>
    <div class="site-nav-links">
      <a href="/articles/" class="site-nav-link">Publications</a>
      <a href="/sovereign/" class="site-nav-link">On-Prem Specs</a>
      <a href="/resume.html" class="site-nav-link">Resume</a>
      <a href="/contact.html" class="site-nav-cta">Engage →</a>
    </div>
  </nav>
</header>`
  },
  'footer-deadbolt': {
    description: 'Canonical krusch.dev site footer with 13-point SVG dead-bolt logo, socials, and copyright.',
    html: `<footer class="main-footer" style="text-align: center;">
  <div class="footer-brand">
    <a href="/" class="brand-logo" style="text-decoration: none; display: inline-flex; align-items: center; gap: var(--space-2);">
      <span class="logo-icon">
        ${renderDeadBoltSvg('ftr', '        ')}
      </span>
      <span class="logo-text" style="font-family: var(--font-display); font-weight: 700; letter-spacing: 0.1em; color: var(--text-primary);">KRUSCH<span style="color: var(--accent-cyan);">.DEV</span></span>
    </a>
  </div>
  <p>Engineering sovereign, deterministic AI infrastructure &amp; open-source agent tooling.</p>
  <p>Follow along on <a href="https://github.com/kruschdev" target="_blank" rel="noopener" style="color: var(--accent-cyan); text-decoration: none;">GitHub (@kruschdev)</a>, <a href="https://www.linkedin.com/in/kevin-saylor-ruschman-1080493a3/" target="_blank" rel="noopener" style="color: var(--accent-cyan); text-decoration: none;">LinkedIn</a> &amp; <a href="https://x.com/Kev96790724" target="_blank" rel="noopener" style="color: var(--accent-cyan); text-decoration: none;">X (@Kev96790724)</a>.</p>
  <p class="copyright">&copy; 2026 krusch.dev · Kevin Ruschman. All rights reserved.</p>
</footer>`
  },
  'deadbolt-svg': {
    description: 'The authoritative 13-point Grateful Dead Stealie lightning bolt SVG vector polygon.',
    html: renderDeadBoltSvg('standalone', '')
  },
  'cyber-grid': {
    description: 'Background cyber grid container element.',
    html: `<div class="cyber-grid"></div>`
  },
  'nav-back': {
    description: 'Back navigation link arrow with translateX hover animation.',
    html: `<a href="/index.html" class="nav-back">← Back to Krusch Dev</a>`
  }
};

/**
 * Retrieve a canonical template by key
 * @param {string} templateKey
 * @returns {{ key: string, description: string, html: string }}
 */
export function getCanonicalTemplate(templateKey) {
  const tpl = CANONICAL_TEMPLATES[templateKey];
  if (!tpl) {
    const available = Object.keys(CANONICAL_TEMPLATES).join(', ');
    throw new Error(`Unknown template '${templateKey}'. Available templates: ${available}`);
  }
  return {
    key: templateKey,
    description: tpl.description,
    html: tpl.html
  };
}

export function listCanonicalTemplates() {
  return Object.entries(CANONICAL_TEMPLATES).map(([key, val]) => ({
    key,
    description: val.description
  }));
}
