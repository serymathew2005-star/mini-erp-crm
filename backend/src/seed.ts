import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database for Mini ERP + CRM Portal...');

  // Clear existing data
  await prisma.salesChallanItem.deleteMany();
  await prisma.salesChallan.deleteMany();
  await prisma.stockLog.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customerNote.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // Create test credentials for 4 roles
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedSalesPassword = await bcrypt.hash('sales123', 10);
  const hashedWhPassword = await bcrypt.hash('wh123', 10);
  const hashedAccPassword = await bcrypt.hash('acc123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@minierp.com',
      password: hashedAdminPassword,
      role: 'ADMIN',
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      name: 'Rajesh Sharma (Sales Manager)',
      email: 'sales@minierp.com',
      password: hashedSalesPassword,
      role: 'SALES',
    },
  });

  const warehouseUser = await prisma.user.create({
    data: {
      name: 'Vikram Singh (Warehouse Head)',
      email: 'warehouse@minierp.com',
      password: hashedWhPassword,
      role: 'WAREHOUSE',
    },
  });

  const accountsUser = await prisma.user.create({
    data: {
      name: 'Priya Verma (Senior Accountant)',
      email: 'accounts@minierp.com',
      password: hashedAccPassword,
      role: 'ACCOUNTS',
    },
  });

  console.log('✅ Created 4 System Users with Roles (Admin, Sales, Warehouse, Accounts)');

  // Seed Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Amit Patel',
      mobile: '+91 9876543210',
      email: 'amit@apexdistributors.com',
      businessName: 'Apex Wholesale Traders',
      gstNumber: '27AAAAA0000A1Z5',
      customerType: 'WHOLESALE',
      address: 'Plot 45, MIDC Industrial Area, Mumbai, Maharashtra 400093',
      status: 'ACTIVE',
      followUpDate: '2026-07-28',
      notes: 'Interested in bulk orders for Q3 electronics lineup.',
      followUps: {
        create: [
          {
            note: 'Initial phone call - confirmed interest in wholesale catalog.',
            createdBy: salesUser.name,
          },
          {
            note: 'Sent price list & catalog via email.',
            createdBy: salesUser.name,
          },
        ],
      },
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Sunita Rao',
      mobile: '+91 9123456789',
      email: 'sunita@metroretailers.in',
      businessName: 'Metro Supermart Pvt Ltd',
      gstNumber: '29BBBBA1111B2Z3',
      customerType: 'RETAIL',
      address: '102 Commercial Plaza, MG Road, Bengaluru, Karnataka 560001',
      status: 'ACTIVE',
      followUpDate: '2026-07-25',
      notes: 'Prefers weekly credit payments.',
      followUps: {
        create: [
          {
            note: 'Requested quotation for 50 units of LED Monitors.',
            createdBy: salesUser.name,
          },
        ],
      },
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Karan Malhotra',
      mobile: '+91 9988776655',
      email: 'karan@malhotra-distributors.com',
      businessName: 'Malhotra Tech Supplies',
      gstNumber: '07CCCCA2222C3Z1',
      customerType: 'DISTRIBUTOR',
      address: 'G-12 Nehru Place, New Delhi 110019',
      status: 'LEAD',
      followUpDate: '2026-07-30',
      notes: 'New prospective distributor for North India region.',
    },
  });

  console.log('✅ Created sample Customers with Follow-up notes');

  // Seed Products
  const prod1 = await prisma.product.create({
    data: {
      name: 'UltraWide 27" IPS Monitor 144Hz',
      sku: 'MON-27-IPS',
      category: 'Electronics',
      unitPrice: 18500.0,
      currentStock: 45,
      minStockAlert: 10,
      location: 'Warehouse A - Rack 04',
      imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400',
    },
  });

  const prod2 = await prisma.product.create({
    data: {
      name: 'Ergonomic Wireless Mechanical Keyboard',
      sku: 'KEY-MECH-WRL',
      category: 'Peripherals',
      unitPrice: 4200.0,
      currentStock: 8, // Low stock alert!
      minStockAlert: 15,
      location: 'Warehouse B - Shelf 02',
      imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
    },
  });

  const prod3 = await prisma.product.create({
    data: {
      name: 'Pro Noise Cancelling Wireless Headset',
      sku: 'AUD-NC-HEADSET',
      category: 'Audio',
      unitPrice: 6500.0,
      currentStock: 120,
      minStockAlert: 20,
      location: 'Warehouse A - Rack 12',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    },
  });

  const prod4 = await prisma.product.create({
    data: {
      name: 'USB-C Docking Station 11-in-1',
      sku: 'ACC-USBC-DOCK',
      category: 'Accessories',
      unitPrice: 3800.0,
      currentStock: 4, // Critical stock!
      minStockAlert: 10,
      location: 'Warehouse B - Bin 05',
    },
  });

  console.log('✅ Created sample Products in Inventory');

  // Stock Movement Logs
  await prisma.stockLog.createMany({
    data: [
      {
        productId: prod1.id,
        quantityChange: 50,
        movementType: 'IN',
        reason: 'Shipment received from manufacturer',
        createdBy: warehouseUser.name,
      },
      {
        productId: prod2.id,
        quantityChange: 20,
        movementType: 'IN',
        reason: 'Restock batch #882',
        createdBy: warehouseUser.name,
      },
      {
        productId: prod2.id,
        quantityChange: 12,
        movementType: 'OUT',
        reason: 'Damage/Defect isolation',
        createdBy: warehouseUser.name,
      },
    ],
  });

  console.log('✅ Seeded Stock Movement Logs');

  // Seed Sales Challan
  const challanDateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
  // Confirmed Challan
  const challan1 = await prisma.salesChallan.create({
    data: {
      challanNumber: `SCH-${challanDateStr}-0001`,
      customerId: customer1.id,
      customerName: customer1.businessName,
      totalQuantity: 5,
      totalAmount: 5 * prod1.unitPrice,
      status: 'CONFIRMED',
      createdBy: salesUser.name,
      items: {
        create: [
          {
            productId: prod1.id,
            snapshotProductName: prod1.name,
            snapshotSKU: prod1.sku,
            snapshotUnitPrice: prod1.unitPrice,
            quantity: 5,
            subtotal: 5 * prod1.unitPrice,
          },
        ],
      },
    },
  });

  // Draft Challan
  const challan2 = await prisma.salesChallan.create({
    data: {
      challanNumber: `SCH-${challanDateStr}-0002`,
      customerId: customer2.id,
      customerName: customer2.businessName,
      totalQuantity: 2,
      totalAmount: 2 * prod3.unitPrice,
      status: 'DRAFT',
      createdBy: salesUser.name,
      items: {
        create: [
          {
            productId: prod3.id,
            snapshotProductName: prod3.name,
            snapshotSKU: prod3.sku,
            snapshotUnitPrice: prod3.unitPrice,
            quantity: 2,
            subtotal: 2 * prod3.unitPrice,
          },
        ],
      },
    },
  });

  console.log('✅ Created sample Sales Challans (Confirmed & Draft)');

  console.log('\n=======================================================');
  console.log('🎉 Seed complete! Summary of default test logins:');
  console.log('-------------------------------------------------------');
  console.log('1. ADMIN:     admin@minierp.com     / admin123');
  console.log('2. SALES:     sales@minierp.com     / sales123');
  console.log('3. WAREHOUSE: warehouse@minierp.com / wh123');
  console.log('4. ACCOUNTS:  accounts@minierp.com  / acc123');
  console.log('=======================================================\n');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
