<p align="center">
  <img src="docs/banner.png" alt="krusch-frontend-mcp banner" width="800" />
</p>

# krusch-frontend-mcp

> Give your AI agent a design eye — MCP tools for color theory, layout analysis, and design system enforcement.

AI-powered styling assistant [MCP server](https://modelcontextprotocol.io/) that provides deterministic design utilities and RAG-backed design rule retrieval for autonomous frontend development.

## Features

- **8 MCP tools** — mix of deterministic algorithms and LLM-assisted generation
- **42 curated design rules** — WCAG accessibility, Refactoring UI heuristics, typography, spacing, and more
- **Figma token ingestion** — parse design system JSON directly into the RAG store
- **sqlite-vec powered** — high-performance vector search for semantic rule retrieval
- **Fleet-aware Ollama routing** — optional multi-node load balancing for embeddings

## Requirements

- **Node.js 22+**
- **[Ollama](https://ollama.ai/)** running locally (or on a remote host)
- Required Ollama models:
  - `bge-large` — for embedding design rules and tokens
  - `qwen2.5-coder:1.5b` — for layout analysis and component style generation

```bash
ollama pull bge-large
ollama pull qwen2.5-coder:1.5b
```

## Installation

```bash
git clone https://github.com/kruschdev/krusch-frontend-mcp.git
cd krusch-frontend-mcp
npm install
```

### Seed the RAG store

On first run, seed the database with 42 curated design rules:

```bash
npm run seed
```

This is idempotent — running it again safely replaces existing rules.

## Configuration

All configuration is via environment variables. Create a `.env` file or export them directly:

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_URL` | `http://localhost:11434` | Primary Ollama instance URL |
| `OLLAMA_NODES` | *(derived from OLLAMA_URL)* | Comma-separated `host:port` list for fleet routing |
| `EMBED_MODEL` | `bge-large` | Ollama model for embeddings |
| `EMBED_DIMENSION` | `1024` | Embedding vector dimension |
| `DEBUG` | `false` | Enable debug logging |

### Multi-node Ollama fleet

If you have multiple Ollama instances, set `OLLAMA_NODES` for round-robin load balancing on embedding operations:

```bash
export OLLAMA_NODES="localhost:11434,gpu-server:11434,inference-node:11434"
```

## Usage with Claude Desktop / Cursor / etc.

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "krusch-frontend-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/krusch-frontend-mcp/src/index.js"]
    }
  }
}
```

## Tools

### Deterministic (no LLM required)

| Tool | Description |
|------|-------------|
| `generate_color_palette` | HSL math palette generation from a base hex code with WCAG contrast scoring |
| `css_to_tailwind` | AST-based CSS → Tailwind class mapping (~230 entries + shorthand expansion) |
| `generate_css_variables_from_figma` | Parse Figma JSON tokens into a CSS `:root` block with custom properties |
| `generate_responsive_breakpoints` | CSS media query generation with customizable breakpoint widths |

### RAG-powered (requires Ollama for embeddings)

| Tool | Description |
|------|-------------|
| `ingest_figma_tokens` | Embed and store Figma JSON tokens in the vector database |
| `query_design_rules` | Semantic search over 42 curated design rules with optional paradigm filter |

### LLM-assisted (requires Ollama for inference)

| Tool | Description |
|------|-------------|
| `analyze_layout_structure` | HTML → CSS layout analysis (Flexbox vs Grid recommendation) |
| `generate_component_styles` | RAG-enriched component style generation from natural language descriptions |

### Design Rule Paradigms

The `query_design_rules` and `generate_component_styles` tools support an optional `paradigm` filter:

- **`universal`** (35 rules) — WCAG accessibility, spacing scales, typography, color systems, layout patterns, animation timing
- **`refactoring-ui`** (7 rules) — Heuristics from Refactoring UI: hierarchy through weight, de-emphasized borders, visual alignment

## Development

```bash
# Run tests (27 cases)
npm test

# Seed RAG store (idempotent)
npm run seed

# Start MCP server (stdio mode)
npm start
```

## Architecture

```
krusch-frontend-mcp/
├── src/
│   ├── index.js           # MCP server entrypoint (stdio transport)
│   ├── config.js           # Environment-based configuration
│   ├── rag-engine.js       # sqlite-vec vector store + paradigm-aware search
│   ├── lib/
│   │   ├── db.js           # Standalone better-sqlite3 wrapper
│   │   └── llm.js          # Minimal Ollama chat client
│   └── tools/
│       ├── color.js        # HSL/Hex math — palette generation + WCAG contrast
│       ├── tailwind.js     # AST-based CSS → Tailwind class mapping
│       ├── figma.js        # Figma JSON token ingestion + CSS variable generation
│       ├── design-rules.js # RAG-powered design rule retrieval
│       ├── layout.js       # LLM HTML → CSS layout analysis
│       ├── embed.js        # Ollama embedding client (fleet-aware)
│       ├── breakpoints.js  # Responsive breakpoint generator
│       └── component-styles.js # LLM-assisted component style generation
├── scripts/
│   ├── seed-utils.js              # Shared seeding utility
│   ├── seed-design-rules.js       # 29 universal baseline rules
│   ├── ingest-refactoring-ui.js   # 7 Refactoring UI aesthetic rules
│   └── ingest-universal-a11y.js   # 6 extended WCAG/ARIA rules
└── tests/                         # 27 test cases (node:test)
```

## License

MIT
