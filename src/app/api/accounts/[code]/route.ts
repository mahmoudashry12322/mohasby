import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = parseInt(searchParams.get('companyId') || '1', 10);
    const { code } = params;

    const account = await prisma.account.findUnique({
      where: {
        companyId_code: {
          companyId,
          code,
        },
      },
      include: {
        children: {
          orderBy: { code: 'asc' },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'الحساب غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      account: {
        ...account,
        balance: Number(account.balance),
      },
    });
  } catch (error: any) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء جلب بيانات الحساب' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const body = await request.json();
    const companyId = parseInt(body.companyId || '1', 10);
    const { code } = params;

    const existing = await prisma.account.findUnique({
      where: {
        companyId_code: {
          companyId,
          code,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'الحساب غير موجود' },
        { status: 404 }
      );
    }

    const updated = await prisma.account.update({
      where: {
        companyId_code: {
          companyId,
          code,
        },
      },
      data: {
        name: body.name !== undefined ? body.name.trim() : existing.name,
        nameEn: body.nameEn !== undefined ? (body.nameEn?.trim() || null) : existing.nameEn,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحديث الحساب بنجاح',
      account: {
        ...updated,
        balance: Number(updated.balance),
      },
    });
  } catch (error: any) {
    console.error('Error updating account:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء تعديل بيانات الحساب' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = parseInt(searchParams.get('companyId') || '1', 10);
    const { code } = params;

    const existing = await prisma.account.findUnique({
      where: {
        companyId_code: {
          companyId,
          code,
        },
      },
      include: {
        children: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'الحساب غير موجود' },
        { status: 404 }
      );
    }

    if (existing.isSystem) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف حساب قياسي أساسي في النظام. يمكنك إيقاف تفعيله فقط.' },
        { status: 400 }
      );
    }

    if (existing.children && existing.children.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'لا يمكن حذف هذا الحساب لأنه يحتوي على حسابات فرعية متفرعة منه.',
        },
        { status: 400 }
      );
    }

    // Soft delete: toggle isActive to false
    const deactivated = await prisma.account.update({
      where: {
        companyId_code: {
          companyId,
          code,
        },
      },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تعطيل الحساب بنجاح',
      account: deactivated,
    });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء حذف الحساب' },
      { status: 500 }
    );
  }
}
