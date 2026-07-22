import { Response } from 'express';
import { prisma } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getCustomers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, status, customerType } = req.query;

    const whereClause: any = {};

    if (status && status !== 'ALL') {
      whereClause.status = status as string;
    }

    if (customerType && customerType !== 'ALL') {
      whereClause.customerType = customerType as string;
    }

    if (search) {
      const query = (search as string).trim();
      whereClause.OR = [
        { name: { contains: query } },
        { businessName: { contains: query } },
        { email: { contains: query } },
        { mobile: { contains: query } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { followUps: true, challans: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json({ success: true, count: customers.length, data: customers });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getCustomerById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUps: { orderBy: { createdAt: 'desc' } },
        challans: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    return res.json({ success: true, data: customer });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const createCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, mobile, email, businessName, gstNumber, customerType, address, status, followUpDate, notes } = req.body;

    if (!name || !mobile || !email || !businessName || !customerType || !address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, mobile, email, businessName, customerType, address',
      });
    }

    const newCustomer = await prisma.customer.create({
      data: {
        name,
        mobile,
        email,
        businessName,
        gstNumber: gstNumber || null,
        customerType,
        address,
        status: status || 'LEAD',
        followUpDate: followUpDate || null,
        notes: notes || null,
      },
    });

    if (notes) {
      await prisma.customerNote.create({
        data: {
          customerId: newCustomer.id,
          note: `Initial Note: ${notes}`,
          createdBy: req.user?.name || 'System',
        },
      });
    }

    return res.status(201).json({ success: true, message: 'Customer created successfully', data: newCustomer });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, mobile, email, businessName, gstNumber, customerType, address, status, followUpDate, notes } = req.body;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(mobile && { mobile }),
        ...(email && { email }),
        ...(businessName && { businessName }),
        ...(gstNumber !== undefined && { gstNumber }),
        ...(customerType && { customerType }),
        ...(address && { address }),
        ...(status && { status }),
        ...(followUpDate !== undefined && { followUpDate }),
        ...(notes !== undefined && { notes }),
      },
    });

    return res.json({ success: true, message: 'Customer updated successfully', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const addCustomerNote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({ success: false, error: 'Note text is required' });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const createdNote = await prisma.customerNote.create({
      data: {
        customerId: id,
        note,
        createdBy: req.user?.name || 'System',
      },
    });

    return res.status(201).json({ success: true, message: 'Follow-up note added', data: createdNote });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
