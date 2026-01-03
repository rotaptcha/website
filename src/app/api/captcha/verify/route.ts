import { NextResponse } from "next/server";
import rotaptcha from "rotaptcha-node";

const secretKey: string = process.env.SECRET_KEY!;

// POST - Verify captcha response
export async function POST(request: Request) {
  try {
    const { token, answer } = await request.json();

    if (!token || answer === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: token and answer" },
        { status: 400 }
      );
    }

    const isValid = await rotaptcha.verify({ token: token, answer: answer, secretKey: secretKey });

    return NextResponse.json(
      { 
        success: isValid,
        message: isValid ? "Captcha verified successfully" : "Invalid captcha answer"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying captcha:", error);
    return NextResponse.json(
      { error: "Failed to verify captcha" },
      { status: 500 }
    );
  }
}
