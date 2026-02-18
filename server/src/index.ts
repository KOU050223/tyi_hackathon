import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
  HUME_API_KEY: string;
  ALLOWED_ORIGIN?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const LOCAL_ORIGINS = ["http://localhost:5173", "http://localhost:4173"];

app.use("/api/*", async (c, next) => {
  const allowedOrigins = c.env.ALLOWED_ORIGIN
    ? [...LOCAL_ORIGINS, c.env.ALLOWED_ORIGIN]
    : LOCAL_ORIGINS;
  const middleware = cors({
    origin: allowedOrigins,
    allowMethods: ["POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  });
  return middleware(c, next);
});

/**
 * Hume Expression Measurement APIのWebSocketはAPIキーで認証する。
 * フロントエンドにAPIキーを直接返す（本番ではリファラー検証等を追加すること）。
 */
app.post("/api/hume/token", async (c) => {
  const apiKey = c.env.HUME_API_KEY;

  if (!apiKey) {
    return c.json({ error: "Hume AI API key not configured" }, 500);
  }

  return c.json({
    apiKey,
  });
});

export default app;
