const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

// Initialize Next.js app
app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    
    // Pass API requests to the API handlers
    if (parsedUrl.pathname && parsedUrl.pathname.startsWith('/api/')) {
      // Let the internal API routes handle API requests
      handle(req, res, parsedUrl)
    } else {
      // All other requests are handled by Next.js
      handle(req, res, parsedUrl)
    }
  }).listen(process.env.PORT || 3000, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${process.env.PORT || 3000}`)
  })
})