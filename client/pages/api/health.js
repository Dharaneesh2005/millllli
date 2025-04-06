export default function handler(req, res) {
  // Basic health check endpoint
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    databaseConnected: !!process.env.DATABASE_URL || (!!process.env.PGHOST && !!process.env.PGDATABASE)
  });
}