import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function parseToolJson(rawText, label = 'rulesResponse') {
    try {
        return JSON.parse(rawText);
    } catch (e) {
        console.error(`Failed to parse ${label}:`, e);
        throw e;
    }
}

export async function runSwarmEvaluation(deps = {}) {
    console.log("🚀 Starting Swarm Evaluation Pipeline...\n");

    const transport = deps.transport || new StdioClientTransport({
        command: "node",
        args: [join(__dirname, "../src/index.js")]
    });

    const client = deps.client || new Client(
        {
            name: "swarm-eval-client",
            version: "1.0.0"
        },
        {
            capabilities: {}
        }
    );

    console.log("⏳ Connecting to MCP Server...");
    await client.connect(transport);
    console.log("✅ Connected!\n");

    try {
        // --- Agent 1: Designer ---
        console.log("🎨 [Agent 1: Designer] Initializing Design System...");
        
        console.log("   -> Querying RAG for brand guidelines (buttons)...");
        const rulesResponse = await client.callTool({
            name: "query_design_rules",
            arguments: { queryStr: "button padding and radius" }
        });
        if (rulesResponse.isError) {
            console.error(`   ❌ Tool Error: ${rulesResponse.content[0].text}`);
            throw new Error("Tool failed");
        }
        let rulesData;
        try {
            rulesData = JSON.parse(rulesResponse.content[0].text);
        } catch (e) {
            console.error("Failed to parse rulesResponse:", e);
            throw e;
        }
        console.log("   ✅ Retrieved Rules:");
        rulesData.forEach(r => console.log(`      - ${r.rule} (score: ${r.confidence.toFixed(2)})`));

        console.log("\n   -> Generating Color Palette from base Hex #3b82f6 (blue)...");
        const colorResponse = await client.callTool({
            name: "generate_color_palette",
            arguments: { baseHex: "#3b82f6" }
        });
        if (colorResponse.isError) {
            console.error(`   ❌ Tool Error: ${colorResponse.content[0].text}`);
            throw new Error("Tool failed");
        }
        const colorData = parseToolJson(colorResponse.content[0].text, "colorResponse");
        console.log(`   ✅ Generated Palette (Analogous 1): ${colorData.analogous[0]}`);
        console.log(`   ✅ Primary Contrast: ${colorData.accessibility.contrast_ratio} (${colorData.accessibility.wcag_level})`);

        // --- Agent 2: Frontend Layout ---
        console.log("\n🏗️ [Agent 2: Frontend Layout] Analyzing Layout Structure...");
        const htmlSnippet = `
            <div class="dashboard-widget">
                <h2>User Stats</h2>
                <div class="stats-grid">
                    <div class="stat-item">Active: 120</div>
                    <div class="stat-item">Idle: 45</div>
                </div>
            </div>
        `;
        console.log("   -> Passing raw HTML to layout engine...");
        const layoutResponse = await client.callTool({
            name: "analyze_layout_structure",
            arguments: { htmlString: htmlSnippet }
        });
        if (layoutResponse.isError) {
            console.error(`   ❌ Tool Error: ${layoutResponse.content[0].text}`);
            throw new Error("Tool failed");
        }
        const layoutData = parseToolJson(layoutResponse.content[0].text, "layoutResponse");
        if (layoutData.error) throw new Error(layoutData.error);
        console.log("   ✅ Layout Recommendation:");
        console.log(`\n${layoutData.suggestion.split('\\n').map(l => '        ' + l).join('\\n')}`);

        // --- Agent 3: Component Stylist ---
        console.log("\n💅 [Agent 3: Component Stylist] Generating Component Styles...");
        console.log("   -> Requesting styles for: 'glassmorphism dashboard widget card'");
        const styleResponse = await client.callTool({
            name: "generate_component_styles",
            arguments: { description: "glassmorphism dashboard widget card with hover lift" }
        });
        if (styleResponse.isError) {
            console.error(`   ❌ Tool Error: ${styleResponse.content[0].text}`);
            throw new Error("Tool failed");
        }
        const styleData = parseToolJson(styleResponse.content[0].text, "styleResponse");
        if (styleData.error) throw new Error(styleData.error);
        console.log("   ✅ Generated Component Styles:");
        console.log(`\n${styleData.css.split('\\n').map(l => '        ' + l).join('\\n')}`);
        
        console.log("\n✨ Swarm Evaluation Complete. All MCP tools interact sequentially without error.");

    } catch (err) {
        console.error("\n❌ Swarm Evaluation Failed:", err);
        if (deps.rethrowOnError !== false && (deps.client || deps.rethrowOnError === true)) {
            throw err;
        }
    } finally {
        // Close transport
        await transport.close();
    }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
    runSwarmEvaluation().catch(console.error);
}

