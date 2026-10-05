import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
    const companyId = parseInt(searchParams.get('companyId') || '1', 10);
    const accountClass = searchParams.get('class');
    const search = searchParams.get('search')?.trim();
    const asFlat = searchParams.get('flat') === 'true';

    const where: any = { companyId };

    if (accountClass && accountClass !== 'all') {
      where.accountClass = accountClass;
    }

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
      ];
    }

    const rawAccounts = await prisma.account.findMany({
      where,
      orderBy: { code: 'asc' },
    });

    const accounts: AccountNode[] = rawAccounts.map((a) => ({
      ...a,
      balance: Number(a.balance),
    }));

    // Calculate high-level stats for the whole company
    const statsRaw = await prisma.account.groupBy({
      by: ['accountClass'],
      where: { companyId },
      _count: { id: true },
    });

    const stats = {
      total: accounts.length,
      assets: statsRaw.find((s) => s.accountClass === 'الأصول')?._count.id || 0,
      liabilities: statsRaw.find((s) => s.accountClass === 'الخصوم')?._count.id || 0,
      equity: statsRaw.find((s) => s.accountClass === 'حقوق الملكية')?._count.id || 0,
      revenue: statsRaw.find((s) => s.accountClass === 'الإيرادات')?._count.id || 0,
      expenses: statsRaw.find((s) => s.accountClass === 'المصروفات')?._count.id || 0,
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
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء جلب دليل الحسابات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const companyId = parseInt(body.companyId || '1', 10);
    const {
      code,
      name,
      nameEn,
      accountClass,
      mainGroup,
      subGroup,
      nature,
      statementType,
      parentCode,
      isGroup = false,
    } = body;

    if (!code || !name || !accountClass || !nature || !statementType) {
      return NextResponse.json(
        {
          success: false,
          error: 'يرجى استكمال جميع البيانات الأساسية للحساب (الكود، الاسم، التصنيف، الطبيعة، القائمة المالية).',
        },
        { status: 400 }
      );
    }

    // Check code duplication for this company
    const existing = await prisma.account.findUnique({
      where: {
        companyId_code: {
          companyId,
          code: code.trim(),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `كود الحساب (${code}) مسجل بالفعل مسبقاً.` },
        { status: 409 }
      );
    }

    // If parentCode is specified, ensure it exists and mark it as isGroup: true
    let calculatedLevel = 1;
    if (parentCode) {
      const parent = await prisma.account.findUnique({
        where: {
          companyId_code: {
            companyId,
            code: parentCode,
          },
        },
      });

      if (!parent) {
        return NextResponse.json(
          { success: false, error: `الحساب الأب ذو الكود (${parentCode}) غير موجود.` },
          { status: 400 }
        );
      }

      calculatedLevel = parent.level + 1;

      // Update parent to be a group header if it wasn't already
      if (!parent.isGroup) {
        await prisma.account.update({
          where: {
            companyId_code: {
              companyId,
              code: parentCode,
            },
          },
          data: { isGroup: true },
        });
      }
    }

    const created = await prisma.account.create({
      data: {
        companyId,
        code: code.trim(),
        name: name.trim(),
        nameEn: nameEn?.trim() || null,
        accountClass,
        mainGroup: mainGroup || null,
        subGroup: subGroup || null,
        nature,
        statementType,
        level: calculatedLevel,
        parentCode: parentCode || null,
        isGroup: Boolean(isGroup),
        isSystem: false,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'تم إضافة الحساب بنجاح',
        account: {
          ...created,
          balance: Number(created.balance),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء حفظ الحساب الجديد' },
      { status: 500 }
    );
  }
}
