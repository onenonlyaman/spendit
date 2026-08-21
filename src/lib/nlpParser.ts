import { Account, Category, ParsedNLPInput, TransactionType } from '../types';

export type TimeSlot = 'morning' | 'noon' | 'evening' | 'night' | 'late_night';

/**
 * Classifies a 24-hr time string (HH:mm) into one of the designated time periods:
 * - late_night: 00:00 - 06:00
 * - morning: 06:00 - 08:00
 * - noon: 08:00 - 14:00 (8 AM - 2 PM)
 * - evening: 14:00 - 19:00 (2 PM - 7 PM)
 * - night: 19:00 - 24:00 (7 PM - 12 AM)
 */
export function getTimeSlotFromTimeString(timeStr: string): TimeSlot {
  const [hStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return 'noon';
  if (h >= 0 && h < 6) return 'late_night';
  if (h >= 6 && h < 8) return 'morning';
  if (h >= 8 && h < 14) return 'noon';
  if (h >= 14 && h < 19) return 'evening';
  return 'night';
}

export function formatTimeSlotLabel(slot: TimeSlot): string {
  switch (slot) {
    case 'morning':
      return 'Morning (6–8 AM)';
    case 'noon':
      return 'Noon (8 AM–2 PM)';
    case 'evening':
      return 'Evening (2–7 PM)';
    case 'night':
      return 'Night (7–12 AM)';
    case 'late_night':
      return 'Late Night (12–6 AM)';
  }
}

export function parseNaturalLanguageInput(
  rawInput: string,
  accounts: Account[],
  categories: Category[]
): ParsedNLPInput {
  let text = rawInput.trim();
  if (!text) {
    return {
      description: '',
      amount: 0,
      type: 'expense',
      tags: [],
    };
  }

  // 1. Extract Bracketed Notes e.g. [split with rohit] or (for office)
  let notes = '';
  const bracketMatch = text.match(/\[(.*?)\]/) || text.match(/\((.*?)\)/);
  if (bracketMatch) {
    notes = bracketMatch[1].trim();
    text = text.replace(bracketMatch[0], ' ').trim();
  }

  // 2. Extract Hashtags e.g. #chai #kirana #swiggy #office
  const tags: string[] = [];
  const tagMatches = text.match(/#([\w-]+)/g);
  if (tagMatches) {
    tagMatches.forEach(t => tags.push(t.toLowerCase()));
    text = text.replace(/#([\w-]+)/g, ' ').trim();
  }

  // 3. Extract Time (Individual times e.g. 12:23 am/pm, 8:30pm, 9am, 14:30 AND Named Periods e.g. morning, noon, evening, night, late night)
  let parsedTime: string | undefined = undefined;
  let parsedTimeSlot: TimeSlot | undefined = undefined;

  // 3a. Exact Time with Minutes & AM/PM (e.g. "12:23 am", "12:23pm", "8:30pm", "8.30 am", "@09:15am")
  const exactTimeAmpmMatch = text.match(/(?:@|\bat\s+)?\b(1[0-2]|0?[1-9])[:.]([0-5]\d)\s*(am|pm)\b/i);
  if (exactTimeAmpmMatch) {
    let hour = parseInt(exactTimeAmpmMatch[1], 10);
    const minute = exactTimeAmpmMatch[2];
    const ampm = exactTimeAmpmMatch[3].toLowerCase();

    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;

    const formattedHour = hour.toString().padStart(2, '0');
    parsedTime = `${formattedHour}:${minute}`;
    parsedTimeSlot = getTimeSlotFromTimeString(parsedTime);
    text = text.replace(exactTimeAmpmMatch[0], ' ').trim();
  }

  // 3b. 24-hour Time Format with Minutes (e.g. "14:30", "12:23", "07:15", "23:45", "@15:00")
  if (!parsedTime) {
    const time24Match = text.match(/(?:@|\bat\s+)?\b([01]?\d|2[0-3]):([0-5]\d)\b/i);
    if (time24Match) {
      const hour = parseInt(time24Match[1], 10).toString().padStart(2, '0');
      const minute = time24Match[2];
      parsedTime = `${hour}:${minute}`;
      parsedTimeSlot = getTimeSlotFromTimeString(parsedTime);
      text = text.replace(time24Match[0], ' ').trim();
    }
  }

  // 3c. Hour Only with AM/PM (e.g. "8pm", "8 pm", "9am", "11pm", "2am", "@8pm")
  if (!parsedTime) {
    const hourAmpmMatch = text.match(/(?:@|\bat\s+)?\b(1[0-2]|0?[1-9])\s*(am|pm)\b/i);
    if (hourAmpmMatch) {
      let hour = parseInt(hourAmpmMatch[1], 10);
      const ampm = hourAmpmMatch[2].toLowerCase();

      if (ampm === 'pm' && hour < 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;

      const formattedHour = hour.toString().padStart(2, '0');
      parsedTime = `${formattedHour}:00`;
      parsedTimeSlot = getTimeSlotFromTimeString(parsedTime);
      text = text.replace(hourAmpmMatch[0], ' ').trim();
    }
  }

  // 3d. Named Period Slots (User specs: late night [0-6], morning [6-8], noon [8-14], evening [14-19], night [19-24])
  if (!parsedTime) {
    // Late Night (00:00 - 06:00)
    if (/\b(late\s*night|midnight|mid\s*night|wee\s*hours)\b/i.test(text)) {
      parsedTime = '02:00';
      parsedTimeSlot = 'late_night';
      text = text.replace(/\b(late\s*night|midnight|mid\s*night|wee\s*hours)\b/gi, ' ').trim();
    }
    // Morning (06:00 - 08:00 AM)
    else if (/\b(morning|early\s*morning|subah|dawn)\b/i.test(text)) {
      parsedTime = '07:00';
      parsedTimeSlot = 'morning';
      text = text.replace(/\b(morning|early\s*morning|subah|dawn)\b/gi, ' ').trim();
    }
    // Noon / Afternoon (08:00 - 14:00 / 8 AM - 2 PM)
    else if (/\b(noon|afternoon|midday|dopahar|lunchtime|lunch\s*hour)\b/i.test(text)) {
      parsedTime = '12:30';
      parsedTimeSlot = 'noon';
      text = text.replace(/\b(noon|afternoon|midday|dopahar|lunchtime|lunch\s*hour)\b/gi, ' ').trim();
    }
    // Evening (14:00 - 19:00 / 2 PM - 7 PM)
    else if (/\b(evening|shaam|sundown|dusk|teatime)\b/i.test(text)) {
      parsedTime = '17:00';
      parsedTimeSlot = 'evening';
      text = text.replace(/\b(evening|shaam|sundown|dusk|teatime)\b/gi, ' ').trim();
    }
    // Night (19:00 - 24:00 / 7 PM - 12 AM)
    else if (/\b(night|tonight|raat|bedtime|post-dinner)\b/i.test(text)) {
      parsedTime = '21:00';
      parsedTimeSlot = 'night';
      text = text.replace(/\b(night|tonight|raat|bedtime|post-dinner)\b/gi, ' ').trim();
    }
  }

  // 4. Determine Transaction Type
  let type: TransactionType = 'expense';
  if (/\b(transfer|xfer|move|send)\b/i.test(text) || (/\bto\b/i.test(text) && /\b(vault|jar|savings|bank|wallet|gold)\b/i.test(text))) {
    type = 'transfer';
  } else if (/\b(income|salary|deposit|freelance|dividend|earned|refund|\+income|cashback|stipend)\b/i.test(text) || text.startsWith('+')) {
    type = 'income';
  }

  // Remove explicit type keywords from text
  text = text.replace(/\b(income|expense|transfer|\+income|\+expense|\+transfer)\b/gi, ' ').trim();
  if (text.startsWith('+')) text = text.slice(1).trim();

  // 5. Extract Amount (Supports ₹, Rs, Rs., INR, $, €, k/kilo e.g. 15, ₹50, 25k, Rs. 1500)
  let amount = 0;
  const amountRegex = /(?:₹|rs\.?|inr|[$€£¥])?\s*(\d+(?:[.,]\d+)?)\s*(k|kilos|thousand|lakh|lakhs)?\b/i;
  const amountMatch = text.match(amountRegex);
  
  if (amountMatch) {
    let numStr = amountMatch[1].replace(',', '.');
    let parsedNum = parseFloat(numStr);
    const suffix = (amountMatch[2] || '').toLowerCase();
    
    if (suffix.startsWith('k')) {
      parsedNum *= 1000;
    } else if (suffix.startsWith('lakh')) {
      parsedNum *= 100000;
    }

    if (!isNaN(parsedNum)) {
      amount = Math.round(parsedNum * 100) / 100;
    }
    // Remove the amount from string
    text = text.replace(amountMatch[0], ' ').trim();
  }

  // 6. Detect Accounts (Indian Payment Modes: UPI, GPay, Paytm, PhonePe, Cash, HDFC, SBI, ICICI, Card, Vault)
  let matchedAccountId: string | undefined = undefined;
  let matchedDestinationAccountId: string | undefined = undefined;

  // Check for "transfer X from AccountA to AccountB"
  const transferMatch = text.match(/(?:from\s+)?(\w+)\s+(?:to|into)\s+(\w+)/i);
  if (type === 'transfer' && transferMatch) {
    const fromWord = transferMatch[1].toLowerCase();
    const toWord = transferMatch[2].toLowerCase();

    const fromAcc = accounts.find(a => a.name.toLowerCase().includes(fromWord) || a.type.toLowerCase().includes(fromWord));
    const toAcc = accounts.find(a => a.name.toLowerCase().includes(toWord) || a.type.toLowerCase().includes(toWord));

    if (fromAcc) matchedAccountId = fromAcc.id;
    if (toAcc) matchedDestinationAccountId = toAcc.id;

    text = text.replace(transferMatch[0], ' ').trim();
  } else {
    // Payment mode aliases
    const accountAliases: Record<string, string[]> = {
      'acc_upi': ['upi', 'gpay', 'googlepay', 'paytm', 'phonepe', 'bhim', 'qr', 'scan'],
      'acc_cash': ['cash', 'pouch', 'wallet', 'pocket', 'haath', 'offline'],
      'acc_bank_primary': ['bank', 'hdfc', 'sbi', 'icici', 'axis', 'kotak', 'debit', 'netbanking', 'neft', 'imps', 'wire'],
      'acc_credit': ['card', 'credit', 'cc', 'cred', 'visa', 'mastercard', 'amex'],
      'acc_vault': ['vault', 'gold', 'sip', 'fd', 'rd', 'reserve', 'emergency'],
    };

    for (const [accId, keywords] of Object.entries(accountAliases)) {
      for (const kw of keywords) {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(text)) {
          const acc = accounts.find(a => a.id === accId) || accounts.find(a => a.name.toLowerCase().includes(kw));
          if (acc) {
            matchedAccountId = acc.id;
            text = text.replace(regex, ' ').trim();
            break;
          }
        }
      }
      if (matchedAccountId) break;
    }

    // Direct account name check if not matched via aliases
    if (!matchedAccountId) {
      for (const acc of accounts) {
        const accNameLower = acc.name.toLowerCase();
        const words = accNameLower.split(/[\s/()•-]+/).filter(w => w.length > 2);
        for (const w of words) {
          const regex = new RegExp(`\\b${w}\\b`, 'i');
          if (regex.test(text)) {
            matchedAccountId = acc.id;
            text = text.replace(regex, ' ').trim();
            break;
          }
        }
        if (matchedAccountId) break;
      }
    }
  }

  // Default to UPI or Cash if available
  if (!matchedAccountId && accounts.length > 0) {
    const defaultAcc = accounts.find(a => a.id === 'acc_upi') || accounts.find(a => a.type === 'cash') || accounts[0];
    matchedAccountId = defaultAcc?.id;
  }

  // 7. Detect Indian Categories
  let matchedCategoryId: string | undefined = undefined;

  const keywordCategoryMap: Record<string, string[]> = {
    'Chai, Street Food & Dining': [
      'chai', 'tea', 'coffee', 'samosa', 'dosa', 'idli', 'biryani', 'thali', 'paratha', 'vada', 'pav',
      'cafe', 'restaurant', 'swiggy', 'zomato', 'mcdonalds', 'dominos', 'burger', 'pizza', 'dinner',
      'lunch', 'breakfast', 'snack', 'mithai', 'sweets', 'lassi', 'street', 'food', 'bakery'
    ],
    'Kirana, Groceries & Milk': [
      'kirana', 'grocery', 'groceries', 'supermarket', 'amul', 'milk', 'doodh', 'dahi', 'atta', 'rice',
      'dal', 'sabzi', 'vegetables', 'fruits', 'zepto', 'blinkit', 'instamart', 'bigbasket', 'dmart',
      'paneer', 'bread', 'eggs', 'pantry', 'ration'
    ],
    'Auto, Metro, Cab & Petrol': [
      'auto', 'rickshaw', 'metro', 'cab', 'uber', 'ola', 'rapido', 'petrol', 'diesel', 'fuel',
      'fastag', 'toll', 'bus', 'train', 'irctc', 'parking', 'flight', 'cabs', 'transit'
    ],
    'Rent & Society Maintenance': [
      'rent', 'society', 'maintenance', 'maid', 'cook', 'bai', 'flat', 'pg', 'deposit', 'landlord',
      'house', 'plumber', 'electrician'
    ],
    'Electricity, WiFi & Recharge': [
      'wifi', 'broadband', 'internet', 'airtel', 'jio', 'vi', 'recharge', 'electricity', 'bijli',
      'bescom', 'tatapower', 'water', 'cylinder', 'gas', 'lpg', 'bill', 'utility'
    ],
    'OTT & Entertainment': [
      'netflix', 'prime', 'hotstar', 'spotify', 'youtube', 'movie', 'pvr', 'inox', 'bookmyshow',
      'cinema', 'gaming', 'steam', 'playstation', 'concert', 'standup'
    ],
    'Medicines & Healthcare': [
      'medicine', 'pharmacy', 'chemist', 'doctor', '1mg', 'apollo', 'pharmeasy', 'hospital', 'clinic',
      'lab', 'test', 'gym', 'cult', 'yoga', 'protein', 'dental', 'medicines'
    ],
    'Books, Stationery & Craft': [
      'book', 'books', 'pen', 'notebook', 'stationery', 'paper', 'kindle', 'course', 'udemy', 'puja',
      'pooja', 'craft', 'art', 'reading'
    ],
    'Salary, UPI Credit & Dividends': [
      'salary', 'paycheck', 'freelance', 'stipend', 'client', 'payment', 'bonus', 'dividend',
      'interest', 'cashback', 'refund', 'inflow'
    ],
  };

  const textLower = text.toLowerCase();
  for (const [catName, keywords] of Object.entries(keywordCategoryMap)) {
    if (keywords.some(k => textLower.includes(k))) {
      const foundCat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
      if (foundCat) {
        matchedCategoryId = foundCat.id;
        break;
      }
    }
  }

  // If still not found, check direct category names
  if (!matchedCategoryId) {
    for (const cat of categories) {
      if (textLower.includes(cat.name.toLowerCase())) {
        matchedCategoryId = cat.id;
        break;
      }
    }
  }

  // Default based on type
  if (!matchedCategoryId && categories.length > 0) {
    if (type === 'income') {
      const incCat = categories.find(c => c.name.toLowerCase().includes('salary') || c.name.toLowerCase().includes('income')) || categories[0];
      matchedCategoryId = incCat.id;
    } else {
      matchedCategoryId = categories[0].id;
    }
  }

  // 8. Clean up remaining text for Description
  let description = text
    .replace(/\b(paid|spent|bought|for|at|on|with|from|to|via|using|by)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!description) {
    const cat = categories.find(c => c.id === matchedCategoryId);
    description = cat ? cat.name.split(',')[0] : (type === 'income' ? 'Income' : 'Daily Expense');
  }

  // Capitalize first letter
  description = description.charAt(0).toUpperCase() + description.slice(1);

  return {
    description,
    amount,
    type,
    accountId: matchedAccountId,
    destinationAccountId: matchedDestinationAccountId,
    categoryId: matchedCategoryId,
    tags,
    notes: notes || undefined,
    time: parsedTime,
    timeSlot: parsedTimeSlot,
  };
}
