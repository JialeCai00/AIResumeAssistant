import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";

// 允许请求时长超过默认限制（因为 AI 生成比较慢）
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // 1. 获取前端发来的对话历史
    const { messages } = await req.json();

    // 2. 调用大模型
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system:
        "你是一位资深的各种大厂的前端面试官和简历专家。请针对用户输入的简历内容，给出专业的优化建议，包括：格式、技术栈描述、项目亮点挖掘等。",
      messages: convertToModelMessages(messages),
    });

    // 3. 返回流式数据 (Streaming Response)
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
