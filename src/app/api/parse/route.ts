import { NextResponse } from "next/server";
import PDFParser from "pdf2json";

interface PDFTextItem {
  R: Array<{ T: string }>;
}

interface PDFPage {
  Texts: PDFTextItem[];
}

interface PDFData {
  Pages: PDFPage[];
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    console.log("📄 File received:", file.name, file.size, "bytes");

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pdfParser = new PDFParser();

    return new Promise((resolve) => {
      pdfParser.on(
        "pdfParser_dataError",
        (errData: Error | { parserError: Error }) => {
          const errorMsg =
            errData instanceof Error
              ? errData.message
              : errData.parserError.message;
          console.error("❌ PDF Parse Error:", errorMsg);
          resolve(
            NextResponse.json(
              { error: "Failed to parse PDF", details: errorMsg },
              { status: 500 }
            )
          );
        }
      );

      pdfParser.on("pdfParser_dataReady", (pdfData: PDFData) => {
        console.log("✅ PDF parsed successfully");

        // 方法 1: 使用 getRawTextContent
        let text = pdfParser.getRawTextContent();

        console.log(
          "📝 Method 1 - getRawTextContent length:",
          text?.length || 0
        );

        // 如果为空，尝试方法 2: 手动从 pdfData 提取
        if (!text || text.trim().length === 0) {
          console.log("⚠️ Method 1 failed, trying Method 2...");
          try {
            text = pdfData.Pages.map((page: PDFPage) =>
              page.Texts.map((textItem: PDFTextItem) =>
                textItem.R.map((r) => {
                  try {
                    // 尝试解码 URI 编码的文本
                    return decodeURIComponent(r.T);
                  } catch {
                    // 如果解码失败（特殊字符），直接使用原始文本
                    return r.T;
                  }
                }).join(" ")
              ).join(" ")
            ).join("\n\n");
            console.log(
              "📝 Method 2 - Manual extraction length:",
              text?.length || 0
            );
          } catch (e) {
            console.error("❌ Method 2 failed:", e);
          }
        }

        console.log("📝 First 200 chars:", text?.substring(0, 200));

        // 检查是否为空
        if (!text || text.trim().length === 0) {
          console.warn(
            "⚠️ PDF parsed but no text found - might be a scanned PDF"
          );
          resolve(
            NextResponse.json(
              {
                error: "No text found in PDF",
                details:
                  "This might be a scanned PDF (image-based). Please upload a PDF with selectable text.",
              },
              { status: 400 }
            )
          );
          return;
        }

        console.log("✅ Returning text to client");
        resolve(NextResponse.json({ text }));
      });

      pdfParser.parseBuffer(buffer);
    });
  } catch (error) {
    console.error("💥 Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Failed to parse PDF",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
