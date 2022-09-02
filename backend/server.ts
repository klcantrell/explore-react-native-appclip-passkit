import express from "express";
import path from "path";

import type { Express, Request, Response } from "express";

const app: Express = express();
const port = process.env.PORT || 3000;

app.get("/applepass/:id", (req: Request<{ id: string }>, res: Response) => {
  let fileName: string | undefined;
  if (req.params.id === "bgsksfuioa") {
    fileName = "myFirstPass.pkpass";
  } else if (req.params.id === "analternateserialnumber") {
    fileName = "mySecondPass.pkpass";
  }

  if (fileName) {
    res.sendFile(path.join(__dirname, fileName), {
      type: "application/vnd.apple.pkpass",
    });
  } else {
    res.status(404).send("Invalid pass ID");
  }
});

app.get("/applepass", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "/mySecondPass.pkpass"), {
    type: "application/vnd.apple.pkpass",
  });
});

app.listen(port, () => {
  console.log(`Server is running at https://localhost:${port}`);
});
