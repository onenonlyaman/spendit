import { parseNaturalLanguageInput } from '../src/lib/nlpParser';
import { Account, Category } from '../src/types';

const mockAccounts: Account[] = [
  { id: 'acc_cash', name: 'Cash Pouch', type: 'cash', balance: 5000, initialBalance: 5000, color: '#8C6D37', icon: 'Banknote' },
  { id: 'acc_upi', name: 'UPI & Wallets', type: 'cash', balance: 15000, initialBalance: 15000, color: '#2A6F4E', icon: 'QrCode' },
  { id: 'acc_bank_primary', name: 'HDFC Savings', type: 'bank', balance: 50000, initialBalance: 50000, color: '#2C5282', icon: 'Building2' },
  { id: 'acc_credit', name: 'Regalia Credit Card', type: 'credit', balance: -8000, initialBalance: 0, color: '#B83A3A', icon: 'CreditCard' },
];

const mockCategories: Category[] = [
  { id: 'cat_chai', name: 'Chai, Street Food & Dining', icon: 'Coffee', color: '#8C6D37' },
  { id: 'cat_groceries', name: 'Kirana, Groceries & Milk', icon: 'ShoppingBag', color: '#2A6F4E' },
  { id: 'cat_transit', name: 'Auto, Metro, Cab & Petrol', icon: 'Car', color: '#C07D2B' },
];

const testCases = [
  { input: 'chai 15 cash morning', expectedTime: '07:00', expectedSlot: 'morning' },
  { input: 'lunch 250 upi noon', expectedTime: '12:30', expectedSlot: 'noon' },
  { input: 'snacks 80 cash evening', expectedTime: '17:00', expectedSlot: 'evening' },
  { input: 'dinner 1200 hdfc night', expectedTime: '21:00', expectedSlot: 'night' },
  { input: 'cab 350 cash late night', expectedTime: '02:00', expectedSlot: 'late_night' },
  { input: 'coffee 180 card 12:23 pm', expectedTime: '12:23', expectedSlot: 'noon' },
  { input: 'swiggy 420 hdfc 8:30pm', expectedTime: '20:30', expectedSlot: 'night' },
  { input: 'metro 40 paytm 9am', expectedTime: '09:00', expectedSlot: 'noon' },
  { input: 'medicine 300 upi 14:30', expectedTime: '14:30', expectedSlot: 'evening' },
  { input: 'tea 20 cash @7:15 am', expectedTime: '07:15', expectedSlot: 'morning' },
  { input: 'uber 450 card 1:30am', expectedTime: '01:30', expectedSlot: 'late_night' },
  { input: 'groceries 600 upi', expectedTime: undefined, expectedSlot: undefined },
];

console.log('--- Testing Time Parsing ---');
let passed = 0;
for (const tc of testCases) {
  const parsed = parseNaturalLanguageInput(tc.input, mockAccounts, mockCategories);
  const timeMatch = parsed.time === tc.expectedTime;
  const slotMatch = parsed.timeSlot === tc.expectedSlot;

  if (timeMatch && slotMatch) {
    console.log(`✓ PASS: "${tc.input}" -> time: ${parsed.time}, slot: ${parsed.timeSlot}, desc: "${parsed.description}", amount: ${parsed.amount}`);
    passed++;
  } else {
    console.error(`✗ FAIL: "${tc.input}"`);
    console.error(`   Expected: time=${tc.expectedTime}, slot=${tc.expectedSlot}`);
    console.error(`   Actual:   time=${parsed.time}, slot=${parsed.timeSlot}`);
  }
}

console.log(`\nResults: ${passed}/${testCases.length} tests passed.`);
