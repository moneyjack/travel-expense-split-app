export interface Member {
  id: string;
  name: string;
  avatar?: string; // Emoji or URL
  color?: string;
  isHost?: boolean;
}

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  assignedTo: string[]; // Array of Member IDs
}

export interface Expense {
  id: string;
  tripId: string;
  description: string;
  date: string;
  payerId: string;
  items: ReceiptItem[];
  totalAmount: number;
  isParsed?: boolean;
  receiptImageUrl?: string;
}

export interface Trip {
  id: string;
  name: string;
  date: string; // ISO string
  members: Member[];
  expenses: Expense[]; // Embedded expenses for simplicity
}

export interface Debt {
  from: string; // Member ID
  to: string;   // Member ID
  amount: number;
}

export interface GeminiParsedItem {
  name: string;
  quantity: number;
  price: number;
}

// Internal Navigation Enums
export enum AppView {
  TRIP_LIST = 'TRIP_LIST',
  CREATE_TRIP = 'CREATE_TRIP',
  TRIP_DETAIL = 'TRIP_DETAIL', // Holds the tab view
  MANAGE_MEMBERS = 'MANAGE_MEMBERS',
  GUEST_WELCOME = 'GUEST_WELCOME',
}

export enum TripTab {
  DASHBOARD = 'DASHBOARD',
  STATS = 'STATS',
}
