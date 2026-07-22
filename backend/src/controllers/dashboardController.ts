import { Response } from 'express';
import { prisma } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalCustomers = await prisma.customer.count();
    const activeCustomers = await prisma.customer.count({ where: { status: 'ACTIVE' } });
    const leadCustomers = await prisma.customer.count({ where: { status: 'LEAD' } });

    const products = await prisma.product.findMany();
    const totalProducts = products.length;
    const totalStockQuantity = products.reduce((sum, p) => sum + p.currentStock, 0);
    const totalStockValue = products.reduce((sum, p) => sum + p.currentStock * p.unitPrice, 0);
    const lowStockProducts = products.filter((p) => p.currentStock <= p.minStockAlert);

    const totalChallans = await prisma.salesChallan.count();
    const confirmedChallans = await prisma.salesChallan.findMany({ where: { status: 'CONFIRMED' } });
    const totalSalesAmount = confirmedChallans.reduce((sum, c) => sum + c.totalAmount, 0);

    const recentLogs = await prisma.stockLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { name: true, sku: true } } },
    });

    const recentChallans = await prisma.salesChallan.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: {
        customers: {
          total: totalCustomers,
          active: activeCustomers,
          lead: leadCustomers,
        },
        inventory: {
          totalProducts,
          totalStockQuantity,
          totalStockValue,
          lowStockCount: lowStockProducts.length,
          lowStockItems: lowStockProducts.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            currentStock: p.currentStock,
            minStockAlert: p.minStockAlert,
          })),
        },
        sales: {
          totalChallans,
          confirmedCount: confirmedChallans.length,
          totalSalesAmount,
        },
        recentLogs,
        recentChallans,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
