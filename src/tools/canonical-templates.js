/**
 * @module canonical-templates
 * Deterministic canonical page shells, components, and SVG assets for krusch.dev & homelab.
 */

export const CANONICAL_TEMPLATES = {
  'article-shell': {
    description: 'Canonical article page layout for krusch.dev with cyber-grid, nav-back, article container, and dead-bolt SVG footer.',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}} — Krusch Dev</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="canonical" href="https://krusch.dev/articles/{{SLUG}}.html">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../style.css?v=2.5">
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

  <main class="article-container" style="margin-top: var(--space-6);">
    <a href="/index.html" class="nav-back">← Back to Krusch Dev</a>

    <header class="article-header">
      <div class="project-badges" style="margin-bottom: var(--space-3);">
        <span class="project-badge gold">{{BADGE_1}}</span>
        <span class="project-badge cyan">{{BADGE_2}}</span>
      </div>
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
          <svg class="dead-bolt" viewBox="0 0 96 185" width="16" height="26" aria-label="13-point lightning bolt">
            <polygon points="68,2 26,26 62,32 22,52 58,58 18,78 54,84 14,104 50,110 10,130 46,136 6,180 40,154 74,142 44,128 78,116 48,102 82,90 52,76 86,64 56,50 90,38 60,24 88,14" />
          </svg>
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
  'footer-deadbolt': {
    description: 'Canonical krusch.dev site footer with 13-point SVG dead-bolt logo, socials, and copyright.',
    html: `<footer class="main-footer" style="text-align: center;">
  <div class="footer-brand">
    <a href="/" class="brand-logo" style="text-decoration: none; display: inline-flex; align-items: center; gap: var(--space-2);">
      <span class="logo-icon">
        <svg class="dead-bolt" viewBox="0 0 96 185" width="16" height="26" aria-label="13-point lightning bolt">
          <polygon points="68,2 26,26 62,32 22,52 58,58 18,78 54,84 14,104 50,110 10,130 46,136 6,180 40,154 74,142 44,128 78,116 48,102 82,90 52,76 86,64 56,50 90,38 60,24 88,14" />
        </svg>
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
    description: 'The authoritative 13-point lightning bolt SVG vector polygon.',
    html: `<svg class="dead-bolt" viewBox="0 0 96 185" width="16" height="26" aria-label="13-point lightning bolt">
  <polygon points="68,2 26,26 62,32 22,52 58,58 18,78 54,84 14,104 50,110 10,130 46,136 6,180 40,154 74,142 44,128 78,116 48,102 82,90 52,76 86,64 56,50 90,38 60,24 88,14" />
</svg>`
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
