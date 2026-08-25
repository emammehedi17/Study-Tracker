import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parser with high limit for base64 screenshot uploads
app.use(express.json({ limit: "25mb" }));

// Lazy initialization of Gemini AI
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Study Plan & Weight Analyzer Endpoint
app.post("/api/analyze-plan", async (req, res) => {
  try {
    const { text, imageBase64, mimeType = "image/jpeg", targetDate } = req.body;

    if (!text && !imageBase64) {
      return res.status(400).json({ error: "অনুগ্রহ করে পড়ার তালিকা লিখুন অথবা রুটিনের স্ক্রিনশট দিন।" });
    }

    const ai = getAiClient();

    const systemInstruction = `
You are an expert 51st BCS (Bangladesh Civil Service) Exam Preparation Mentor and Study Plan Strategist.
The user is preparing for the 51st BCS preliminary examination.
The user studies from three main sources:
1. 'textbook' (Textbooks / মূল পাঠ্যবই বা গাইড যেমন ডাইজেস্ট, জর্জ এমপি৩, অগ্রদূত, প্রফেসরস, নবম-দশম শ্রেণির বোর্ড বই)
2. 'livemcq' (LiveMCQ PDFs / লাইভ এমসিকিউ শিট, ডেইলি এক্সাম পিডিএফ ও নোট)
3. 'question_bank' (Question Bank / বিগত সালের বিসিএস ও পিএসসি প্রশ্নব্যাংক, জব সলিউশন)
4. 'revision' (Revision & Mistake Review / রিভিশন বা ভুল প্রশ্নের নোট)

Your task:
1. Analyze the given text list OR study plan routine screenshot/image.
2. Extract all distinct study tasks / topics for the day.
3. Categorize each task into:
   - source: "textbook" | "livemcq" | "question_bank" | "revision"
   - subject: One of ["বাংলা সাহিত্য ও ব্যাকরণ", "English Language & Literature", "বাংলাদেশ বিষয়াবলী", "আন্তর্জাতিক বিষয়াবলী", "গাণিতিক যুক্তি", "মানসিক দক্ষতা", "সাধারণ বিজ্ঞান", "কম্পিউটার ও তথ্যপ্রযুক্তি", "ভূগোল, পরিবেশ ও দুর্যোগ ব্যবস্থাপনা", "নৈতিকতা, মূল্যবোধ ও সুশাসন"]
   - title: Clear topic title in Bengali (e.g., "বাংলা ব্যাকরণ: সন্ধি ও বিসর্গ সন্ধি", "English: Subject-Verb Agreement", "বাংলাদেশ বিষয়াবলী: প্রাচীন বাংলার ইতিহাস")
   - sourceDetails: Specific source info if mentioned (e.g., "LiveMCQ PDF 14", "MP3 বাংলা পৃঃ ৪৫-৫০", "১০ম-৪৫তম বিসিএস প্রশ্নব্যাংক")
   - estimatedMinutes: Estimated study time in minutes based on topic length/complexity (e.g., 30, 45, 60, 90)
   - percentageWeight: An intelligent percentage weight (integer or float) indicating how much of today's total 100% preparation this task represents.
     *RULES FOR WEIGHTS*:
     - The sum of all percentageWeight across all tasks MUST EXACTLY EQUAL 100.
     - Allocate higher weights to comprehensive conceptual reading (e.g. detailed textbook topics or high-mark BCS sections like Bangladesh Affairs 30m, English 35m, Bangla 35m, Math 15m), and balanced weights to LiveMCQ PDF revisions and Question Bank drills.
   - importance: "high" | "medium" | "low"
   - strategicTip: A short 1-sentence helpful BCS preparation tip in Bengali for tackling this topic effectively.

Provide a high-level summary of the day's routine in Bengali as well.
`;

    const contents: any[] = [];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      contents.push({
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType || "image/jpeg",
        },
      });
    }

    let promptText = "অনুগ্রহ করে এই পড়ার রুটিনটি বিশ্লেষণ করে প্রতিটি বিষয়ের জন্য টাস্ক লিস্ট, সোর্স (Textbook, LiveMCQ, Question Bank) এবং শতকরা গুরুত্ব (Percentage Weight) বিশ্লেষণ করে মোট ১০০% হিসেব করে দিন।";
    if (text) {
      promptText += `\n\nপ্রদত্ত পড়ার তালিকা:\n${text}`;
    }
    if (targetDate) {
      promptText += `\nতারিখ: ${targetDate}`;
    }
    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            daySummary: {
              type: Type.STRING,
              description: "Brief motivating Bengali summary of today's study plan",
            },
            totalEstimatedMinutes: {
              type: Type.INTEGER,
              description: "Total estimated study minutes for the day",
            },
            strategyAdvice: {
              type: Type.STRING,
              description: "BCS specific advice on how to sequence Textbook -> Question Bank -> LiveMCQ for best retention",
            },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  source: {
                    type: Type.STRING,
                    enum: ["textbook", "livemcq", "question_bank", "revision"],
                  },
                  subject: { type: Type.STRING },
                  sourceDetails: { type: Type.STRING },
                  estimatedMinutes: { type: Type.INTEGER },
                  percentageWeight: { type: Type.NUMBER },
                  importance: {
                    type: Type.STRING,
                    enum: ["high", "medium", "low"],
                  },
                  strategicTip: { type: Type.STRING },
                },
                required: ["title", "source", "subject", "percentageWeight", "estimatedMinutes"],
              },
            },
          },
          required: ["daySummary", "totalEstimatedMinutes", "tasks"],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response generated from AI");
    }

    const parsedData = JSON.parse(responseText);

    // Normalize weights to guarantee exact 100 sum if slight variance
    if (parsedData.tasks && parsedData.tasks.length > 0) {
      const currentSum = parsedData.tasks.reduce(
        (sum: number, t: any) => sum + (Number(t.percentageWeight) || 0),
        0
      );
      if (currentSum > 0 && Math.abs(currentSum - 100) > 0.5) {
        parsedData.tasks = parsedData.tasks.map((t: any, idx: number) => {
          const normalized = Math.round(((Number(t.percentageWeight) || 1) / currentSum) * 100);
          return { ...t, percentageWeight: normalized };
        });
        // Adjust last task if rounding diff
        const newSum = parsedData.tasks.reduce(
          (sum: number, t: any) => sum + t.percentageWeight,
          0
        );
        if (newSum !== 100 && parsedData.tasks.length > 0) {
          parsedData.tasks[parsedData.tasks.length - 1].percentageWeight += 100 - newSum;
        }
      }
    }

    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("AI Plan Analysis Error:", error);
    res.status(500).json({
      error: "পড়ার পরিকল্পনা বিশ্লেষণ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
      details: error.message,
    });
  }
});

// AI Weekly Performance & Habit Coach Endpoint
app.post("/api/generate-ai-feedback", async (req, res) => {
  try {
    const { weeklyStats, completedRate, streak, sourcesBreakdown } = req.body;
    const ai = getAiClient();

    const prompt = `
You are a top-ranked BCS Cadre mentor analyzing a 51st BCS Aspirant's weekly study performance data.
Weekly Data:
- Average Completion Rate: ${completedRate}%
- Current Streak: ${streak} days
- Source Distribution: Textbooks: ${sourcesBreakdown?.textbook || 0}%, LiveMCQ PDFs: ${sourcesBreakdown?.livemcq || 0}%, Question Bank: ${sourcesBreakdown?.question_bank || 0}%
- Daily Logs: ${JSON.stringify(weeklyStats || [])}

Provide:
1. Motivational evaluation in natural, supportive Bengali (উৎসাহমূলক মন্তব্য).
2. Strengths identified this week.
3. 2-3 specific tactical adjustments for 51st BCS preparation (e.g. balancing Question bank practice with textbook theory, reviewing LiveMCQ negative marks).
4. Short inspiring quote for 51st BCS dream.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mentorVerdict: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            motivationalQuote: { type: Type.STRING },
          },
          required: ["mentorVerdict", "strengths", "recommendations", "motivationalQuote"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("AI Feedback Error:", error);
    res.status(500).json({ error: "মেন্টর ফিডব্যাক তৈরিতে সমস্যা হয়েছে।" });
  }
});

// Start Server and mount Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`51st BCS Study Tracker server running on port ${PORT}`);
  });
}

startServer();
