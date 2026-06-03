'use client';

import { useState } from 'react';
import { useSettings } from '@/lib/useSettings';
import { fmtINR } from '@/lib/format';
import { Printer, Download, FileDown } from 'lucide-react';
import { toPng } from 'html-to-image';
import { LedgerEntry, LedgerItemRow } from './ShopLedgerPreview';
import { jsPDF } from 'jspdf';

export type { LedgerEntry, LedgerItemRow };

interface CustomerLedgerPreviewProps {
  customerName: string;
  customerPhone?: string;
  dateFrom: string;
  dateTo: string;
  openingBalance: number;
  entries: LedgerEntry[];
  closingBalance: number;
  totalBills: number;
  totalCollections: number;
}

function fmtDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function fmtDateLong(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d} ${months[parseInt(m) - 1]} ${y}`;
}



export default function CustomerLedgerPreview({
  customerName, customerPhone, dateFrom, dateTo, openingBalance,
  entries, closingBalance, totalBills, totalCollections,
}: CustomerLedgerPreviewProps) {
  const { settings } = useSettings();
  const [copied, setCopied] = useState(false);
  const [pdfCopied, setPdfCopied] = useState(false);

  const makeStamp = () => {
    const n = new Date();
    const p = (x: number, l = 2) => String(x).padStart(l, '0');
    return `${n.getFullYear()}${p(n.getMonth()+1)}${p(n.getDate())}_${p(n.getHours())}${p(n.getMinutes())}${p(n.getSeconds())}`;
  };

  const handleSavePDF = async () => {
    const el = document.getElementById('customer-ledger-print-area');
    if (!el) return;
    try {
      const dataUrl = await toPng(el, { cacheBust: true, backgroundColor: '#ffffff', quality: 1, pixelRatio: 2 });
      
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      
      const pdf = new jsPDF({
        orientation: height > width ? 'portrait' : 'landscape',
        unit: 'px',
        format: [width, height]
      });
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
      pdf.save(`CustomerLedger_${customerName.replace(/\s+/g, '_')}_${makeStamp()}.pdf`);

      // Copy to clipboard
      const blob = await fetch(dataUrl).then(r => r.blob());
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setPdfCopied(true);
      setTimeout(() => setPdfCopied(false), 2000);
    } catch (err) {
      console.error('Failed to save PDF:', err);
    }
  };

  const handleSavePhoto = async () => {
    const el = document.getElementById('customer-ledger-print-area');
    if (!el) return;
    const dataUrl = await toPng(el, { cacheBust: true, backgroundColor: '#ffffff', quality: 1, pixelRatio: 2 });
    const a = document.createElement('a');
    a.download = `CustomerLedger_${customerName.replace(/\s+/g, '_')}_${makeStamp()}.png`;
    a.href = dataUrl;
    a.click();
    try {
      const blob = await fetch(dataUrl).then(r => r.blob());
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not available */ }
  };

  return (
    <div className="bg-white">
      <div className="flex justify-end gap-2 p-4 border-b border-gray-100 print:hidden">
        <button
          onClick={handleSavePDF}
          className={`flex items-center gap-2 ${pdfCopied ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm`}
        >
          <FileDown className="w-4 h-4" /> {pdfCopied ? 'Copied!' : 'Save PDF'}
        </button>
        <button
          onClick={handleSavePhoto}
          className={`flex items-center gap-2 ${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-800'} text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm`}
        >
          <Download className="w-4 h-4" /> {copied ? 'Copied!' : 'Save Photo'}
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      <div
        id="customer-ledger-print-area"
        className="p-4 print:p-0"
        style={{ fontFamily: "var(--font-noto-tamil), 'Noto Sans Tamil', 'Latha', Arial, sans-serif", fontSize: '12px' }}
      >
        <div className="border-2 border-gray-700 max-w-3xl mx-auto print:max-w-full print:border-black">

          {/* Company header */}
          <div className="border-b-2 border-gray-700 print:border-black text-center px-3 py-2">
            {settings.tagline && (
              <div className="text-[11px] text-gray-500 mb-1">{settings.tagline}</div>
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
              <div className="text-center font-bold text-sm">வாடிக்கையாளர் கணக்கு / Customer Ledger</div>
              <div className="text-right text-xs">
                {settings.contact2Name && <div className="font-semibold">{settings.contact2Name}</div>}
                {settings.contact2Phone && <div className="font-semibold">{settings.contact2Phone}</div>}
              </div>
            </div>
          )}

          {/* Ledger meta row */}
          <div className="border-b border-gray-700 print:border-black px-3 py-2 grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold text-xs text-gray-600">வாடிக்கையாளர்: </span>
              <span className="font-bold text-sm">{customerName}</span>
              {customerPhone && <span className="text-xs text-gray-500 ml-2">{customerPhone}</span>}
            </div>
            <div className="text-right">
              <span className="font-semibold text-xs text-gray-600">காலம்: </span>
              <span className="font-medium text-xs">
                {fmtDateLong(dateFrom)} — {fmtDateLong(dateTo)}
              </span>
            </div>
          </div>

          {/* Opening balance row */}
          <div className="border-b border-gray-400 px-3 py-1.5 bg-gray-50 flex justify-between items-center text-xs font-semibold">
            <span className="text-gray-600">ஆரம்ப இருப்பு</span>
            <span className={openingBalance >= 0 ? 'text-red-700' : 'text-green-700'}>
              ₹{fmtINR(Math.abs(openingBalance), 2)}
              {openingBalance < 0 ? ' (வரவு)' : openingBalance > 0 ? ' (பற்று)' : ''}
            </span>
          </div>

          {/* Ledger table */}
          <table className="w-full border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '9%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '38%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '16%' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-100 border-b border-gray-700 print:border-black">
                <th className="py-1.5 px-1 font-bold border-r border-gray-600 text-center leading-tight">தேதி</th>
                <th className="py-1.5 px-1 font-bold border-r border-gray-600 text-center leading-tight">எண்</th>
                <th className="py-1.5 px-1 font-bold border-r border-gray-600 text-left leading-tight">விவரம்</th>
                <th className="py-1.5 px-1 font-bold border-r border-gray-600 text-right leading-tight">விற்பனை<br/><span className="font-normal text-[10px]">(பற்று)</span></th>
                <th className="py-1.5 px-1 font-bold border-r border-gray-600 text-right leading-tight">வசூல்<br/><span className="font-normal text-[10px]">(வரவு)</span></th>
                <th className="py-1.5 px-1 font-bold text-right leading-tight">இருப்பு<br/><span className="font-normal text-[10px]">(பாக்கி)</span></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-400">இந்த காலகட்டத்தில் பரிவர்த்தனை இல்லை</td>
                </tr>
              ) : (
                entries.map((entry, idx) => (
                  <tr key={entry.id} className={`border-b border-gray-200 align-top ${idx % 2 === 1 ? 'bg-gray-50' : ''}`}>
                    <td className="py-1.5 px-1 text-center border-r border-gray-300 whitespace-nowrap">{fmtDate(entry.date)}</td>
                    <td className="py-1.5 px-1 text-center border-r border-gray-300 font-mono text-[11px]">{entry.ref}</td>
                    <td className="py-1 px-1.5 border-r border-gray-300">
                      {entry.type === 'purchase' && entry.items && entry.items.length > 0 ? (
                        <table className="w-full text-[11px]" style={{ tableLayout: 'fixed' }}>
                          <colgroup>
                            <col style={{ width: '45%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '23%' }} />
                          </colgroup>
                          <thead>
                            <tr className="border-b border-gray-300 text-gray-500">
                              <th className="text-left py-0.5 font-semibold">பொருள்</th>
                              <th className="text-center py-0.5 font-semibold">மூடை</th>
                              <th className="text-right py-0.5 font-semibold">எடை(கி)</th>
                              <th className="text-right py-0.5 font-semibold">தொகை</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entry.items.map((item, ii) => (
                              <tr key={ii} className="border-b border-gray-100 last:border-0">
                                <td className="py-0.5 truncate">{item.name}</td>
                                <td className="py-0.5 text-center">{item.sacks}</td>
                                <td className="py-0.5 text-right">{item.totalWeight}</td>
                                <td className="py-0.5 text-right font-medium">₹{fmtINR(item.amount, 2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : entry.type === 'payment' ? (
                        <div className="py-0.5">
                          <div className="font-semibold text-green-800">வசூல்</div>
                          {entry.note && <div className="text-gray-500 text-[11px]">குறிப்பு: {entry.note}</div>}
                        </div>
                      ) : (
                        <div className="py-0.5 font-semibold text-green-800">விற்பனை</div>
                      )}
                    </td>
                    <td className="py-1.5 px-1 text-right border-r border-gray-300 font-medium align-middle">
                      {entry.debit > 0 ? <span className="text-gray-900">₹{fmtINR(entry.debit, 2)}</span> : ''}
                    </td>
                    <td className="py-1.5 px-1 text-right border-r border-gray-300 font-medium align-middle">
                      {entry.credit > 0 ? <span className="text-green-700">₹{fmtINR(entry.credit, 2)}</span> : ''}
                    </td>
                    <td className={`py-1.5 px-1 text-right font-semibold align-middle ${entry.balance > 0 ? 'text-red-700' : entry.balance < 0 ? 'text-green-700' : 'text-gray-500'}`}>
                      ₹{fmtINR(Math.abs(entry.balance), 2)}
                      {entry.balance < 0 ? ' வ' : ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            <tfoot>
              <tr className="border-t-2 border-gray-600 print:border-black font-bold bg-gray-100">
                <td className="py-2 px-1 border-r border-gray-400" />
                <td className="py-2 px-1 border-r border-gray-400" />
                <td className="py-2 px-2 border-r border-gray-400 text-xs font-bold text-gray-700">மொத்தம்</td>
                <td className="py-2 px-1 text-right border-r border-gray-400">
                  ₹{fmtINR(totalBills, 2)}
                </td>
                <td className="py-2 px-1 text-right border-r border-gray-400 text-green-700">
                  ₹{fmtINR(totalCollections, 2)}
                </td>
                <td className={`py-2 px-1 text-right ${closingBalance > 0 ? 'text-red-700' : closingBalance < 0 ? 'text-green-700' : 'text-gray-500'}`}>
                  ₹{fmtINR(Math.abs(closingBalance), 2)}
                  {closingBalance < 0 ? ' வ' : ''}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Closing balance */}
          <div className="border-t-2 border-gray-600 print:border-black px-3 py-2 flex justify-between items-center bg-gray-50">
            <span className="font-bold text-sm">இறுதி இருப்பு</span>
            <span className={`font-extrabold text-base ${closingBalance > 0 ? 'text-red-700' : closingBalance < 0 ? 'text-green-700' : 'text-gray-500'}`}>
              ₹{fmtINR(Math.abs(closingBalance), 2)}
              {closingBalance < 0 ? ' (வரவு)' : closingBalance > 0 ? ' (பற்று)' : ' (தீர்வு)'}
            </span>
          </div>

          {/* Summary row */}
          <div className="border-t border-gray-400 px-3 py-1.5 grid grid-cols-3 gap-2 text-xs text-gray-600">
            <div>
              <span className="font-semibold">விற்பனை: </span>
              <span className="text-orange-700 font-bold">₹{fmtINR(totalBills, 2)}</span>
            </div>
            <div className="text-center">
              <span className="font-semibold">வசூல்: </span>
              <span className="text-green-700 font-bold">₹{fmtINR(totalCollections, 2)}</span>
            </div>
            <div className="text-right">
              <span className="font-semibold">பதிவுகள்: </span>
              <span className="font-bold">{entries.length}</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="border-t border-gray-300 px-3 py-1 text-[10px] text-gray-400 text-center">
            உருவாக்கப்பட்டது: {new Date().toLocaleDateString('ta-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            {settings.contact1Phone ? ` · ${settings.contact1Phone}` : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
