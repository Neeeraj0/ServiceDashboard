export default async function handler(req, res) {
    if (req.method !== 'GET') {
      return res.status(405).end(); 
    }
    
    console.log('SSE connection established');
    // Set headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
  
    try {
      // Create a long-lived connection
      const keepAlive = setInterval(() => {
        res.write(`: heartbeat\n\n`);
      }, 30000);  // Send a heartbeat every 30 seconds
  
      // Optional: Set up your event source connection to the backend
      const backendStream = await fetch('http://localhost:8000/api/technicians/updates');
      
      if (backendStream.body) {
        backendStream.body.on('data', (chunk) => {
          res.write(chunk);
        });
      }
  
      // Handle client disconnection
      req.on('close', () => {
        clearInterval(keepAlive);
        backendStream?.body?.destroy();
        res.end();
      });
  
    } catch (error) {
      console.error('SSE Error:', error);
      res.status(500).end();
    }
  }