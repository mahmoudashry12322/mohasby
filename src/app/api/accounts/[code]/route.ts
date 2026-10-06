import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth/server";
import { body, fail, ok } from "@/lib/server/http";
import { locked } from "@/lib/accounting/ledger";
import { changeAccount, accountBalances } from "@/lib/accounting/accounts";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const resolved = await params;
  try {
    const actor = await authorize();
    const accounts = await locked(actor.companyId, (tx) =>
      accountBalances(tx, actor.companyId),
    );
    const account = accounts.find((a) => a.code === resolved.code);
    if (!account)
      return NextResponse.json(
        { success: false, error: "الحساب غير موجود" },
        { status: 404 },
      );
    return ok({
      account: {
        ...account,
        children: accounts.filter((a) => a.parentCode === resolved.code),
      },
    });
  } catch (e) {
    return fail(e);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const resolved = await params;
  try {
    const actor = await authorize(request, true);
    return ok({
      account: await changeAccount(actor, resolved.code, await body(request)),
      message: "تم تحديث الحساب",
    });
  } catch (error) {
    return fail(error);
  }
}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const resolved = await params;
  try {
    const actor = await authorize(request, true);
    return ok({
      account: await changeAccount(actor, resolved.code, {}, true),
      message: "تم إيقاف الحساب",
    });
  } catch (error) {
    return fail(error);
  }
}
