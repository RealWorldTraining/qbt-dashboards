// ============================================
// MONTHLY P&L RECAP - DATA ONLY VERSION
// ============================================
// This simplified Code node outputs only JSON data (~2K)
// instead of the full HTML (~51K).
// The HTML template is now hosted on Vercel at /recap
//
// To use: Replace the "Generate HTML Report" node's jsCode with this

const allItems = $input.all();

const getField = (obj, fieldName) => {
  const key = Object.keys(obj).find(k => k.toLowerCase() === fieldName.toLowerCase());
  return key ? obj[key] : undefined;
};

const parseDate = (val) => {
  if (!val) return null;
  const str = String(val).trim();
  if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
    const parts = str.split('T')[0].split('-');
    return { month: parseInt(parts[1]), year: parseInt(parts[0]) };
  }
  const usMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) return { month: parseInt(usMatch[1]), year: parseInt(usMatch[3]) };
  const usMatch2 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (usMatch2) {
    const yr = parseInt(usMatch2[3]);
    return { month: parseInt(usMatch2[1]), year: yr < 50 ? 2000 + yr : 1900 + yr };
  }
  const shortMatch = str.match(/^(\d{1,2})\/(\d{2})$/);
  if (shortMatch) {
    const yr = parseInt(shortMatch[2]);
    return { month: parseInt(shortMatch[1]), year: yr < 50 ? 2000 + yr : 1900 + yr };
  }
  const num = parseFloat(str);
  if (!isNaN(num) && num > 40000 && num < 50000) {
    const d = new Date((num - 25569) * 86400 * 1000);
    return { month: d.getUTCMonth() + 1, year: d.getUTCFullYear() };
  }
  return null;
};

const formatMonth = (parsed) => {
  if (!parsed) return null;
  const yr = parsed.year % 100;
  return `${parsed.month}/${yr < 10 ? '0' + yr : yr}`;
};

const parseNum = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  return parseFloat(String(val).replace(/[$,]/g, '')) || 0;
};

// Separate data rows from comment rows
const dataItems = allItems.filter(item => {
  const monthVal = getField(item.json, 'month');
  const hasMonth = monthVal !== undefined && monthVal !== null && monthVal !== '';
  const hasProfitShare = getField(item.json, 'profit share') !== undefined;
  return hasMonth && hasProfitShare;
});
const commentItems = allItems.filter(item => item.json.section || item.json.Section);

// Build comments object
const comments = {};
const expenseItems = [];
commentItems.forEach(item => {
  const section = (item.json.section || item.json.Section || '').toLowerCase().replace(/\s+/g, '_');
  const comment = item.json.comment || item.json.Comment || '';
  if (section === 'expenses') {
    expenseItems.push(comment);
  } else if (section) {
    comments[section] = comment;
  }
});
if (expenseItems.length > 0) {
  comments.expense_highlights = expenseItems.join('\n\n');
}

// Sort data by date
const sortedData = dataItems
  .map(item => ({ ...item.json, _parsed: parseDate(getField(item.json, 'month')) }))
  .filter(row => row._parsed !== null)
  .sort((a, b) => a._parsed.year !== b._parsed.year ? a._parsed.year - b._parsed.year : a._parsed.month - b._parsed.month);

const last24 = sortedData.slice(-24);

// Build data arrays
const months = [], profitShare = [], trainingPlans = [], renewals = [];
const subscribers = [], newVisitors = [], paidVisitors = [], cpc = [];
const refundPct = [], intuitSales = [], refundDollars = [], chargebackDollars = [];
const learnerUnits = [], certUnits = [], teamUnits = [];
const cancels = [];

last24.forEach(row => {
  months.push(formatMonth(row._parsed));
  profitShare.push(parseNum(getField(row, 'profit share')));
  trainingPlans.push(parseNum(getField(row, 'training plan revenue')));
  renewals.push(parseNum(getField(row, 'renewal revenue')));
  subscribers.push(parseNum(getField(row, 'subscribers')));
  newVisitors.push(parseNum(getField(row, 'new visitors')));
  paidVisitors.push(parseNum(getField(row, 'visitors')));
  cpc.push(parseNum(getField(row, 'cpc')));
  refundPct.push(parseNum(getField(row, '%')));
  intuitSales.push(parseNum(getField(row, 'sales')));
  refundDollars.push(parseNum(getField(row, 'refunds')));
  chargebackDollars.push(parseNum(getField(row, 'chargebacks')));
  learnerUnits.push(parseNum(getField(row, 'learner')));
  certUnits.push(parseNum(getField(row, 'cert')));
  teamUnits.push(parseNum(getField(row, 'team')));
  cancels.push(parseNum(getField(row, 'cancels')));
});

// Calculate display month
const currentMonth = months[months.length - 1] || 'N/A';
const [monthNum, yearNum] = currentMonth !== 'N/A' ? currentMonth.split('/').map(Number) : [0, 0];
const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const displayMonth = monthNum && yearNum ? `${monthNames[monthNum]} 20${yearNum}` : 'N/A';

// Return JSON data only (~2K instead of 51K HTML)
return [{
  json: {
    displayMonth,
    months,
    profitShare,
    trainingPlans,
    renewals,
    subscribers,
    newVisitors,
    paidVisitors,
    cpc,
    refundPct,
    intuitSales,
    refundDollars,
    chargebackDollars,
    learnerUnits,
    certUnits,
    teamUnits,
    cancels,
    comments,
    expenseItems
  }
}];
