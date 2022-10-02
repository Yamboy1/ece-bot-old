import { Route, Router } from "itty-router";
import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from "discord-interactions";

export interface Env {
  DISCORD_APPLICATION_ID: string;
  DISCORD_GUILD: string;
  DISCORD_PUBLIC_KEY: string;
}

interface IMethods {
  get: Route;
  post: Route;
}

class JsonResponse extends Response {
  constructor(body: any, init?: ResponseInit) {
    init = init || {
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
      },
    };
    super(JSON.stringify(body), init);
  }
}

const router = Router<Request, IMethods>();

router.get("/", (request: Request, env: Env) => {
  return new Response(`👋 ${env.DISCORD_APPLICATION_ID} ${env.DISCORD_GUILD}`);
});

router.post("/", async (request: Request, env: Env) => {
  const message: any = await request.json();

  if (message.type === InteractionType.PING) {
    return new JsonResponse({
      type: InteractionResponseType.PONG,
    });
  }
});

async function verifyRequest(request: Request, env: Env) {
  if (request.method === "POST") {
    // Using the incoming headers, verify this request actually came from discord.
    const signature = request.headers.get("x-signature-ed25519") ?? "";
    const timestamp = request.headers.get("x-signature-timestamp") ?? "";
    console.log(signature, timestamp, env.DISCORD_PUBLIC_KEY);
    const body = await request.clone().arrayBuffer();
    return verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!(await verifyRequest(request, env))) {
      console.error("Invalid Request");
      return new Response("Bad request signature.", { status: 401 });
    }

    return router.handle(request, env);
  },
};
