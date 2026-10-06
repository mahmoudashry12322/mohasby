import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth/server";
import { body, fail, ok } from "@/lib/server/http";
import {
  accountSchema,
  addAccount,
  accountBalances,
} from "@/lib/accounting/accounts";

import { locked } from "@/lib/accounting/ledger";
// Helper function to build a hierarchical tree from flat accounts list
export interface AccountNode {
  id: number;
  companyId: number;
  code: string;
  name: string;
  nameEn: string | null;
  accountClass: string;
  mainGroup: string | null;
  subGroup: string | null;
  nature: string;
  statementType: string;
  level: number;
  parentCode: string | null;
  isGroup: boolean;
  isSystem: boolean;
  isActive: boolean;
  balance: number;
  children?: AccountNode[];
}

function buildTree(accounts: AccountNode[]): AccountNode[] {
  const map = new Map<string, AccountNode>();
  const roots: AccountNode[] = [];

  accounts.forEach((acc) => {
    map.set(acc.code, { ...acc, children: [] });
  });

  accounts.forEach((acc) => {
    const node = map.get(acc.code)!;
    if (acc.parentCode && map.has(acc.parentCode)) {
      map.get(acc.parentCode)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const actor = await authorize(request, request.method !== "GET");
    const companyId = actor.companyId;
    const accountClass = searchParams.get("class");
    const search = searchParams.get("search")?.trim();
    const asFlat = searchParams.get("flat") === "true";

    const rawAccounts = await locked(companyId, (tx) =>
      accountBalances(tx, companyId),
    );
    const accounts: AccountNode[] = rawAccounts.filter(
      (a) =>
        (!accountClass ||
          accountClass === "all" ||
          a.accountClass === accountClass) &&
        (!search ||
          [a.code, a.name, a.nameEn || ""].some((v) =>
            v.toLowerCase().includes(search.toLowerCase()),
          )),
    );
    const statsRaw = [
      "الأصول",
      "الخصوم",
      "حقوق الملكية",
      "الإيرادات",
      "المصروفات",
    ].map((accountClass) => ({
      accountClass,
      _count: {
        id: rawAccounts.filter((a) => a.accountClass === accountClass).length,
      },
    }));
    const stats = {
      total: accounts.length,
      assets: statsRaw.find((s) => s.accountClass === "الأصول")?._count.id || 0,
      liabilities:
        statsRaw.find((s) => s.accountClass === "الخصوم")?._count.id || 0,
      equity:
        statsRaw.find((s) => s.accountClass === "حقوق الملكية")?._count.id || 0,
      revenue:
        statsRaw.find((s) => s.accountClass === "الإيرادات")?._count.id || 0,
      expenses:
        statsRaw.find((s) => s.accountClass === "المصروفات")?._count.id || 0,
    };

    if (asFlat || search) {
      return NextResponse.json({
        success: true,
        stats,
        accounts,
      });
    }

    const tree = buildTree(accounts);

    return NextResponse.json({
      success: true,
      stats,
      accounts: tree,
      flatList: accounts,
    });
  } catch (error: any) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await authorize(request, true);
    const account = await addAccount(
      actor,
      accountSchema.parse(await body(request)),
    );
    return ok({ account, message: "تم إضافة الحساب" }, 201);
  } catch (error) {
    return fail(error);
  }
}
