import { Account, Category, DailyNote, MoneyGoal, RecurringItem, Transaction } from '../types';
import { formatCurrency, formatDateJournalHeader, formatDateLong } from './utils';

export interface PrintDocumentData {
  scope: 'day' | 'month' | 'all';
  dateStr: string;
  selectedMonth: string;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  dailyNote?: DailyNote;
  goals?: MoneyGoal[];
  recurring?: RecurringItem[];
  currencySymbol?: string;
}

export function generateLedgerPrintHTML(data: PrintDocumentData): string {
  const {
    scope,
    dateStr,
    selectedMonth,
    transactions,
    accounts,
    categories,
    dailyNote,
    goals = [],
    recurring = [],
    currencySymbol = '₹',
  } = data;

  const totalInflow = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflow = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netRetained = totalInflow - totalOutflow;

  const dayHeader = formatDateJournalHeader(dateStr);

  const [y, m] = selectedMonth.split('-').map(Number);
  const monthDate = new Date(y, m - 1, 1);
  const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Calculate day of year
  const [dy, dm, dd] = dateStr.split('-').map(Number);
  const curDateObj = new Date(dy, dm - 1, dd);
  const startOfYear = new Date(curDateObj.getFullYear(), 0, 0);
  const diffTime = curDateObj.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let documentTitle = '';
  let subtitle = '';
  if (scope === 'day') {
    documentTitle = `Daily Ledger Folio • ${dayHeader.dayName}`;
    subtitle = `${dayHeader.monthName} ${dayHeader.dayNumber}, ${dayHeader.year} • Folio #${dayOfYear}`;
  } else if (scope === 'month') {
    documentTitle = `Financial Chapter • ${monthName}`;
    subtitle = `Verified Monthly Ledger Summary & Account Register`;
  } else {
    documentTitle = `Complete Archival Financial Ledger`;
    subtitle = `Comprehensive Historical Ledger of All Accounts`;
  }

  // Account map and category map
  const accountMap = new Map(accounts.map(a => [a.id, a]));
  const categoryMap = new Map(categories.map(c => [c.id, c]));

  // Build transaction rows HTML
  let transactionRowsHTML = '';
  if (transactions.length === 0) {
    transactionRowsHTML = `
      <tr>
        <td colspan="5" class="empty-cell">
          <em>No ledger transactions recorded for this period.</em>
        </td>
      </tr>
    `;
  } else {
    transactionRowsHTML = transactions
      .map(t => {
        const acc = accountMap.get(t.accountId);
        const destAcc = t.destinationAccountId ? accountMap.get(t.destinationAccountId) : null;
        const cat = categoryMap.get(t.categoryId);

        let amountClass = 'amount-expense';
        let prefix = '-';
        if (t.type === 'income') {
          amountClass = 'amount-income';
          prefix = '+';
        } else if (t.type === 'transfer') {
          amountClass = 'amount-transfer';
          prefix = '⇄ ';
        }

        const accountDisplay =
          t.type === 'transfer' && destAcc
            ? `${acc?.name || 'Cash'} → ${destAcc.name}`
            : acc?.name || 'UPI / Cash';

        const notesHTML = t.notes ? `<div class="entry-notes">✎ "${escapeHtml(t.notes)}"</div>` : '';
        const tagsHTML =
          t.tags && t.tags.length > 0
            ? `<div class="entry-tags">${t.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join(' ')}</div>`
            : '';

        return `
          <tr>
            <td class="col-datetime">
              <span class="date">${t.date}</span>
              <span class="time">${t.time}</span>
            </td>
            <td class="col-desc">
              <div class="desc-text">${escapeHtml(t.description)}</div>
              ${notesHTML}
              ${tagsHTML}
            </td>
            <td class="col-cat">
              <span class="cat-pill">${escapeHtml(cat?.name || 'General')}</span>
            </td>
            <td class="col-acc">
              ${escapeHtml(accountDisplay)}
            </td>
            <td class="col-amount ${amountClass}">
              ${prefix}${currencySymbol}${t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
          </tr>
        `;
      })
      .join('');
  }

  // Account balances summary
  const accountCardsHTML = accounts
    .map(acc => {
      const isNeg = acc.balance < 0;
      return `
        <div class="account-card">
          <div class="acc-name">${escapeHtml(acc.name)}</div>
          <div class="acc-inst">${escapeHtml(acc.institution || acc.type)}</div>
          <div class="acc-balance ${isNeg ? 'amount-expense' : ''}">
            ${currencySymbol}${acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      `;
    })
    .join('');

  // Daily note reflection section (if scope == 'day')
  let dailyNoteHTML = '';
  if (scope === 'day' && dailyNote) {
    dailyNoteHTML = `
      <div class="section-box margin-notes-box">
        <div class="section-title">DAILY MARGIN REFLECTION & MOOD</div>
        <div class="note-meta">
          <span>Mood: <strong>${escapeHtml(dailyNote.mood)}</strong></span>
          <span>•</span>
          <span>Weather: <strong>${escapeHtml(dailyNote.weather)}</strong></span>
          ${dailyNote.location ? `<span>• Location: <strong>${escapeHtml(dailyNote.location)}</strong></span>` : ''}
          ${dailyNote.sealed ? `<span>• <strong style="color: #FF3B30;">[✓ SEALED INK PAGE]</strong></span>` : ''}
        </div>
        ${
          dailyNote.reflection
            ? `<div class="handwritten-reflection">"${escapeHtml(dailyNote.reflection)}"</div>`
            : `<div class="empty-reflection">No handwritten reflection journaled for today.</div>`
        }
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(documentTitle)} - SpendIt</title>
  <!-- No webfont fetch: this document must print identically offline, and the
       app's own faces are already loaded in the window that renders it. -->
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 14mm 14mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: #ffffff;
      color: #191C1A;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .ledger-sheet {
      width: 100%;
      max-width: 100%;
      background: #ffffff;
      padding: 0;
    }

    /* Top Archival Header */
    .ledger-header {
      border-bottom: 2px solid #191C1A;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }

    .brand-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'Space Mono', 'JetBrains Mono', monospace;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #3D4641;
      margin-bottom: 6px;
    }

    .header-main {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .doc-title {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      font-size: 20pt;
      font-weight: 700;
      color: #191C1A;
      letter-spacing: -0.01em;
      line-height: 1.15;
    }

    .doc-subtitle {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      font-style: italic;
      font-size: 10pt;
      color: #2A302C;
      margin-top: 3px;
    }

    .audit-stamp {
      text-align: right;
      font-family: 'Space Mono', 'JetBrains Mono', monospace;
      font-size: 8pt;
      color: #3D4641;
    }

    .audit-stamp strong {
      display: block;
      color: #191C1A;
      font-size: 9pt;
    }

    /* Vitals Strip */
    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 18px;
      background: #fbf9f5;
      border: 1px solid #D1D1D6;
      border-radius: 10px;
      padding: 10px 14px;
    }

    .vital-item {
      font-family: 'Space Mono', 'JetBrains Mono', monospace;
    }

    .vital-label {
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #5F6B65;
      display: block;
    }

    .vital-value {
      font-size: 13pt;
      font-weight: 700;
      margin-top: 2px;
      display: block;
    }

    .amount-income {
      color: #34C759;
    }

    .amount-expense {
      color: #FF3B30;
    }

    .amount-transfer {
      color: #5856D6;
    }

    /* Section Title */
    .section-title {
      font-family: 'Space Mono', 'JetBrains Mono', monospace;
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #2A302C;
      border-bottom: 1px solid #191C1A;
      padding-bottom: 4px;
      margin-bottom: 8px;
      margin-top: 16px;
    }

    /* Transaction Table */
    .ledger-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      font-family: 'Plus Jakarta Sans', sans-serif;
      margin-bottom: 18px;
    }

    .ledger-table thead th {
      font-family: 'Space Mono', 'JetBrains Mono', monospace;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #3D4641;
      border-bottom: 1px solid #C7C7CC;
      padding: 6px 6px;
      text-align: left;
      font-weight: 600;
    }

    .ledger-table thead th.col-amount {
      text-align: right;
    }

    .ledger-table tbody tr {
      border-bottom: 1px solid #F2F2F7;
      page-break-inside: avoid;
    }

    .ledger-table tbody td {
      padding: 6px 6px;
      vertical-align: top;
    }

    .col-datetime {
      width: 85px;
      font-family: 'Space Mono', 'JetBrains Mono', monospace;
      font-size: 7.5pt;
      color: #2A302C;
      white-space: nowrap;
    }

    .col-datetime .time {
      display: block;
      color: #5F6B65;
      font-size: 7pt;
    }

    .col-desc {
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .desc-text {
      font-weight: 600;
      color: #191C1A;
    }

    .entry-notes {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      font-size: 10.5pt;
      color: #2A302C;
      line-height: 1.2;
      margin-top: 2px;
    }

    .entry-tags {
      font-family: 'Space Mono', 'JetBrains Mono', monospace;
      font-size: 7pt;
      color: #5F6B65;
      margin-top: 2px;
    }

    .col-cat {
      width: 110px;
    }

    .cat-pill {
      font-family: 'Space Mono', 'JetBrains Mono', monospace;
      font-size: 7pt;
      background: #F2F2F7;
      border: 1px solid #D1D1D6;
      padding: 1px 5px;
      border-radius: 10px;
      display: inline-block;
      white-space: nowrap;
    }

    .col-acc {
      width: 120px;
      font-family: 'Space Mono', 'JetBrains Mono', monospace;
      font-size: 7.5pt;
      color: #2A302C;
      white-space: nowrap;
    }

    .col-amount {
      width: 95px;
      text-align: right;
      font-family: 'Space Mono', 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 8.5pt;
      white-space: nowrap;
    }

    .empty-cell {
      text-align: center;
      padding: 24px;
      color: #5F6B65;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      font-style: italic;
    }

    /* Accounts Register Grid */
    .accounts-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }

    .account-card {
      background: #fbf9f5;
      border: 1px solid #D1D1D6;
      border-radius: 10px;
      padding: 8px 10px;
      font-family: 'Space Mono', 'JetBrains Mono', monospace;
    }

    .acc-name {
      font-weight: 700;
      font-size: 8pt;
      color: #191C1A;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .acc-inst {
      font-size: 6.5pt;
      color: #5F6B65;
      text-transform: uppercase;
      margin-bottom: 3px;
    }

    .acc-balance {
      font-size: 10pt;
      font-weight: 700;
      color: #191C1A;
    }

    /* Margin Notes */
    .margin-notes-box {
      background: #F2F2F7;
      border: 1px solid #D1D1D6;
      border-radius: 10px;
      padding: 10px 14px;
      margin-top: 14px;
    }

    .note-meta {
      font-family: 'Space Mono', 'JetBrains Mono', monospace;
      font-size: 7.5pt;
      color: #3D4641;
      margin-bottom: 6px;
      display: flex;
      gap: 6px;
    }

    .handwritten-reflection {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      font-size: 13pt;
      color: #191C1A;
      line-height: 1.35;
    }

    .empty-reflection {
      font-size: 8pt;
      font-style: italic;
      color: #8E8E93;
    }

    /* Footer Seal */
    .ledger-footer {
      border-top: 1px solid #191C1A;
      margin-top: 20px;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'Space Mono', 'JetBrains Mono', monospace;
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #3D4641;
    }

    .stamp-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      border: 1px solid #191C1A;
      padding: 2px 7px;
      border-radius: 10px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="ledger-sheet">
    <!-- Header -->
    <div class="ledger-header">
      <div class="brand-strip">
        <span>§ SPENDIT ARCHIVAL FINANCIAL REGISTER</span>
        <span>CURRENCY: ${currencySymbol}</span>
      </div>

      <div class="header-main">
        <div>
          <h1 class="doc-title">${escapeHtml(documentTitle)}</h1>
          <p class="doc-subtitle">${escapeHtml(subtitle)}</p>
        </div>

        <div class="audit-stamp">
          <span>REGISTER VERIFIED</span>
          <strong>${new Date().toLocaleDateString('en-IN')}</strong>
        </div>
      </div>
    </div>

    <!-- Macro Summary -->
    <div class="vitals-grid">
      <div class="vital-item">
        <span class="vital-label">Total Verified Inflow</span>
        <span class="vital-value amount-income">+${currencySymbol}${totalInflow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div class="vital-item">
        <span class="vital-label">Total Verified Outflow</span>
        <span class="vital-value amount-expense">-${currencySymbol}${totalOutflow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div class="vital-item">
        <span class="vital-label">Net Retained Balance</span>
        <span class="vital-value">${currencySymbol}${netRetained.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>

    <!-- Transactions Table -->
    <div class="section-title">
      JOURNALED TRANSACTIONS (${transactions.length} RECORD${transactions.length === 1 ? '' : 'S'})
    </div>

    <table class="ledger-table">
      <thead>
        <tr>
          <th class="col-datetime">Date & Time</th>
          <th class="col-desc">Description & Notes</th>
          <th class="col-cat">Category</th>
          <th class="col-acc">Account / Mode</th>
          <th class="col-amount">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${transactionRowsHTML}
      </tbody>
    </table>

    <!-- Daily Margin Note (If scope == day) -->
    ${dailyNoteHTML}

    <!-- Accounts Register (If scope == month or all) -->
    ${
      scope !== 'day' && accounts.length > 0
        ? `
      <div class="section-title">VERIFIED ACCOUNT BALANCES</div>
      <div class="accounts-grid">
        ${accountCardsHTML}
      </div>
    `
        : ''
    }

    <!-- Footer Seal -->
    <div class="ledger-footer">
      <div class="stamp-badge">
        ✓ SEALED & AUDITED • FINANCIAL LEDGER REGISTER
      </div>
      <div>PAGE FOLIO VERIFIED • SPENDIT ARCHIVES</div>
    </div>
  </div>
</body>
</html>
  `;
}

function escapeHtml(str?: string | null): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Triggers clean, vector-fidelity PDF printing via a hidden iframe
 */
export function printLedgerDocument(data: PrintDocumentData): void {
  const html = generateLedgerPrintHTML(data);

  // Remove existing print frame if any
  const existingFrame = document.getElementById('spendit-print-frame');
  if (existingFrame) {
    existingFrame.remove();
  }

  // Create clean isolated iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'spendit-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    console.error('Could not access iframe document');
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  // Wait for Google fonts and layout to load inside iframe then trigger print
  iframe.contentWindow?.focus();
  setTimeout(() => {
    try {
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Iframe print error, falling back to window.print', e);
    }
  }, 400);
}
