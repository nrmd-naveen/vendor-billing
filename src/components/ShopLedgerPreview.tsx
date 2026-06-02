'use client';

import { useState } from 'react';
import { useSettings } from '@/lib/useSettings';
import { fmtINR } from '@/lib/format';
import { Printer, Download, FileDown } from 'lucide-react';
import { toPng } from 'html-to-image';
import { CompanySettings } from '@/lib/types';

export interface LedgerItemRow {
  name: string;
  sacks: number;
  totalWeight: number;
  pricePerKg: number;
  amount: number;
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: 'purchase' | 'payment';
  ref: string;
  debit: number;
  credit: number;
  balance: number;
  items?: LedgerItemRow[];      // purchase items
  note?: string;                // payment note
  discount?: number;            // payment discount
}

interface ShopLedgerPreviewProps {
  shopName: string;
  shopPhone?: string;
  dateFrom: string;
  dateTo: string;
  openingBalance: number;
  entries: LedgerEntry[];
  closingBalance: number;
  totalPurchases: number;
  totalPayments: number;
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

function buildPrintDoc(
  settings: CompanySettings,
  shopName: string,
  shopPhone: string | undefined,
  dateFrom: string,
  dateTo: string,
  openingBalance: number,
  entries: LedgerEntry[],
  closingBalance: number,
  totalPurchases: number,
  totalPayments: number,
  fileStamp: string,
): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmtD = (s: string) => { const [y,m,d] = s.split('-'); return `${d}/${m}/${y}`; };
  const fmtDL = (s: string) => { const [y,m,d] = s.split('-'); return `${d} ${months[parseInt(m)-1]} ${y}`; };
  const money = (n: number) => `&#8377;${fmtINR(Math.abs(n), 2)}`;

  const rows = entries.map((e, idx) => {
    const bg = idx % 2 === 1 ? '#f9f9f9' : '#ffffff';
    let descCell = '';
    if (e.type === 'purchase' && e.items && e.items.length > 0) {
      const itemRows = e.items.map(it => `
        <tr>
          <td style="padding:2px 4px 2px 0;border-bottom:1px solid #eee;">${it.name}</td>
          <td style="padding:2px 4px;text-align:center;border-bottom:1px solid #eee;">${it.sacks}</td>
          <td style="padding:2px 4px;text-align:right;border-bottom:1px solid #eee;">${it.totalWeight} கி</td>
          <td style="padding:2px 4px;text-align:right;border-bottom:1px solid #eee;font-weight:600;">${money(it.amount)}</td>
        </tr>`).join('');
      descCell = `
        <table style="width:100%;border-collapse:collapse;font-size:10px;">
          <thead>
            <tr style="color:#888;border-bottom:1px solid #ccc;">
              <th style="text-align:left;padding:2px 4px 3px 0;font-weight:600;">பொருள்</th>
              <th style="text-align:center;padding:2px 4px;font-weight:600;">மூடை</th>
              <th style="text-align:right;padding:2px 4px;font-weight:600;">எடை</th>
              <th style="text-align:right;padding:2px 4px;font-weight:600;">தொகை</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>`;
    } else if (e.type === 'payment') {
      descCell = `<div style="font-weight:600;color:#166534;">கட்டணம்</div>
        ${e.note ? `<div style="color:#666;font-size:10px;margin-top:1px;">குறிப்பு: ${e.note}</div>` : ''}
        ${e.discount && e.discount > 0 ? `<div style="color:#b45309;font-size:10px;">தள்ளுபடி: ${money(e.discount)}</div>` : ''}`;
    }

    const balColor = e.balance > 0 ? '#b91c1c' : e.balance < 0 ? '#166534' : '#6b7280';
    const balSuffix = e.balance < 0 ? ' வ' : '';

    return `
      <tr style="background:${bg};border-bottom:1px solid #e5e7eb;vertical-align:top;">
        <td style="padding:6px 6px;text-align:center;border-right:1px solid #d1d5db;white-space:nowrap;font-size:11px;">${fmtD(e.date)}</td>
        <td style="padding:6px 4px;text-align:center;border-right:1px solid #d1d5db;font-size:10px;color:#666;">${e.ref}</td>
        <td style="padding:5px 8px;border-right:1px solid #d1d5db;">${descCell}</td>
        <td style="padding:6px 8px;text-align:right;border-right:1px solid #d1d5db;font-weight:500;font-size:11px;">
          ${e.debit > 0 ? money(e.debit) : ''}
        </td>
        <td style="padding:6px 8px;text-align:right;border-right:1px solid #d1d5db;font-weight:500;font-size:11px;color:#166534;">
          ${e.credit > 0 ? money(e.credit) : ''}
        </td>
        <td style="padding:6px 8px;text-align:right;font-weight:600;font-size:11px;color:${balColor};">
          ${money(e.balance)}${balSuffix}
        </td>
      </tr>`;
  }).join('');

  const obColor = openingBalance > 0 ? '#b91c1c' : openingBalance < 0 ? '#166534' : '#6b7280';
  const cbColor = closingBalance > 0 ? '#b91c1c' : closingBalance < 0 ? '#166534' : '#6b7280';

  const logoLeft = settings.logoLeft
    ? `<img src="${settings.logoLeft}" style="width:70px;height:70px;object-fit:contain;" />`
    : `<div style="width:70px;height:70px;background:#f3f4f6;border-radius:6px;"></div>`;
  const logoRight = settings.logoRight
    ? `<img src="${settings.logoRight}" style="width:70px;height:70px;object-fit:contain;" />`
    : `<div style="width:70px;height:70px;background:#f3f4f6;border-radius:6px;"></div>`;

  const contactBar = (settings.contact1Name || settings.contact2Name) ? `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 12px;border-bottom:1px solid #374151;">
      <div style="font-size:11px;font-weight:600;">${settings.contact1Name || ''}<br/>${settings.contact1Phone || ''}</div>
      <div style="font-size:13px;font-weight:700;text-align:center;">கடை கணக்கு</div>
      <div style="font-size:11px;font-weight:600;text-align:right;">${settings.contact2Name || ''}<br/>${settings.contact2Phone || ''}</div>
    </div>` : '';

  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return `<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="UTF-8"/>
  <title>Ledger_${shopName.replace(/\s+/g, '_')}_${fileStamp}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Noto Sans Tamil', Arial, sans-serif;
      font-size: 12px;
      color: #111827;
      background: white;
    }
    @page {
      size: A4 portrait;
      margin: 14mm 12mm 14mm 12mm;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      tr { page-break-inside: avoid; }
    }
    .wrapper {
      max-width: 740px;
      margin: 0 auto;
      border: 2px solid #374151;
    }
    table { border-collapse: collapse; }
  </style>
</head>
<body>
<div class="wrapper">

  <!-- Header -->
  <div style="border-bottom:2px solid #374151;padding:10px 12px;">
    ${settings.tagline ? `<div style="text-align:center;font-size:10px;color:#6b7280;margin-bottom:4px;">${settings.tagline}</div>` : ''}
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
      ${logoLeft}
      <div style="flex:1;text-align:center;padding:0 8px;">
        <div style="font-size:26px;font-weight:900;color:#15803d;line-height:1.1;">${settings.name}</div>
        ${settings.subtitle ? `<div style="font-size:12px;font-weight:600;color:#374151;margin-top:2px;">${settings.subtitle}</div>` : ''}
        ${settings.address ? `<div style="font-size:10px;color:#6b7280;margin-top:2px;">${settings.address}</div>` : ''}
      </div>
      ${logoRight}
    </div>
  </div>

  <!-- Contact bar -->
  ${contactBar}

  <!-- Shop + Period -->
  <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 12px;border-bottom:1px solid #374151;background:#fafafa;">
    <div>
      <span style="font-size:10px;color:#6b7280;font-weight:600;">கடை: </span>
      <span style="font-size:13px;font-weight:700;">${shopName}</span>
      ${shopPhone ? `<span style="font-size:10px;color:#9ca3af;margin-left:6px;">${shopPhone}</span>` : ''}
    </div>
    <div style="text-align:right;">
      <span style="font-size:10px;color:#6b7280;font-weight:600;">காலம்: </span>
      <span style="font-size:11px;font-weight:500;">${fmtDL(dateFrom)} &mdash; ${fmtDL(dateTo)}</span>
    </div>
  </div>

  <!-- Opening balance -->
  <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 12px;background:#f3f4f6;border-bottom:1px solid #9ca3af;">
    <span style="font-size:11px;font-weight:600;color:#374151;">ஆரம்ப இருப்பு</span>
    <span style="font-size:11px;font-weight:700;color:${obColor};">
      ${money(openingBalance)}${openingBalance < 0 ? ' (வரவு)' : openingBalance > 0 ? ' (பற்று)' : ''}
    </span>
  </div>

  <!-- Ledger table -->
  <table style="width:100%;table-layout:fixed;">
    <colgroup>
      <col style="width:12%;"/>
      <col style="width:9%;"/>
      <col style="width:35%;"/>
      <col style="width:14%;"/>
      <col style="width:14%;"/>
      <col style="width:16%;"/>
    </colgroup>
    <thead>
      <tr style="background:#f3f4f6;border-bottom:2px solid #374151;">
        <th style="padding:7px 6px;text-align:center;border-right:1px solid #9ca3af;font-size:11px;font-weight:700;line-height:1.4;">தேதி</th>
        <th style="padding:7px 4px;text-align:center;border-right:1px solid #9ca3af;font-size:11px;font-weight:700;line-height:1.4;">எண்</th>
        <th style="padding:7px 8px;text-align:left;border-right:1px solid #9ca3af;font-size:11px;font-weight:700;line-height:1.4;">விவரம்</th>
        <th style="padding:7px 8px;text-align:right;border-right:1px solid #9ca3af;font-size:11px;font-weight:700;line-height:1.4;">கொள்முதல்<br/><span style="font-weight:400;font-size:9px;">(பற்று)</span></th>
        <th style="padding:7px 8px;text-align:right;border-right:1px solid #9ca3af;font-size:11px;font-weight:700;line-height:1.4;">கட்டணம்<br/><span style="font-weight:400;font-size:9px;">(வரவு)</span></th>
        <th style="padding:7px 8px;text-align:right;font-size:11px;font-weight:700;line-height:1.4;">இருப்பு<br/><span style="font-weight:400;font-size:9px;">(பாக்கி)</span></th>
      </tr>
    </thead>
    <tbody>
      ${entries.length === 0
        ? `<tr><td colspan="6" style="padding:24px;text-align:center;color:#9ca3af;">இந்த காலகட்டத்தில் பரிவர்த்தனை இல்லை</td></tr>`
        : rows}
    </tbody>
    <tfoot>
      <tr style="background:#f3f4f6;border-top:2px solid #374151;">
        <td style="padding:8px 6px;border-right:1px solid #9ca3af;"></td>
        <td style="padding:8px 4px;border-right:1px solid #9ca3af;"></td>
        <td style="padding:8px 8px;border-right:1px solid #9ca3af;font-weight:700;font-size:12px;">மொத்தம்</td>
        <td style="padding:8px 8px;text-align:right;border-right:1px solid #9ca3af;font-weight:700;font-size:12px;">${money(totalPurchases)}</td>
        <td style="padding:8px 8px;text-align:right;border-right:1px solid #9ca3af;font-weight:700;font-size:12px;color:#166534;">${money(totalPayments)}</td>
        <td style="padding:8px 8px;text-align:right;font-weight:700;font-size:12px;color:${cbColor};">${money(closingBalance)}${closingBalance < 0 ? ' வ' : ''}</td>
      </tr>
    </tfoot>
  </table>

  <!-- Closing balance bar -->
  <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#f9fafb;border-top:2px solid #374151;">
    <span style="font-size:13px;font-weight:700;">இறுதி இருப்பு</span>
    <span style="font-size:15px;font-weight:900;color:${cbColor};">
      ${money(closingBalance)} ${closingBalance < 0 ? '(வரவு)' : closingBalance > 0 ? '(பற்று)' : '(தீர்வு)'}
    </span>
  </div>

  <!-- Summary strip -->
  <div style="display:flex;justify-content:space-between;padding:5px 12px;border-top:1px solid #d1d5db;font-size:11px;color:#4b5563;">
    <span><b>கொள்முதல்:</b> <span style="color:#b45309;font-weight:700;">${money(totalPurchases)}</span></span>
    <span><b>கட்டணம்:</b> <span style="color:#166534;font-weight:700;">${money(totalPayments)}</span></span>
    <span><b>பதிவுகள்:</b> <span style="font-weight:700;">${entries.length}</span></span>
  </div>

  <!-- Footer -->
  <div style="padding:4px 12px;border-top:1px solid #e5e7eb;text-align:center;font-size:9px;color:#9ca3af;">
    உருவாக்கப்பட்டது: ${today}${settings.contact1Phone ? ' &middot; ' + settings.contact1Phone : ''}
  </div>

</div>
</body>
</html>`;
}

export default function ShopLedgerPreview({
  shopName, shopPhone, dateFrom, dateTo, openingBalance,
  entries, closingBalance, totalPurchases, totalPayments,
}: ShopLedgerPreviewProps) {
  const { settings } = useSettings();
  const [copied, setCopied] = useState(false);

  const makeStamp = () => {
    const n = new Date();
    const p = (x: number, l = 2) => String(x).padStart(l, '0');
    return `${n.getFullYear()}${p(n.getMonth()+1)}${p(n.getDate())}_${p(n.getHours())}${p(n.getMinutes())}${p(n.getSeconds())}`;
  };

  const handleSavePDF = () => {
    const html = buildPrintDoc(
      settings, shopName, shopPhone, dateFrom, dateTo,
      openingBalance, entries, closingBalance, totalPurchases, totalPayments,
      makeStamp(),
    );
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    // Wait for fonts then print
    win.addEventListener('load', () => {
      (win.document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready.then(() => {
        win.focus();
        win.print();
      }) ?? (() => { win.focus(); win.print(); })();
    });
  };

  const handleSavePhoto = async () => {
    const el = document.getElementById('shop-ledger-print-area');
    if (!el) return;
    const dataUrl = await toPng(el, { cacheBust: true, backgroundColor: '#ffffff', quality: 1, pixelRatio: 2 });
    const a = document.createElement('a');
    a.download = `Ledger_${shopName.replace(/\s+/g, '_')}_${makeStamp()}.png`;
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
      {/* Action buttons — hidden on print */}
      <div className="flex justify-end gap-2 p-4 border-b border-gray-100 print:hidden">
        <button
          onClick={handleSavePDF}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          <FileDown className="w-4 h-4" /> Save PDF
        </button>
        <button
          onClick={handleSavePhoto}
          className={`flex items-center gap-2 ${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-800'} text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm`}
        >
          <Download className="w-4 h-4" /> {copied ? 'Copied!' : 'Save Photo'}
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      <div
        id="shop-ledger-print-area"
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
              <div className="text-center font-bold text-sm">கடை கணக்கு / Shop Ledger</div>
              <div className="text-right text-xs">
                {settings.contact2Name && <div className="font-semibold">{settings.contact2Name}</div>}
                {settings.contact2Phone && <div className="font-semibold">{settings.contact2Phone}</div>}
              </div>
            </div>
          )}

          {/* Ledger meta row */}
          <div className="border-b border-gray-700 print:border-black px-3 py-2 grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold text-xs text-gray-600">கடை / Shop: </span>
              <span className="font-bold text-sm">{shopName}</span>
              {shopPhone && <span className="text-xs text-gray-500 ml-2">{shopPhone}</span>}
            </div>
            <div className="text-right">
              <span className="font-semibold text-xs text-gray-600">காலம் / Period: </span>
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
                <th className="py-1.5 px-1 font-bold border-r border-gray-600 text-right leading-tight">கொள்முதல்<br/><span className="font-normal text-[10px]">(பற்று)</span></th>
                <th className="py-1.5 px-1 font-bold border-r border-gray-600 text-right leading-tight">கட்டணம்<br/><span className="font-normal text-[10px]">(வரவு)</span></th>
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
                          <div className="font-semibold text-green-800">கட்டணம்</div>
                          {entry.note && <div className="text-gray-500 text-[11px]">குறிப்பு: {entry.note}</div>}
                          {entry.discount && entry.discount > 0 ? (
                            <div className="text-orange-600 text-[11px]">தள்ளுபடி: ₹{fmtINR(entry.discount, 2)}</div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="py-0.5 font-semibold text-orange-800">கொள்முதல்</div>
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

            {/* Totals footer */}
            <tfoot>
              <tr className="border-t-2 border-gray-600 print:border-black font-bold bg-gray-100">
                <td className="py-2 px-1 border-r border-gray-400" />
                <td className="py-2 px-1 border-r border-gray-400" />
                <td className="py-2 px-2 border-r border-gray-400 text-xs font-bold text-gray-700">மொத்தம்</td>
                <td className="py-2 px-1 text-right border-r border-gray-400">
                  ₹{fmtINR(totalPurchases, 2)}
                </td>
                <td className="py-2 px-1 text-right border-r border-gray-400 text-green-700">
                  ₹{fmtINR(totalPayments, 2)}
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
              <span className="font-semibold">கொள்முதல்: </span>
              <span className="text-orange-700 font-bold">₹{fmtINR(totalPurchases, 2)}</span>
            </div>
            <div className="text-center">
              <span className="font-semibold">கட்டணம்: </span>
              <span className="text-green-700 font-bold">₹{fmtINR(totalPayments, 2)}</span>
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
