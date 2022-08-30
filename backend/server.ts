import express from 'express';
import path from 'path';

import type { Express, Request, Response } from 'express';

const app: Express = express();
const port = process.env.PORT || 3000;

app.get('/pass', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '/myFirstPass.pkpass'), { type: 'application/vnd.apple.pkpass' });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at https://localhost:${port}`);
});
