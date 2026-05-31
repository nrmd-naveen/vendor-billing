'use client';

import { Purchase } from '@/lib/types';
import { useSettings } from '@/lib/useSettings';
import { Printer, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import { fmtINR } from '@/lib/format';

interface PurchaseBillPreviewProps {
  purchase: Purchase;
  shopPhone?: string;
  showPrintButton?: boolean;
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function PurchaseBillPreview({ purchase, shopPhone, showPrintButton = true }: PurchaseBillPreviewProps) {
  const { settings } = useSettings();

  const totalSacks = purchase.items.reduce((s, i) => s + i.sacks.length, 0);
  const totalWeight = purchase.items.reduce((s, i) => s + i.totalWeight, 0);

  const handleDownload = async (format: 'pdf' | 'photo') => {
    const el = document.getElementById('purchase-bill-print-area');
    if (!el) return;
    const elWidth = el.offsetWidth;
    const elHeight = el.offsetHeight;
    const dataUrl = await toPng(el, { cacheBust: true, backgroundColor: '#ffffff', quality: 1, pixelRatio: 2 });

    if (format === 'photo') {
      const a = document.createElement('a');
      a.download = `purchase-${purchase.purchaseNumber}.png`;
      a.href = dataUrl;
      a.click();
    } else {
      const { jsPDF } = await import('jspdf');
      const pdfWidth = elWidth * 0.75;
      const pdfHeight = elHeight * 0.75;
      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
        unit: 'pt',
        format: [pdfWidth, pdfHeight],
      });
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`purchase-${purchase.purchaseNumber}.pdf`);
    }
  };

  return (
    <div className="bg-white">
      {showPrintButton && (
        <div className="flex justify-end gap-2 p-4 border-b border-gray-100 print:hidden">
          <button
            onClick={() => handleDownload('pdf')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Save PDF
          </button>
          <button
            onClick={() => handleDownload('photo')}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Save Photo
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      )}

      <div
        id="purchase-bill-print-area"
        className="p-4 print:p-0"
        style={{ fontFamily: "var(--font-noto-tamil), 'Noto Sans Tamil', 'Latha', Arial, sans-serif", fontSize: '13px' }}
      >
        <div className="border-2 border-gray-700 max-w-2xl mx-auto print:max-w-full print:border-black">

          {/* Header */}
          <div className="border-b border-gray-700 print:border-black text-center px-3 py-2">
            {settings.tagline && (
              <div className="text-[11px] text-gray-600 mb-1">{settings.tagline}</div>
            )}
            <div className="flex items-center justify-between">
              <div className="w-20 h-20 flex items-center justify-center shrink-0">
                {settings.logoLeft ? (
                  <img src={settings.logoLeft} alt="logo" className="w-20 h-20 object-contain" />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded" />
                )}
              </div>
              <div className="flex-1 text-center px-2">
                <div className="text-3xl font-extrabold text-green-700 leading-tight">{settings.name}</div>
                {settings.subtitle && (
                  <div className="text-sm font-semibold text-gray-700 mt-0.5">{settings.subtitle}</div>
                )}
                {settings.address && (
                  <div className="text-xs text-gray-600 mt-0.5">{settings.address}</div>
                )}
              </div>
              <div className="w-20 h-20 flex items-center justify-center shrink-0">
                {settings.logoRight ? (
                  <img src={settings.logoRight} alt="logo" className="w-20 h-20 object-contain" />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded" />
                )}
              </div>
            </div>
          </div>

          {/* Contact bar */}
          {(settings.contact1Name || settings.contact2Name) && (
            <div className="border-b border-gray-700 print:border-black grid grid-cols-3 items-center px-2 py-1.5">
              <div className="text-xs">
                {settings.contact1Name && <div className="font-semibold">{settings.contact1Name}</div>}
                {settings.contact1Phone && <div className="font-semibold">{settings.contact1Phone}</div>}
              </div>
              <div className="text-center font-bold text-sm">கொள்முதல் பட்டியல்</div>
              <div className="text-right text-xs">
                {settings.contact2Name && <div className="font-semibold">{settings.contact2Name}</div>}
                {settings.contact2Phone && <div className="font-semibold">{settings.contact2Phone}</div>}
              </div>
            </div>
          )}

          {/* Bill meta */}
          <div className="border-b border-gray-700 print:border-black flex justify-between items-center px-3 py-1.5">
            <div className="whitespace-nowrap">
              <span className="font-semibold">எண் : </span>
              <span className="text-red-600 font-bold text-base">{purchase.purchaseNumber}</span>
            </div>
            <div className="text-center font-bold text-sm">கொள்முதல் பட்டியல்</div>
            <div className="whitespace-nowrap">
              <span className="font-semibold">தேதி : </span>
              <span className="font-medium">{formatDate(purchase.date)}</span>
            </div>
          </div>

          {/* Shop name */}
          <div className="border-b border-gray-700 print:border-black px-3 py-1 flex items-center justify-between">
            <div>
              <span className="font-semibold text-xs text-gray-600 mr-1">கடை :</span>
              <span className="font-bold text-base">{purchase.shopName}</span>
            </div>
            {shopPhone && <div className="text-xs text-gray-500">{shopPhone}</div>}
          </div>

          {/* Items table */}
          <table className="w-full border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '10%' }} />
              <col style={{ width: '36%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '18%' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-700 print:border-black">
                {['விலை', 'விபரம்', 'மூடை', 'எடை', 'தொகை', ''].map((h, i) => (
                  <th
                    key={i}
                    className={`py-1.5 px-1 font-bold border-gray-700 print:border-black ${i < 5 ? 'border-r' : ''} ${i === 0 || i >= 2 ? 'text-center' : 'text-left'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {purchase.items.map((item, idx) => (
                <tr key={idx} className="align-top">
                  <td className="py-1.5 px-1 text-right border-r border-gray-400">
                    {fmtINR(item.pricePerKg, 2)}
                  </td>
                  <td className="py-1.5 px-2 border-r border-gray-400">
                    <div className="flex flex-wrap items-baseline gap-1">
                      <span className="font-bold text-[11px]">{item.vegetableName}</span>
                      {item.description && (
                        <span className="text-gray-700 font-semibold text-[11px]">{item.description}</span>
                      )}
                    </div>
                    {item.sacks.length > 0 && (
                      <div className="text-red-600 text-[11px] mt-0.5">
                        {item.sacks.map((s) => s.weight).join(',')}
                      </div>
                    )}
                  </td>
                  <td className="py-1.5 px-1 text-center border-r border-gray-400">{item.sacks.length}</td>
                  <td className="py-1.5 px-1 text-right border-r border-gray-400">{item.totalWeight}</td>
                  <td className="py-1.5 px-1 text-right border-r border-gray-400">{fmtINR(item.amount, 2)}</td>
                  <td className="py-1.5 px-1 text-right" />
                </tr>
              ))}

              {Array.from({ length: Math.max(0, 6 - purchase.items.length) }).map((_, i) => (
                <tr key={`empty-${i}`} className="h-7">
                  {[0, 1, 2, 3, 4, 5].map((ci) => (
                    <td key={ci} className={`px-1 ${ci < 5 ? 'border-r border-gray-300' : ''}`}>&nbsp;</td>
                  ))}
                </tr>
              ))}
            </tbody>

            <tfoot>
              {/* Subtotal */}
              <tr className="border-t-2 border-gray-600 print:border-black font-semibold">
                <td className="py-1.5 px-1 border-r border-gray-400" />
                <td className="py-1.5 px-2 border-r border-gray-400" />
                <td className="py-1.5 px-1 text-center border-r border-gray-400">{totalSacks}</td>
                <td className="py-1.5 px-1 text-right border-r border-gray-400">{totalWeight}</td>
                <td className="py-1.5 px-1 text-right border-r border-gray-400">{fmtINR(purchase.subtotal, 2)}</td>
                <td className="py-1.5 px-1" />
              </tr>

              {/* Previous balance */}
              {purchase.previousBalance > 0 && (
                <tr className="border-t border-gray-400">
                  <td className="py-1.5 px-1 border-r border-gray-400" />
                  <td className="py-1.5 px-2 border-r border-gray-400 font-semibold">முன் பாக்கி</td>
                  <td className="border-r border-gray-400" />
                  <td className="border-r border-gray-400" />
                  <td className="py-1.5 px-1 text-right border-r border-gray-400 font-semibold">
                    +{fmtINR(purchase.previousBalance, 2)}
                  </td>
                  <td />
                </tr>
              )}

              {/* Total due */}
              <tr className="border-t border-gray-500">
                <td className="py-2 px-1 border-r border-gray-400" />
                <td className="py-2 px-2 border-r border-gray-400">
                  <span className="text-red-600 font-extrabold text-sm">மொத்த பாக்கி</span>
                </td>
                <td className="border-r border-gray-400" />
                <td className="border-r border-gray-400" />
                <td className="py-2 px-1 text-right border-r border-gray-400">
                  <span className="text-red-600 font-extrabold text-sm">{fmtINR(purchase.totalDue, 2)}</span>
                </td>
                <td />
              </tr>

              {/* Amount paid */}
              <tr className="border-t border-gray-400">
                <td className="py-1.5 px-1 border-r border-gray-400" />
                <td className="py-1.5 px-2 border-r border-gray-400 font-semibold">கொடுத்த தொகை</td>
                <td className="border-r border-gray-400" />
                <td className="border-r border-gray-400" />
                <td className="border-r border-gray-400" />
                <td className="py-1.5 px-1 text-right font-semibold">
                  {purchase.amountPaid > 0 ? fmtINR(purchase.amountPaid, 2) : ''}
                </td>
              </tr>

              {/* Balance */}
              {purchase.newBalance !== 0 && (
                <tr className="border-t border-gray-400">
                  <td className="py-1.5 px-1 border-r border-gray-400" />
                  <td className="py-1.5 px-2 border-r border-gray-400 font-semibold">
                    {purchase.newBalance > 0 ? 'பாக்கி' : 'மிகுதி'}
                  </td>
                  <td className="border-r border-gray-400" />
                  <td className="border-r border-gray-400" />
                  <td className={`py-1.5 px-1 text-right border-r border-gray-400 font-bold ${purchase.newBalance > 0 ? 'text-red-600' : 'text-green-700'}`}>
                    {purchase.newBalance > 0 ? fmtINR(purchase.newBalance, 2) : ''}
                  </td>
                  <td className={`py-1.5 px-1 text-right font-bold ${purchase.newBalance < 0 ? 'text-green-700' : ''}`}>
                    {purchase.newBalance < 0 ? fmtINR(Math.abs(purchase.newBalance), 2) : ''}
                  </td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>

        <div className="text-right text-[10px] text-gray-300 mt-1 pr-1 print:text-gray-300">
          {purchase.id}
        </div>
      </div>
    </div>
  );
}
