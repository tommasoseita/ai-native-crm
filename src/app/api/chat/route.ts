import Anthropic from "@anthropic-ai/sdk";
import { currentSdrId } from "@/lib/viewAs";
import { getCurrentUser } from "@/lib/auth";
import { SYSTEM_PROMPT, TOOLS, executeTool, type ToolContext } from "@/lib/ai-tools";
import { todayISO } from "@/lib/utils";

const MAX_ITERATIONS = 8;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const { messages } = (await req.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  const ctx: ToolContext = {
    sdrId: await currentSdrId(),
    date: todayISO(),
  };

  const client = new Anthropic({ apiKey });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      const conversation: Anthropic.MessageParam[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        for (let i = 0; i < MAX_ITERATIONS; i++) {
          const messageStream = client.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 4096,
            thinking: { type: "adaptive" },
            system: [
              {
                type: "text",
                text: SYSTEM_PROMPT,
                cache_control: { type: "ephemeral" },
              },
            ],
            tools: TOOLS,
            messages: conversation,
          });

          for await (const event of messageStream) {
            if (
              event.type === "content_block_start" &&
              event.content_block.type === "tool_use"
            ) {
              send({
                type: "tool_call_start",
                name: event.content_block.name,
              });
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                send({ type: "text_delta", text: event.delta.text });
              }
            }
          }

          const final = await messageStream.finalMessage();

          if (final.stop_reason === "end_turn") break;

          if (final.stop_reason === "tool_use") {
            conversation.push({ role: "assistant", content: final.content });

            const toolBlocks = final.content.filter(
              (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
            );

            const toolResults: Anthropic.ToolResultBlockParam[] = [];
            for (const block of toolBlocks) {
              const result = await executeTool(
                block.name,
                (block.input ?? {}) as Record<string, unknown>,
                ctx,
              );
              send({ type: "tool_call_end", name: block.name });
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: result,
              });
            }
            conversation.push({ role: "user", content: toolResults });
            continue;
          }

          if (final.stop_reason === "refusal") {
            send({
              type: "text_delta",
              text: "\n\n(Sorry — I can't help with that one.)",
            });
            break;
          }

          break;
        }

        send({ type: "done" });
      } catch (err) {
        const message =
          err instanceof Anthropic.APIError
            ? `${err.status}: ${err.message}`
            : err instanceof Error
              ? err.message
              : "Unknown error";
        send({ type: "error", error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
