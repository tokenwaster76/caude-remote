import 'dotenv/config';
import express from 'express';
import { randomUUID } from 'crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { config } from './config';
import { bearerAuthMiddleware } from './auth/bearerAuth';
import { createMcpServer } from './mcpServer';

const app = express();
app.use(express.json());

// Session map: sessionId -> transport
const transports = new Map<string, StreamableHTTPServerTransport>();

// Cleanup sessions after 1 hour of inactivity
function scheduleCleanup(sessionId: string, transport: StreamableHTTPServerTransport) {
  setTimeout(async () => {
    if (transports.has(sessionId)) {
      transports.delete(sessionId);
      try { await transport.close(); } catch { /* ignore */ }
      console.log(`[session] expired: ${sessionId}`);
    }
  }, 60 * 60 * 1000);
}

// POST /mcp — initialize new sessions or handle existing ones
app.post('/mcp', bearerAuthMiddleware, async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (sessionId) {
    const transport = transports.get(sessionId);
    if (!transport) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    await transport.handleRequest(req, res, req.body);
    return;
  }

  // New session — must be an initialize request
  if (!isInitializeRequest(req.body)) {
    res.status(400).json({ error: 'First request must be an MCP initialize request' });
    return;
  }

  const newSessionId = randomUUID();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => newSessionId,
    onsessioninitialized: (sid) => {
      transports.set(sid, transport);
      scheduleCleanup(sid, transport);
      console.log(`[session] created: ${sid}`);
    },
  });

  const server = createMcpServer();
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// GET /mcp — SSE stream for an existing session
app.get('/mcp', bearerAuthMiddleware, async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId) {
    res.status(400).json({ error: 'Missing Mcp-Session-Id header' });
    return;
  }
  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  await transport.handleRequest(req, res);
});

// DELETE /mcp — tear down a session
app.delete('/mcp', bearerAuthMiddleware, async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (sessionId) {
    const transport = transports.get(sessionId);
    if (transport) {
      transports.delete(sessionId);
      try { await transport.close(); } catch { /* ignore */ }
      console.log(`[session] deleted: ${sessionId}`);
    }
  }
  res.status(200).json({ ok: true });
});

// Graceful shutdown
async function shutdown() {
  console.log('\n[server] shutting down...');
  for (const [sid, transport] of transports) {
    try { await transport.close(); } catch { /* ignore */ }
    console.log(`[session] closed: ${sid}`);
  }
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start
app.listen(config.PORT, () => {
  console.log(`[server] Windows Remote MCP listening on http://localhost:${config.PORT}/mcp`);
  if (config.TUNNEL_HOSTNAME) {
    console.log(`[server] Public URL: https://${config.TUNNEL_HOSTNAME}/mcp`);
  } else {
    console.log('[server] Tip: start the tunnel and set TUNNEL_HOSTNAME in .env');
  }
});
