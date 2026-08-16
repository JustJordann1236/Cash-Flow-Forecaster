import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { routes } from "./routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

await app.register(fastifyStatic, {
    root: path.join(__dirname, "..", "public"),
});

await app.register(routes);

const PORT = Number(process.env.PORT) || 3000;

app.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`Cash-Flow Forecaster running at http://localhost:${PORT}`);
});