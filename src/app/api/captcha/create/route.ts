import { NextResponse } from "next/server";
import rotaptcha from "rotaptcha-node";
import { CreateProps } from "rotaptcha-node/dist/types";


const secretKey:string = process.env.SECRET_KEY!;

// GET - Check if slug exists
export async function GET() {

  const config: CreateProps = {
    width: 300,
    height: 300,
    noise: true,
    wobble: false,
    maxValue: 90,
    minValue: 20,
    secretKey: secretKey
  };

  try {

    const result:{image: string, token: string} = await rotaptcha.create(config);

    return NextResponse.json(
      {
        image: result.image,
        token: result.token,
        radius: 300 * 0.4 * 0.84,
        maxVal: config.maxValue,
        minVal: config.minValue
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating captcha image:", error);
    return NextResponse.json(
      { error: "Failed to generate captcha image" },
      { status: 500 }
    );
  }
}

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
