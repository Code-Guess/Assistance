import express, { type Express } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import router from "./routes/index.js";
import { logger } from "./logger.js";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: { id: string | number; method: string; url?: string }) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: { statusCode: number }) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Open CORS: this backend is called directly from the Expo mobile app,
// which has no fixed origin to allowlist.
app.use(cors());

// Raised limit: PDF uploads (base64) and chat images can exceed the 100kb default.
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

app.get("/", (_req, res) => {
  res.json({ service: "pdf-tutor-backend", status: "ok" });
});

app.use("/api", router);

export default app;
