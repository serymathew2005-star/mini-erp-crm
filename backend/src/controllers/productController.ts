import { Response } from 'express';
import { prisma } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, category, lowStock } = req.query;

    const whereClause: any = {};

    if (category && category !== 'ALL') {
      whereClause.category = category as string;
    }

    if (search) {
      const query = (search as string).trim();
      whereClause.OR = [
        { name: { contains: query } },
        { sku: { contains: query } },
        { category: { contains: query } },
        { location: { contains: query } },
      ];
    }

    let products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    if (lowStock === 'true') {
      products = products.filter((p) => p.currentStock <= p.minStockAlert);
    }

    return res.json({ success: true, count: products.length, data: products });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getProductById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockLogs: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    return res.json({ success: true, data: product });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, sku, category, unitPrice, currentStock, minStockAlert, location, imageUrl } = req.body;

    if (!name || !sku || !category || unitPrice === undefined || currentStock === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, sku, category, unitPrice, currentStock',
      });
    }

    const existingSku = await prisma.product.findUnique({ where: { sku: sku.trim() } });
    if (existingSku) {
      return res.status(400).json({ success: false, error: `SKU '${sku}' already exists` });
    }

    const initialStock = Number(currentStock);
    const price = Number(unitPrice);
    const minAlert = minStockAlert !== undefined ? Number(minStockAlert) : 10;

    const newProduct = await prisma.product.create({
      data: {
        name,
        sku: sku.trim(),
        category,
        unitPrice: price,
        currentStock: initialStock,
        minStockAlert: minAlert,
        location: location || 'Warehouse Main',
        imageUrl: imageUrl || null,
      },
    });

    // Record initial stock movement log if stock > 0
    if (initialStock > 0) {
      await prisma.stockLog.create({
        data: {
          productId: newProduct.id,
          quantityChange: initialStock,
          movementType: 'IN',
          reason: 'Initial stock setup',
          createdBy: req.user?.name || 'System',
        },
      });
    }

    return res.status(201).json({ success: true, message: 'Product created successfully', data: newProduct });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, sku, category, unitPrice, minStockAlert, location, imageUrl } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(sku && { sku: sku.trim() }),
        ...(category && { category }),
        ...(unitPrice !== undefined && { unitPrice: Number(unitPrice) }),
        ...(minStockAlert !== undefined && { minStockAlert: Number(minStockAlert) }),
        ...(location && { location }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    return res.json({ success: true, message: 'Product details updated', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const adjustStock = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { quantityChange, movementType, reason } = req.body;

    if (!quantityChange || !movementType || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: quantityChange, movementType (IN/OUT), reason',
      });
    }

    const qty = Math.abs(Number(quantityChange));
    if (qty <= 0) {
      return res.status(400).json({ success: false, error: 'Quantity change must be greater than 0' });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    let newStock = product.currentStock;
    if (movementType === 'IN') {
      newStock += qty;
    } else if (movementType === 'OUT') {
      if (product.currentStock < qty) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${product.name}. Current stock: ${product.currentStock}, requested reduction: ${qty}`,
        });
      }
      newStock -= qty;
    } else {
      return res.status(400).json({ success: false, error: 'movementType must be IN or OUT' });
    }

    // Atomic transaction for stock update and stock log entry
    const [updatedProduct, newLog] = await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: { currentStock: newStock },
      }),
      prisma.stockLog.create({
        data: {
          productId: id,
          quantityChange: qty,
          movementType,
          reason,
          createdBy: req.user?.name || 'Warehouse Staff',
        },
      }),
    ]);

    return res.json({
      success: true,
      message: `Stock successfully adjusted (${movementType} ${qty})`,
      data: {
        product: updatedProduct,
        log: newLog,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getStockLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await prisma.stockLog.findMany({
      include: {
        product: { select: { name: true, sku: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.json({ success: true, count: logs.length, data: logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
