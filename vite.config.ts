import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, type PreviewServer, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'

const appRunId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

const sendRunId = (_request: IncomingMessage, response: ServerResponse) => {
  response.setHeader('Content-Type', 'application/json')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify({ runId: appRunId }))
}

const runIdPlugin = () => ({
  name: 'app-run-id',
  configureServer(server: ViteDevServer) {
    server.middlewares.use('/__app_run_id', sendRunId)
  },
  configurePreviewServer(server: PreviewServer) {
    server.middlewares.use('/__app_run_id', sendRunId)
  },
})

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_RUN_ID__: JSON.stringify(appRunId),
  },
  plugins: [react(), runIdPlugin()],
})
