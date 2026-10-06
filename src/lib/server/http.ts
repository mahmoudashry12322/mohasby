import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function fail(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status },
    );
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        success: false,
        error: "راجع الحقول المطلوبة",
        issues: error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  const code = (error as { code?: string })?.code;
  if (code === "P2002")
    return NextResponse.json(
      { success: false, error: "الكود أو المرجع مسجل بالفعل" },
      { status: 409 },
    );
  if (code === "P2034")
    return NextResponse.json(
      { success: false, error: "تعارض متزامن. أعد المحاولة." },
      { status: 409 },
    );
  console.error(
    "API error",
    error instanceof Error ? error.message : "Unknown error",
  );
  return NextResponse.json(
    { success: false, error: "تعذر تنفيذ العملية" },
    { status: 500 },
  );
}
export function ok(data: object, status = 200) {
  return NextResponse.json(
    { success: true, ...data },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
export async function body(request: Request) {
  const text = await request.text();
  if (text.length > 500_000)
    throw new HttpError(413, "حجم الطلب أكبر من المسموح");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "صيغة الطلب غير صالحة");
  }
}
