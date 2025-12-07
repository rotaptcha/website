import { NextResponse } from "next/server";
import rotaptcha from "rotaptcha-node";
import { CreateProps } from "rotaptcha-node/dist/types";


// GET - Check if slug exists
export async function GET() {

  const config : CreateProps = {
    width: 300,
    height: 300,
    noise: true,
    wobble : false,
    strokeWidth : 2,
    maxValue : 150,
    minValue: 30
  };

  try {

    const image = await rotaptcha.create(config);
    
    return NextResponse.json(
      { image },
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