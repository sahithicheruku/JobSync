import "server-only";

import { auth } from "@/auth";
import {
  getResumeReviewByOllama,
  getResumeReviewByOpenAi,
} from "@/actions/ai.actions";
import { NextRequest, NextResponse } from "next/server";
import { Resume } from "@/models/profile.model";
import { AiModel, AiProvider } from "@/models/ai.model";

export const POST = async (req: NextRequest) => {
  const session = await auth();
  const userId = session?.accessToken.sub;

  if (!session || !session.user) {
    return NextResponse.json({ message: "Not Authenticated" }, { status: 401 });
  }
  const { selectedModel, resume } = (await req.json()) as {
    selectedModel: AiModel;
    resume: Resume;
  };
  try {
    if (!resume || !selectedModel) {
      throw new Error("Resume or selected model is required");
    }

    // Log received model settings for debugging
    console.log("[AI Review API] Received model:", JSON.stringify(selectedModel));

    let response;
    switch (selectedModel.provider) {
      case AiProvider.OPENAI:
        console.log("[AI Review API] Using OpenAI with model:", selectedModel.model);
        response = await getResumeReviewByOpenAi(resume, selectedModel.model);
        break;
      case AiProvider.OLLAMA:
        console.log("[AI Review API] Using Ollama with model:", selectedModel.model);
        response = await getResumeReviewByOllama(resume, selectedModel.model);
        break;
      default:
        console.log("[AI Review API] Unknown provider, defaulting to OpenAI");
        response = await getResumeReviewByOpenAi(resume, selectedModel.model);
        break;
    }

    return new NextResponse(response, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = "Error getting AI response.";
    console.error(message, error);
    if (error instanceof Error) {
      if (error.message === "fetch failed") {
        error.message = `Fetch failed, please make sure selected AI provider (${selectedModel.provider}) service is running.`;
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500, statusText: error.message }
      );
    }
    return NextResponse.json(
      { error: message },
      { status: 500, statusText: message }
    );
  }
};
