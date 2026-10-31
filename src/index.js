import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { config } from "./config.js";
import { generateColorPalette } from "./tools/color.js";
import { cssToTailwind } from "./tools/tailwind.js";
import { ingestFigmaTokens, generateCssVariables } from "./tools/figma.js";
import { queryDesignRules } from "./tools/design-rules.js";
import { analyzeLayoutStructure } from "./tools/layout.js";
import { generateComponentStyles } from "./tools/component-styles.js";
import { generateResponsiveBreakpoints } from "./tools/breakpoints.js";
import { getCanonicalTemplate, listCanonicalTemplates } from "./tools/canonical-templates.js";
import { getProvenance, traverseGraph } from "./rag-engine.js";

import { realpathSync } from "fs";
import { resolve as resolvePath } from "path";
import { fileURLToPath } from "url";

export const VERSION = "1.1.0";

export const FRONTEND_TOOL_CAPABILITIES = {
    analyzeLayoutStructure,
    cssToTailwind,
    generateColorPalette,
    generateComponentStyles,
    generateCssVariables,
    generateResponsiveBreakpoints,
    getCanonicalTemplate,
    getProvenance,
    ingestFigmaTokens,
    listCanonicalTemplates,
    queryDesignRules,
    traverseGraph,
};

const server = new Server(
    {
        name: "krusch-frontend-mcp",
        version: VERSION,
    },
    {
        capabilities: {
            tools: FRONTEND_TOOL_CAPABILITIES,
        },
    }
);

export const FRONTEND_TOOL_DEFINITIONS = [
    {
        name: "generate_color_palette",
        description: "Generates a cohesive color palette (complementary, analogous, triadic) and contrast scores from a base hex code.",
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        },
        inputSchema: {
            type: "object",
            properties: {
                baseHex: {
                    type: "string",
                    description: "The base color in #RRGGBB format"
                }
            },
            required: ["baseHex"]
        }
    },
    {
        name: "css_to_tailwind",
        description: "Translates standard CSS properties into Tailwind utility classes.",
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        },
        inputSchema: {
            type: "object",
            properties: {
                cssString: {
                    type: "string",
                    description: "Raw CSS rules (e.g. 'display: flex; padding: 1rem;')"
                }
            },
            required: ["cssString"]
        }
    },
    {
        name: "ingest_figma_tokens",
        description: "Parses Figma JSON token exports, converts them to CSS variables/Tailwind configs, and indexes them into the RAG database.",
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        },
        inputSchema: {
            type: "object",
            properties: {
                tokensJsonStr: { type: "string" }
            },
            required: ["tokensJsonStr"]
        }
    },
    {
        name: "generate_css_variables_from_figma",
        description: "Parses Figma JSON token exports and returns a CSS string with a :root block defining CSS custom properties (variables) for each token. Use this to generate actual CSS rather than ingesting into the RAG.",
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        },
        inputSchema: {
            type: "object",
            properties: {
                tokensJsonStr: { type: "string" }
            },
            required: ["tokensJsonStr"]
        }
    },
    {
        name: "query_design_rules",
        description: "Semantic RAG search over specific design guidelines, CSS architecture, and accessibility standards.",
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        },
        inputSchema: {
            type: "object",
            properties: {
                queryStr: { type: "string" },
                paradigm: { type: "string", description: "Optional aesthetic paradigm to filter by (e.g. 'universal', 'refactoring-ui', 'apple-hig', 'material-design')" }
            },
            required: ["queryStr"]
        }
    },
    {
        name: "analyze_layout_structure",
        description: "Accepts an HTML structure and returns the optimal CSS layout approach (Flexbox vs Grid) and the necessary CSS.",
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        },
        inputSchema: {
            type: "object",
            properties: {
                htmlString: { type: "string" }
            },
            required: ["htmlString"]
        }
    },
    {
        name: "generate_component_styles",
        description: "Given a component description (e.g. 'glassmorphism card with hover lift'), generates CSS custom properties and classes. Enriches output with RAG-retrieved design rules.",
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        },
        inputSchema: {
            type: "object",
            properties: {
                description: {
                    type: "string",
                    description: "Natural language description of the component aesthetic"
                },
                paradigm: {
                    type: "string",
                    description: "Optional aesthetic paradigm to filter RAG rules by (e.g. 'refactoring-ui', 'universal')"
                }
            },
            required: ["description"]
        }
    },
    {
        name: "generate_responsive_breakpoints",
        description: "Generates standard CSS media queries for responsive breakpoints (e.g. sm, md, lg) with optional custom width overrides.",
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        },
        inputSchema: {
            type: "object",
            properties: {
                customBreakpoints: {
                    type: "object",
                    description: "Optional overrides for breakpoints. e.g. { '3xl': '1920px' }",
                    additionalProperties: { type: "string" }
                }
            }
        }
    },
    {
        name: "frontend_get_provenance",
        description: "Company Brain Substrate (SQLite): Interrogate why a piece of context or design rule exists by tracing its version history.",
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        },
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "number", description: "The ID of the frontend RAG item to trace." }
            },
            required: ["id"]
        }
    },
    {
        name: "frontend_traverse_graph",
        description: "Company Brain Substrate (SQLite): Graph Traversal. Traverses parent/child memory lineage for frontend design rules.",
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        },
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "number", description: "The ID of the frontend RAG item to traverse from." },
                direction: { type: "string", enum: ['parents', 'children', 'all'], description: "Default is 'all'." },
                depth: { type: "number", description: "Default is 3." }
            },
            required: ["id"]
        }
    },
    {
        name: "get_canonical_template",
        description: "Returns the authoritative bit-for-bit HTML/SVG component template or @krusch/toolkit & krusch_toolkit Lego starter brick for krusch.dev and homelab projects.",
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        },
        inputSchema: {
            type: "object",
            properties: {
                templateKey: {
                    type: "string",
                    enum: listCanonicalTemplates().map((t) => t.key),
                    description: "The canonical template or Lego starter brick key to retrieve."
                }
            },
            required: ["templateKey"]
        }
    },
    {
        name: "list_canonical_templates",
        description: "Lists all available canonical HTML/SVG design templates and @krusch/toolkit & krusch_toolkit Lego starter bricks for homelab projects.",
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        },
        inputSchema: {
            type: "object",
            properties: {}
        }
    }
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: FRONTEND_TOOL_DEFINITIONS,
    };
});

export async function dispatchFrontendTool(request) {
    const params = request?.params && typeof request.params === "object" ? request.params : {};
    const name = params.name;
    const rawArgs = params.arguments;
    const args = rawArgs && typeof rawArgs === "object" && !Array.isArray(rawArgs) ? rawArgs : {};

    try {
        switch (name) {
            case "generate_color_palette": {
                const palette = generateColorPalette(args.baseHex);
                return {
                    content: [{ type: "text", text: JSON.stringify(palette, null, 2) }]
                };
            }
            case "css_to_tailwind": {
                const result = cssToTailwind(args.cssString);
                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
                };
            }
            case "ingest_figma_tokens": {
                const result = await ingestFigmaTokens(args.tokensJsonStr);
                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            }
            case "generate_css_variables_from_figma": {
                const result = generateCssVariables(args.tokensJsonStr);
                return { content: [{ type: "text", text: result }] };
            }
            case "query_design_rules": {
                const result = await queryDesignRules(args.queryStr, args.paradigm);
                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            }
            case "analyze_layout_structure": {
                const result = await analyzeLayoutStructure(args.htmlString);
                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            }
            case "generate_component_styles": {
                const result = await generateComponentStyles(args.description, args.paradigm);
                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            }
            case "generate_responsive_breakpoints": {
                const result = generateResponsiveBreakpoints(args.customBreakpoints || {});
                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            }
            case "frontend_get_provenance": {
                const result = await getProvenance(args.id);
                if (result.error) throw new Error(result.error);
                return { content: [{ type: "text", text: result.output }] };
            }
            case "frontend_traverse_graph": {
                const result = await traverseGraph(args.id, args.direction || 'all', args.depth || 3);
                if (result.error) throw new Error(result.error);
                return { content: [{ type: "text", text: result.output }] };
            }
            case "get_canonical_template": {
                const tpl = getCanonicalTemplate(args.templateKey);
                return { content: [{ type: "text", text: tpl.html }] };
            }
            case "list_canonical_templates": {
                const list = listCanonicalTemplates();
                return { content: [{ type: "text", text: JSON.stringify(list, null, 2) }] };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
        };
    }
}

server.setRequestHandler(CallToolRequestSchema, dispatchFrontendTool);

async function main() {
    try {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        if (config.debug) {
            console.error("Krusch Frontend MCP Server running on stdio");
        }
    } catch (error) {
        console.error("Server error:", error);
        process.exit(1);
    }
}

function resolveEntryRealPath(targetPath) {
    try {
        return realpathSync(targetPath);
    } catch {
        return resolvePath(targetPath);
    }
}

if (
    process.argv[1] &&
    resolveEntryRealPath(fileURLToPath(import.meta.url)) === resolveEntryRealPath(process.argv[1])
) {
    main();
}

