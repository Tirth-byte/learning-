const prisma = require('../config/prisma');

async function generateOrderReference() {
  const latestOrder = await prisma.rentalOrder.findFirst({
    orderBy: { id: 'desc' },
  });
  if (!latestOrder) return 'SO0001';
  
  const lastRef = latestOrder.reference;
  const match = lastRef.match(/SO(\d+)/);
  if (!match) return 'SO0001';

  const nextNum = parseInt(match[1], 10) + 1;
  return `SO${String(nextNum).padStart(4, '0')}`;
}

async function generateInvoiceReference() {
  const latestInvoice = await prisma.invoice.findFirst({
    orderBy: { id: 'desc' },
  });
  const year = new Date().getFullYear();
  
  if (!latestInvoice) return `INV/${year}/0001`;
  
  const lastRef = latestInvoice.reference; // INV/2026/0001
  const parts = lastRef.split('/');
  if (parts.length < 3) return `INV/${year}/0001`;

  const lastNum = parseInt(parts[2], 10);
  const nextNum = lastNum + 1;
  return `INV/${year}/${String(nextNum).padStart(4, '0')}`;
}

module.exports = {
  generateOrderReference,
  generateInvoiceReference,
};
