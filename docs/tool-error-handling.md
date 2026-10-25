# Tool-Call Error-Handling Conventions (`DX-01`)

Every MCP client tool call in `krusch-frontend-mcp` must follow the **check-then-parse-with-try/catch** contract:

1. **Check `response.isError`**:
   ```js
   if (response.isError) {
       console.error(`Tool Error: ${response.content?.[0]?.text}`);
       throw new Error("Tool failed");
   }
   ```
2. **Guard `JSON.parse` on `response.content[0].text`**:
   ```js
   let data;
   try {
       data = JSON.parse(response.content[0].text);
   } catch (err) {
       console.error("Failed to parse response:", err);
       throw err;
   }
   ```
3. **Propagate or Handle Cleanly**:
   Log a concise error message with context and re-throw (or exit gracefully in `finally` after closing the transport).
