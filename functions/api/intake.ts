import { verwerkAanvraag, type Env } from "../../src/server/intake";

// Cloudflare Pages Function: POST /api/intake
export const onRequestPost = (context: { request: Request; env: Env }) =>
  verwerkAanvraag(context.request, context.env);
