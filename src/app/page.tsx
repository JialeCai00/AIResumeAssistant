"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ResumeCoach() {
  // 新版 API：需要手动管理 input 状态
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    experimental_throttle: 100,
  });

  // 手动管理输入状态
  const [input, setInput] = useState("");

  // 手动处理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    await sendMessage({ text: input });
    setInput(""); // 清空输入
  };

  // 修复：正确的 loading 状态判断
  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 p-4 md:p-10">
      <div className="w-full max-w-4xl space-y-8">
        {/* 标题区 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            AI 简历优化助手 🚀
          </h1>
          <p className="text-gray-500">
            粘贴你的简历内容，获取大厂面试官视角的专业建议
          </p>
        </div>

        {/* 核心交互区：左边输入，右边输出 */}
        <div className="grid gap-6 md:grid-cols-2 h-[600px]">
          {/* 左侧：输入区 */}
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle>你的简历</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              <form
                onSubmit={handleSubmit}
                className="flex-1 flex flex-col gap-4"
              >
                <Textarea
                  className="flex-1 resize-none p-4 text-base"
                  placeholder="在此处粘贴你的简历文本..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "正在分析..." : "开始分析"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 右侧：AI 建议区 */}
          <Card className="flex flex-col h-full bg-white">
            <CardHeader>
              <CardTitle>优化建议</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[500px] w-full p-4">
                {messages.length > 0 ? (
                  messages.map(
                    (m) =>
                      // 只显示 AI 的回复
                      m.role === "assistant" && (
                        <div
                          key={m.id}
                          className="prose prose-sm dark:prose-invert max-w-none"
                        >
                          <div className="whitespace-pre-wrap">
                            {/* 修复：正确访问 parts 数组中的 text */}
                            {m.parts.map((part, i) =>
                              part.type === "text" ? (
                                <span key={i}>{part.text}</span>
                              ) : null
                            )}
                          </div>
                        </div>
                      )
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                    AI 的建议将显示在这里...
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
