"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload } from "lucide-react";

export default function ResumeCoach() {
  // 新版 API：需要手动管理 input 状态
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    experimental_throttle: 100,
  });

  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 手动管理输入状态
  const [input, setInput] = useState("");

  // 处理文件上传的函数
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 限制文件类型
    if (file.type !== "application/pdf") {
      alert("❌ 请上传 PDF 文件");
      return;
    }

    // 限制文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert("❌ 文件太大，请上传小于 5MB 的文件");
      return;
    }

    setIsParsing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      // 检查是否有错误（包括 400 和 500 状态码）
      if (!response.ok || data.error) {
        const errorMessage = data.error || "解析失败";
        const errorDetails = data.details ? `\n\n${data.details}` : "";
        alert(`❌ ${errorMessage}${errorDetails}`);
        return;
      }

      // 成功提取文本
      if (data.text) {
        setInput(data.text);
        console.log("✅ PDF 解析成功，提取了", data.text.length, "个字符");
        // 成功提示可选
        // alert("✅ PDF 解析成功！");
      }
    } catch (error) {
      console.error("PDF Parse Error:", error);
      alert("❌ 网络错误或服务器异常，请稍后重试");
    } finally {
      setIsParsing(false);
      // 清空 input，允许再次上传同一个文件
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

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
                {/* 文件上传按钮 */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isParsing || isLoading}
                    className="flex-1"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {isParsing ? "解析中..." : "上传 PDF 简历"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                <Textarea
                  className="flex-1 resize-none p-4 text-base"
                  placeholder="在此处粘贴你的简历文本，或点击上方按钮上传 PDF 文件..."
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
