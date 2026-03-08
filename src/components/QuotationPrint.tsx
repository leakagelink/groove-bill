import { Quotation } from '@/types/billing';
import { useEffect } from 'react';

interface QuotationPrintProps {
  quotation: Quotation;
  onClose: () => void;
}

export default function QuotationPrint({ quotation, onClose }: QuotationPrintProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="print-area" style={{ width: '148mm', minHeight: '210mm', padding: '8mm' }}>
        <div style={{ textAlign: 'center', marginBottom: '12px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>CHR</h1>
          <p style={{ fontSize: '10px', margin: '2px 0' }}>Quotation</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '10px' }}>
          <div>
            <strong>Quotation:</strong> {quotation.quotationNumber}<br />
            <strong>Date:</strong> {new Date(quotation.date).toLocaleDateString('en-IN')}
            {quotation.validUntil && <><br /><strong>Valid Until:</strong> {new Date(quotation.validUntil).toLocaleDateString('en-IN')}</>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <strong>Customer:</strong> {quotation.customerName}<br />
            {quotation.customerPhone && <><strong>Phone:</strong> {quotation.customerPhone}<br /></>}
            {quotation.customerAddress && <><strong>Address:</strong> {quotation.customerAddress}</>}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '10px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <th style={{ textAlign: 'left', padding: '4px' }}>#</th>
              <th style={{ textAlign: 'left', padding: '4px' }}>Item</th>
              <th style={{ textAlign: 'left', padding: '4px' }}>Brand</th>
              <th style={{ textAlign: 'right', padding: '4px' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '4px' }}>Price</th>
              <th style={{ textAlign: 'right', padding: '4px' }}>Disc</th>
              <th style={{ textAlign: 'right', padding: '4px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {quotation.items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px dotted #ccc' }}>
                <td style={{ padding: '3px 4px' }}>{idx + 1}</td>
                <td style={{ padding: '3px 4px' }}>{item.productName}</td>
                <td style={{ padding: '3px 4px' }}>{item.brandName}</td>
                <td style={{ textAlign: 'right', padding: '3px 4px' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right', padding: '3px 4px' }}>₹{item.price}</td>
                <td style={{ textAlign: 'right', padding: '3px 4px' }}>{item.discount}%</td>
                <td style={{ textAlign: 'right', padding: '3px 4px' }}>₹{item.total}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: '1px solid #000', paddingTop: '6px', fontSize: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Total Amount:</span><span>₹{quotation.totalAmount.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Discount:</span><span>-₹{quotation.totalDiscount.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px', marginTop: '4px' }}>
            <span>Final Amount:</span><span>₹{quotation.finalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {quotation.notes && (
          <div style={{ marginTop: '10px', fontSize: '9px', borderTop: '1px dotted #ccc', paddingTop: '6px' }}>
            <strong>Notes:</strong> {quotation.notes}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '9px', color: '#666' }}>
          This is a quotation and not a bill. Prices may vary.
        </div>
      </div>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 no-print">
        <div className="bg-card rounded-lg border p-6 max-w-sm w-full mx-4 text-center space-y-3">
          <p className="text-foreground font-medium">Print dialog opened</p>
          <p className="text-sm text-muted-foreground">Quotation set to half A4 size (A5)</p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
