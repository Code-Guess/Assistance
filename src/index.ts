import app from "./app.js";
import { logger } from "./logger.js";

const rawPort = process.env["PORT"];
const port = rawPort ? Number(rawPort) : 8080;

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// 0.0.0.0 is required on Render (and most PaaS) — binding to localhost only
// makes the service unreachable from outside the container.
app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "Server listening");
});
