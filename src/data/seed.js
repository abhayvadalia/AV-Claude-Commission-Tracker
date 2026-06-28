// Seeded, realistic sample data for the Fabric Commission Tracker prototype.
// Currency: INR. "Today" is fixed at 2026-06-28 (see lib/format.today) so aging is stable.
//
// Data model (see requirements doc §2):
//   manufacturers (vendors)  customers (buyers)
//   orders -> lines (with per-line commission term: % or fixed)
//   invoices -> lines  (each invoice line bills a portion of one order line)
//                       => order<->invoice many-to-many is derived from these lines
//   payments (against invoices) -> trigger commission accruals (computed, see lib/commission)

export const seed = () => ({
  manufacturers: [
    { id: 'M1', name: 'Surat Silk Mills', contact: 'Rajesh Mehta', location: 'Surat, GJ', defaultCommission: { type: 'percent', value: 4 } },
    { id: 'M2', name: 'Bhilwara Suitings Ltd', contact: 'Sunil Agarwal', location: 'Bhilwara, RJ', defaultCommission: { type: 'percent', value: 3 } },
    { id: 'M3', name: 'Erode Cotton Co', contact: 'K. Subramani', location: 'Erode, TN', defaultCommission: { type: 'percent', value: 5 } },
    { id: 'M4', name: 'Ludhiana Knit Fab', contact: 'Harpreet Singh', location: 'Ludhiana, PB', defaultCommission: { type: 'percent', value: 3.5 } },
  ],

  customers: [
    { id: 'C1', name: 'Anand Garments', contact: 'Anand Shah', location: 'Mumbai, MH', creditTermsDays: 30 },
    { id: 'C2', name: 'Reliable Apparels', contact: 'Pooja Nair', location: 'New Delhi, DL', creditTermsDays: 45 },
    { id: 'C3', name: 'Trendz Boutique', contact: 'Megha Rao', location: 'Bengaluru, KA', creditTermsDays: 15 },
    { id: 'C4', name: 'Metro Textiles Trading', contact: 'Imran Sheikh', location: 'Ahmedabad, GJ', creditTermsDays: 60 },
    { id: 'C5', name: 'Sunrise Fashions', contact: 'Vikram Joshi', location: 'Jaipur, RJ', creditTermsDays: 30 },
  ],

  // Orders. status is derived from line fulfilment (see lib/commission.orderStatus).
  orders: [
    {
      id: 'ORD-1001', customerId: 'C1', manufacturerId: 'M1', date: '2026-03-05',
      lines: [
        { id: 'ORD-1001-L1', desc: 'Banarasi Silk (premium)', unit: 'm', qty: 500, qtyFulfilled: 500, rate: 220, commission: { type: 'percent', value: 4 } },
        { id: 'ORD-1001-L2', desc: 'Dupion Silk', unit: 'm', qty: 300, qtyFulfilled: 300, rate: 180, commission: { type: 'percent', value: 4 } },
      ],
    },
    {
      id: 'ORD-1002', customerId: 'C2', manufacturerId: 'M2', date: '2026-03-18',
      lines: [
        { id: 'ORD-1002-L1', desc: 'Poly-Viscose Suiting', unit: 'm', qty: 800, qtyFulfilled: 800, rate: 150, commission: { type: 'percent', value: 3 } },
        { id: 'ORD-1002-L2', desc: 'Wool-blend Suiting', unit: 'm', qty: 400, qtyFulfilled: 200, rate: 260, commission: { type: 'percent', value: 3 } },
      ],
    },
    {
      id: 'ORD-1003', customerId: 'C3', manufacturerId: 'M3', date: '2026-04-02',
      lines: [
        { id: 'ORD-1003-L1', desc: 'Cotton Cambric', unit: 'm', qty: 1200, qtyFulfilled: 1200, rate: 70, commission: { type: 'fixed', value: 3000 } },
      ],
    },
    {
      id: 'ORD-1004', customerId: 'C1', manufacturerId: 'M3', date: '2026-04-10',
      lines: [
        { id: 'ORD-1004-L1', desc: 'Cotton Poplin', unit: 'm', qty: 1000, qtyFulfilled: 1000, rate: 85, commission: { type: 'percent', value: 5 } },
        { id: 'ORD-1004-L2', desc: 'Cotton Twill', unit: 'm', qty: 600, qtyFulfilled: 600, rate: 110, commission: { type: 'percent', value: 5 } },
      ],
    },
    {
      id: 'ORD-1005', customerId: 'C4', manufacturerId: 'M1', date: '2026-04-22',
      lines: [
        { id: 'ORD-1005-L1', desc: 'Chiffon', unit: 'm', qty: 700, qtyFulfilled: 700, rate: 95, commission: { type: 'percent', value: 4 } },
        { id: 'ORD-1005-L2', desc: 'Georgette', unit: 'm', qty: 500, qtyFulfilled: 0, rate: 120, commission: { type: 'percent', value: 4 } },
      ],
    },
    {
      id: 'ORD-1006', customerId: 'C5', manufacturerId: 'M4', date: '2026-05-04',
      lines: [
        { id: 'ORD-1006-L1', desc: 'Cotton Jersey Knit', unit: 'm', qty: 900, qtyFulfilled: 900, rate: 130, commission: { type: 'fixed', value: 4500 } },
      ],
    },
    {
      id: 'ORD-1007', customerId: 'C2', manufacturerId: 'M4', date: '2026-05-15',
      lines: [
        { id: 'ORD-1007-L1', desc: 'Pique Knit', unit: 'm', qty: 600, qtyFulfilled: 0, rate: 140, commission: { type: 'percent', value: 3.5 } },
        { id: 'ORD-1007-L2', desc: 'Interlock Knit', unit: 'm', qty: 400, qtyFulfilled: 0, rate: 160, commission: { type: 'percent', value: 3.5 } },
      ],
    },
    {
      id: 'ORD-1008', customerId: 'C4', manufacturerId: 'M2', date: '2026-05-28',
      lines: [
        { id: 'ORD-1008-L1', desc: 'Premium Worsted Suiting', unit: 'm', qty: 500, qtyFulfilled: 0, rate: 420, commission: { type: 'percent', value: 3 } },
      ],
    },
    {
      id: 'ORD-1009', customerId: 'C3', manufacturerId: 'M1', date: '2026-06-08',
      lines: [
        { id: 'ORD-1009-L1', desc: 'Silk Organza', unit: 'm', qty: 400, qtyFulfilled: 250, rate: 160, commission: { type: 'percent', value: 4 } },
      ],
    },
    {
      id: 'ORD-1010', customerId: 'C3', manufacturerId: 'M3', date: '2026-04-05',
      lines: [
        { id: 'ORD-1010-L1', desc: 'Cotton Voile', unit: 'm', qty: 800, qtyFulfilled: 800, rate: 65, commission: { type: 'fixed', value: 2000 } },
      ],
    },
  ],

  // Invoices. Each line bills `amount` of a specific order line.
  // Many-to-many is realised here:
  //  - INV-E-3310 bundles TWO orders (ORD-1003 + ORD-1010) on one invoice.
  //  - ORD-1002 is split ACROSS two invoices (INV-B-7741 + INV-B-7742).
  invoices: [
    {
      id: 'INV-S-2201', manufacturerId: 'M1', customerId: 'C1', date: '2026-03-12', dueDate: '2026-04-11',
      lines: [
        { orderId: 'ORD-1001', orderLineId: 'ORD-1001-L1', amount: 110000 },
        { orderId: 'ORD-1001', orderLineId: 'ORD-1001-L2', amount: 54000 },
      ],
    },
    {
      id: 'INV-B-7741', manufacturerId: 'M2', customerId: 'C2', date: '2026-03-25', dueDate: '2026-05-09',
      lines: [
        { orderId: 'ORD-1002', orderLineId: 'ORD-1002-L1', amount: 120000 },
      ],
    },
    {
      id: 'INV-B-7742', manufacturerId: 'M2', customerId: 'C2', date: '2026-05-02', dueDate: '2026-06-16',
      lines: [
        { orderId: 'ORD-1002', orderLineId: 'ORD-1002-L2', amount: 52000 },
      ],
    },
    {
      id: 'INV-E-3310', manufacturerId: 'M3', customerId: 'C3', date: '2026-04-15', dueDate: '2026-04-30',
      lines: [
        { orderId: 'ORD-1003', orderLineId: 'ORD-1003-L1', amount: 84000 },
        { orderId: 'ORD-1010', orderLineId: 'ORD-1010-L1', amount: 52000 },
      ],
    },
    {
      id: 'INV-E-3320', manufacturerId: 'M3', customerId: 'C1', date: '2026-04-18', dueDate: '2026-05-18',
      lines: [
        { orderId: 'ORD-1004', orderLineId: 'ORD-1004-L1', amount: 85000 },
        { orderId: 'ORD-1004', orderLineId: 'ORD-1004-L2', amount: 66000 },
      ],
    },
    {
      id: 'INV-S-2210', manufacturerId: 'M1', customerId: 'C4', date: '2026-04-28', dueDate: '2026-06-27',
      lines: [
        { orderId: 'ORD-1005', orderLineId: 'ORD-1005-L1', amount: 66500 },
      ],
    },
    {
      id: 'INV-K-9001', manufacturerId: 'M4', customerId: 'C5', date: '2026-05-10', dueDate: '2026-06-09',
      lines: [
        { orderId: 'ORD-1006', orderLineId: 'ORD-1006-L1', amount: 117000 },
      ],
    },
    {
      id: 'INV-S-2230', manufacturerId: 'M1', customerId: 'C3', date: '2026-06-12', dueDate: '2026-06-27',
      lines: [
        { orderId: 'ORD-1009', orderLineId: 'ORD-1009-L1', amount: 40000 },
      ],
    },
  ],

  // Payments against invoices. These trigger commission accruals.
  payments: [
    { id: 'PMT-5001', invoiceId: 'INV-S-2201', date: '2026-04-05', amount: 164000, mode: 'Bank transfer', reference: 'NEFT-8841' },
    { id: 'PMT-5002', invoiceId: 'INV-B-7741', date: '2026-04-20', amount: 60000, mode: 'Cheque', reference: 'CHQ-220114' },
    { id: 'PMT-5003', invoiceId: 'INV-E-3310', date: '2026-04-28', amount: 136000, mode: 'UPI', reference: 'UPI-7G9K2' },
    { id: 'PMT-5004', invoiceId: 'INV-E-3320', date: '2026-05-10', amount: 100000, mode: 'Bank transfer', reference: 'NEFT-9012' },
    { id: 'PMT-5005', invoiceId: 'INV-K-9001', date: '2026-06-01', amount: 70000, mode: 'UPI', reference: 'UPI-4T1M8' },
  ],

  // Commission accruals are computed from payments at runtime (see lib/commission.computeAccruals),
  // so recording a new payment automatically generates new accruals. Settlement status (the
  // manufacturer having paid the distributor) is tracked here as an override by accrual id.
  settledAccrualIds: ['PMT-5001#ORD-1001-L1', 'PMT-5001#ORD-1001-L2'],
})
