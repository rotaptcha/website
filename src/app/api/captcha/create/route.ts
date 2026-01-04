import { NextResponse } from "next/server";
import rotaptcha from "rotaptcha-node";
import { CreateProps } from "rotaptcha-node/dist/types";


const secretKey: string = "abfgdhsetjfn3345uthsdfgshg45y6rt";

// GET - Default captcha with preset config
export async function GET() {

  const config: CreateProps = {
    width: 300,
    height: 300,
    noise: true,
    wobbleIntensity: 2,
    maxValue: 90,
    minValue: 20
  };

  try {

    const result: { image: string, token: string } = await rotaptcha.create(config, secretKey);

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

// POST - Create captcha with custom configuration
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const config: CreateProps = {
      width: body.width,
      height: body.height,
      minValue: body.minValue,
      maxValue: body.maxValue,
      step: body.step,
      wobbleIntensity: body.wobbleIntensity,
      noise: body.noise,
      strokeWidth: body.strokeWidth,
      availableColors: body.availableColors,
      canvasBg: body.canvasBg,
      noiseDensity: body.noiseDensity,
      expiryTime: body.expiryTime
    };

    const result: { image: string, token: string } = await rotaptcha.create(config, secretKey);

    const calculatedRadius = (config.width || 300) * 0.4 * 0.84;

    return NextResponse.json(
      {
        image: result.image,
        token: result.token,
        radius: calculatedRadius,
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

