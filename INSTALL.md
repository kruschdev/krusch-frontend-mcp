# Install `krusch-frontend-mcp`

These are instructions for a coding agent (Claude Code, Codex, Cursor, Windsurf, or Antigravity) that a person asked to install and configure `krusch-frontend-mcp` on their machine or inside their IDE.

`krusch-frontend-mcp` is a Node.js `>= 22.0.0` frontend styling, layout analysis, color theory, and canonical template MCP server exposing 12 annotated tools: 6 deterministic primitives (WCAG/HSL color math, AST CSS-to-Tailwind compilation, Figma JSON-to-CSS variable parsing, responsive breakpoint generation, and 16 bit-for-bit HTML/SVG/Vercel/Lego starter templates), 4 `sqlite-vec` + SQLite `FTS5` (`BM25`) hybrid Reciprocal Rank Fusion design-rule and provenance tools (with automatic offline `FTS5` fallback), and 2 local-LLM layout and component style generators.

## 1. Check Prerequisites First (All at Once)

Run one read-only check before making any changes:

```bash
id -u
node -v 2>/dev/null || echo "MISSING: node"
npm -v 2>/dev/null || echo "MISSING: npm"
git --version 2>/dev/null || echo "MISSING: git"
ollama --version 2>/dev/null || echo "OPTIONAL_MISSING: ollama"
```

Evaluate the results:
1. **User check**: If `id -u` prints `0` (root), stop and ask the person to run you under a normal non-root user account.
2. **Node.js `>= 22.0.0` (Required)**: If `node -v` is missing or older than `v22.0.0`, ask the person before installing or switching to Node 22 (`nvm install 22` or `fnm use 22`).
3. **Ollama (Strictly Optional)**: Not needed for Mode A. All deterministic tools, all 16 canonical templates, and offline `FTS5` lexical search over all 48 curated design rules work with zero local LLM runtime.

## 2. Choose the Right Setup Mode

- **Mode A: Zero-Ollama Offline Deterministic & `FTS5` Setup (Recommended Default)**: Installs dependencies, seeds all 48 curated WCAG, Refactoring UI, and Vercel design rules into `memory.db` with automatic offline `FTS5` fallback, runs all `48` automated tests, and registers the stdio MCP server at `$0.00` with zero model downloads.
- **Mode B: Full Hybrid `sqlite-vec` RAG + Local Ollama Component Generator (Only After Confirming with the Person)**: Pulls `snowflake-arctic-embed2` (`1024`-dim embeddings) and `qwen2.5-coder:7b` via Ollama, seeds dense vectors alongside `FTS5`, verifies tests, and enables live local LLM layout/style synthesis.

## 3. Install & Verify

### Mode A: Zero-Ollama Offline Deterministic & `FTS5` Setup (Default)

Clone into the current directory (or `~/src/krusch-frontend-mcp` if the current directory is `$HOME` or another unrelated repo; check `pwd` first):

```bash
git clone https://github.com/kruschdev/krusch-frontend-mcp.git
cd krusch-frontend-mcp
npm install
[ -f .env ] || cp .env.example .env
```

Seed the 48 curated design rules (`universal`, `refactoring-ui`, and `vercel` paradigms) and run the test suite:

```bash
npm run seed
npm test
```

*(Note: When Ollama is offline, `npm run seed` logs an expected fallback notice and inserts zero-vector placeholders while indexing all 48 rules cleanly into SQLite `FTS5` so `query_design_rules` works immediately offline.)*

### Mode B: Full Hybrid `sqlite-vec` RAG + LLM Component Generator (Confirm Before Pulling Models)

Only run this mode if Ollama is installed and the person confirms they want to download `snowflake-arctic-embed2` and `qwen2.5-coder:7b`:

```bash
# Confirm Ollama is reachable on http://localhost:11434 first, then pull models:
ollama pull snowflake-arctic-embed2
ollama pull qwen2.5-coder:7b

# Re-seed idempotently to populate 1024-dim dense vectors alongside FTS5
npm run seed
npm test
```

## 4. Connect to the Person's Coding Agent / IDE

Resolve the checkout's absolute path with `pwd`, then merge the `krusch-frontend-mcp` stdio entry into the person's active MCP client configuration without removing any existing MCP servers:

- **Claude Code CLI**:
  ```bash
  claude mcp add krusch-frontend-mcp -- node /absolute/path/to/krusch-frontend-mcp/src/index.js
  ```
- **Cursor (`~/.cursor/mcp.json`), Windsurf (`~/.codeium/windsurf/mcp_config.json`), Claude Desktop, or Antigravity (`~/.gemini/antigravity/mcp_config.json`)**:
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
- **Codex (`~/.codex/config.toml`)**:
  ```toml
  [mcp_servers.krusch-frontend-mcp]
  command = "node"
  args = ["/absolute/path/to/krusch-frontend-mcp/src/index.js"]
  ```

*(Replace `/absolute/path/to/krusch-frontend-mcp` with the real path returned by `pwd`.)*

## Never

- **Never run `npm` or `node` with `sudo` or as `root`**.
- **Never run `ollama pull` without asking the person first**, since model weights consume gigabytes of disk and bandwidth.
- **Never overwrite an existing `.env` or replace an entire IDE MCP config file**; always read the existing file, parse it, add or update only the `krusch-frontend-mcp` key, and write it back cleanly.
- **Never invent remote `OLLAMA_URL` or `OLLAMA_NODES` hosts** in `.env`; keep the localhost default unless the person provides a custom endpoint.

## Tell the Person After

Share a concise status report:
1. **Setup mode & path**: State where `krusch-frontend-mcp` was installed and whether Mode A (offline deterministic + SQLite `FTS5`) or Mode B (full Ollama `sqlite-vec` + `qwen2.5-coder:7b`) is active.
2. **Verification status**: Confirm `npm run seed` populated the 48 design rules in `memory.db` and `npm test` passed all `48` tests.
3. **Configured IDEs**: List the exact MCP config file(s) updated and remind the person to reload MCP servers or start a new agent session so all 12 tools load.
4. **First-turn test prompt**: Suggest asking in their next session: `"Run list_canonical_templates and query_design_rules for accessible button contrast to verify krusch-frontend-mcp is connected."`
