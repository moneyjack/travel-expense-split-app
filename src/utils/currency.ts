// 定義支援的貨幣
export const CURRENCIES = [
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'KRW', symbol: '₩', name: 'Korean Won' },
];

// 格式化金額的函式
export const formatCurrency = (amount: number, currencyCode: string = 'TWD') => {
  // 針對日幣/韓元等沒有小數點的貨幣做處理
  const noDecimals = ['JPY', 'KRW', 'TWD', 'HKD']; // 視需求決定 TWD/HKD 是否要小數點
  
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: noDecimals.includes(currencyCode) ? 0 : 2,
    maximumFractionDigits: noDecimals.includes(currencyCode) ? 0 : 2,
  };

  try {
    return new Intl.NumberFormat('en-US', options).format(amount);
  } catch (e) {
    // 如果出錯回退到簡單顯示
    return `${currencyCode} ${amount}`;
  }
};