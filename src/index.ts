import { Route, Router } from "itty-router";
import {
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
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

  if (message.type === InteractionType.APPLICATION_COMMAND) {
    return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Select your roles below: ",
        components: [
          {
            type: MessageComponentTypes.ACTION_ROW,
            components: [
              {
                type: MessageComponentTypes.STRING_SELECT,
                custom_id: "select_role",
                options: [
                  {
                    label: "First Pro (200 level courses)",
                    value: "first_pro",
                    description: "The fun is only beginning... :)",
                    emoji: {
                      name: "1️⃣",
                      id: null,
                    },
                  },
                  {
                    label: "Second Pro (300 level courses)",
                    value: "second_pro",
                    description: "I'm impressed, you haven't dropped out... :)",
                    emoji: {
                      name: "2️⃣",
                      id: null,
                    },
                  },
                  {
                    label: "Third Pro (400 level courses)",
                    value: "third_pro",
                    description: "You are actually a masochist... :)",
                    emoji: {
                      name: "3️⃣",
                      id: null,
                    },
                  },
                ],
                placeholder: "Select your current year",
              },
            ],
          },
        ],
      },
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
