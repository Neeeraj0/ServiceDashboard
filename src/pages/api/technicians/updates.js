export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).end(); 
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  try {
    const response = await fetch('http://localhost:8000/api/technicians/register', {
      method: 'POST', // Assuming your registration endpoint is a POST request
    }); 

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status} ${response.statusText}`);
    }

    // Get the readable stream from the response
    const reader = response.body.getReader(); 

    // Read and push data chunks to the client
    while (true) {
      const { done, value } = await reader.read();
      if (done) break; // The backend closed the connection

      // Encode and send the data chunk to the client
      const data = Buffer.from(value).toString('utf-8'); 
      res.write(`data: ${data}\n\n`); 
    }
  } catch (error) {
    console.error('Error streaming SSE:', error);
    res.status(500).json({ message: 'Error establishing SSE connection' });
  } finally {
    res.end(); // Close the connection when done
  }
}

