import { Response } from 'express';
import { prisma } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

// Helper to generate unique challan number SCH-YYYYMMDD-XXXX
const generateChallanNumber = async (): Promise<string> => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const countToday = await prisma.salesChallan.count();
  const sequence = String(countToday + 1).padStart(4, '0');
  return `SCH-${dateStr}-${sequence}`;
};

export const getChallans = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, search } = req.query;

    const whereClause: any = {};

    if (status && status !== 'ALL') {
      whereClause.status = status as string;
    }

    if (search) {
      const query = (search as string).trim();
      whereClause.OR = [
        { challanNumber: { contains: query } },
        { customerName: { contains: query } },
      ];
    }

    const challans = await prisma.salesChallan.findMany({
      where: whereClause,
      include: {
        customer: { select: { id: true, name: true, businessName: true, mobile: true, email: true, address: true, gstNumber: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, count: challans.length, data: challans });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getChallanById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!challan) {
      return res.status(404).json({ success: false, error: 'Sales Challan not found' });
    }

    return res.json({ success: true, data: challan });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const createChallan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customerId, items, status } = req.body; // status: DRAFT or CONFIRMED

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: customerId, items (non-empty array)',
      });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const challanStatus = status === 'CONFIRMED' ? 'CONFIRMED' : 'DRAFT';

    // Verify all requested products exist and fetch current prices & stock
    const productIds = items.map((i: any) => i.productId);
    const productsInDb = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(productsInDb.map((p) => [p.id, p]));

    // Validate items and check stock if confirming immediately
    let totalQuantity = 0;
    let totalAmount = 0;
    const preparedItems: Array<{
      productId: string;
      snapshotProductName: string;
      snapshotSKU: string;
      snapshotUnitPrice: number;
      quantity: number;
      subtotal: number;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(400).json({ success: false, error: `Product ID '${item.productId}' not found` });
      }

      const qty = Number(item.quantity);
      if (!qty || qty <= 0) {
        return res.status(400).json({ success: false, error: `Invalid quantity for product ${product.name}` });
      }

      if (challanStatus === 'CONFIRMED' && product.currentStock < qty) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for product '${product.name}' (${product.sku}). Available: ${product.currentStock}, Requested: ${qty}`,
        });
      }

      const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : product.unitPrice;
      const subtotal = unitPrice * qty;

      totalQuantity += qty;
      totalAmount += subtotal;

      preparedItems.push({
        productId: product.id,
        snapshotProductName: product.name,
        snapshotSKU: product.sku,
        snapshotUnitPrice: unitPrice,
        quantity: qty,
        subtotal,
      });
    }

    const challanNumber = await generateChallanNumber();
    const createdBy = req.user?.name || 'Sales Representative';

    // Execute in transaction
    const newChallan = await prisma.$transaction(async (tx) => {
      // 1. Create SalesChallan and items
      const created = await tx.salesChallan.create({
        data: {
          challanNumber,
          customerId,
          customerName: customer.businessName || customer.name,
          totalQuantity,
          totalAmount,
          status: challanStatus,
          createdBy,
          items: {
            create: preparedItems,
          },
        },
        include: { items: true, customer: true },
      });

      // 2. If CONFIRMED, deduce stock & log movement
      if (challanStatus === 'CONFIRMED') {
        for (const item of preparedItems) {
          const product = productMap.get(item.productId)!;
          const updatedStock = product.currentStock - item.quantity;

          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: updatedStock },
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              quantityChange: item.quantity,
              movementType: 'OUT',
              reason: `Sales Challan #${challanNumber}`,
              createdBy,
            },
          });
        }
      }

      return created;
    });

    return res.status(201).json({
      success: true,
      message: `Sales Challan #${challanNumber} created (${challanStatus})`,
      data: newChallan,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateChallanStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // CONFIRMED or CANCELLED

    if (!['CONFIRMED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be CONFIRMED or CANCELLED' });
    }

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) {
      return res.status(404).json({ success: false, error: 'Sales Challan not found' });
    }

    if (challan.status === status) {
      return res.status(400).json({ success: false, error: `Challan is already in status ${status}` });
    }

    if (challan.status === 'CANCELLED') {
      return res.status(400).json({ success: false, error: 'Cancelled challans cannot be updated' });
    }

    const updatedBy = req.user?.name || 'System';

    if (status === 'CONFIRMED' && challan.status === 'DRAFT') {
      // Validate stock availability for all items before confirming
      const productIds = challan.items.map((i) => i.productId);
      const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of challan.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          return res.status(400).json({ success: false, error: `Product '${item.snapshotProductName}' no longer exists` });
        }
        if (product.currentStock < item.quantity) {
          return res.status(400).json({
            success: false,
            error: `Cannot confirm: Insufficient stock for product '${product.name}' (${product.sku}). Current: ${product.currentStock}, Needed: ${item.quantity}`,
          });
        }
      }

      // Transaction: confirm & deduct stock & record logs
      const updatedChallan = await prisma.$transaction(async (tx) => {
        const updated = await tx.salesChallan.update({
          where: { id },
          data: { status: 'CONFIRMED' },
          include: { items: true, customer: true },
        });

        for (const item of challan.items) {
          const product = productMap.get(item.productId)!;
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: product.currentStock - item.quantity },
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              quantityChange: item.quantity,
              movementType: 'OUT',
              reason: `Sales Challan #${challan.challanNumber} Confirmed`,
              createdBy: updatedBy,
            },
          });
        }

        return updated;
      });

      return res.json({
        success: true,
        message: `Challan #${challan.challanNumber} confirmed and stock updated`,
        data: updatedChallan,
      });
    }

    if (status === 'CANCELLED' && challan.status === 'CONFIRMED') {
      // Revert stock if a confirmed challan is cancelled
      const updatedChallan = await prisma.$transaction(async (tx) => {
        const updated = await tx.salesChallan.update({
          where: { id },
          data: { status: 'CANCELLED' },
          include: { items: true, customer: true },
        });

        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } },
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              quantityChange: item.quantity,
              movementType: 'IN',
              reason: `Revert: Sales Challan #${challan.challanNumber} Cancelled`,
              createdBy: updatedBy,
            },
          });
        }

        return updated;
      });

      return res.json({
        success: true,
        message: `Challan #${challan.challanNumber} cancelled and stock restored`,
        data: updatedChallan,
      });
    }

    // Default cancel draft
    const updated = await prisma.salesChallan.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { items: true, customer: true },
    });

    return res.json({ success: true, message: `Challan #${challan.challanNumber} cancelled`, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
