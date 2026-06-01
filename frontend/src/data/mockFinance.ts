interface Book {
  id: string;
  name: string;
  emoji: string;
  currency: string;
  description: string;
  createdAt: string;
  isActive: boolean;
}

interface FinanceAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  initialBalance: number;
  isArchived: boolean;
  emoji: string;
}

interface FinanceCategory {
  id: string;
  name: string;
  emoji: string;
  parentId: string | null;
  children: FinanceCategory[];
}

interface FinanceTag {
  id: string;
  name: string;
  color: string;
}

interface Budget {
  id: string;
  name: string;
  emoji: string;
  categoryName: string;
  amount: number;
  used: number;
  cycle: string;
  overspendThreshold: number;
}

interface FinanceEvent {
  id: string;
  name: string;
  emoji: string;
  description: string;
  startDate: string;
  endDate: string;
  color: string;
  incomeTotal: number;
  expenseTotal: number;
  transactionCount: number;
}

interface SubTransaction {
  id: string;
  note: string;
  amount: number;
  type: 'income' | 'expense';
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  categoryEmoji: string;
  note: string;
  date: string;
  account: string;
  tags: string[];
  parentId: string | null;
  subTransactions: SubTransaction[];
  bookId: string;
}

interface DashboardStats {
  totalAssets: number;
  totalAssetsDelta: number;
  monthlyIncome: number;
  monthlyIncomeDelta: number;
  monthlyExpense: number;
  monthlyExpenseDelta: number;
  monthlyBalance: number;
  savingsRate: number;
}

interface CategoryBreakdown {
  name: string;
  emoji: string;
  amount: number;
  color: string;
}

interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
}

// ===== Books =====
export const mockBooks: Book[] = [
  { id: '1', name: '日常账本', emoji: '📒', currency: 'CNY', description: '日常收支管理', createdAt: '2024-01-01', isActive: true },
  { id: '2', name: '工作报销', emoji: '💼', currency: 'CNY', description: '差旅与办公支出', createdAt: '2024-03-15', isActive: false },
  { id: '3', name: '家庭开支', emoji: '🏠', currency: 'CNY', description: '家庭日常消费', createdAt: '2024-06-01', isActive: false },
];

// ===== Accounts =====
export const mockAccounts: FinanceAccount[] = [
  { id: '1', name: '储蓄卡', type: '借记卡', balance: 86420.00, initialBalance: 50000.00, isArchived: false, emoji: '💳' },
  { id: '2', name: '信用卡', type: '信用卡', balance: -2580.00, initialBalance: 0.00, isArchived: false, emoji: '💳' },
  { id: '3', name: '微信钱包', type: '电子钱包', balance: 3200.00, initialBalance: 0.00, isArchived: false, emoji: '📱' },
  { id: '4', name: '旧银行卡', type: '虚拟账户', balance: 0.00, initialBalance: 10000.00, isArchived: true, emoji: '🏦' },
];

// ===== Categories =====
export const mockCategories: FinanceCategory[] = [
  {
    id: '1', name: '餐饮', emoji: '🍜', parentId: null,
    children: [
      { id: '1-1', name: '早餐', emoji: '🍳', parentId: '1', children: [] },
      { id: '1-2', name: '午餐', emoji: '🍱', parentId: '1', children: [] },
      { id: '1-3', name: '晚餐', emoji: '🍲', parentId: '1', children: [] },
      { id: '1-4', name: '下午茶', emoji: '☕', parentId: '1', children: [] },
    ],
  },
  {
    id: '2', name: '交通', emoji: '🚗', parentId: null,
    children: [
      { id: '2-1', name: '公共交通', emoji: '🚇', parentId: '2', children: [] },
      { id: '2-2', name: '加油', emoji: '⛽', parentId: '2', children: [] },
    ],
  },
  { id: '3', name: '购物', emoji: '🛍', parentId: null, children: [] },
  { id: '4', name: '娱乐', emoji: '🎮', parentId: null, children: [] },
  { id: '5', name: '医疗', emoji: '🏥', parentId: null, children: [] },
  { id: '6', name: '工资', emoji: '💰', parentId: null, children: [] },
  { id: '7', name: '其他', emoji: '📦', parentId: null, children: [] },
];

// ===== Tags =====
export const mockTags: FinanceTag[] = [
  { id: '1', name: '日常', color: '#E8E0FF' },
  { id: '2', name: '工作', color: '#D1FAE5' },
  { id: '3', name: '健康', color: '#FEE2E2' },
  { id: '4', name: '旅行', color: '#DBEAFE' },
  { id: '5', name: '教育', color: '#FEF3C7' },
  { id: '6', name: '礼物', color: '#EDE9FE' },
];

// ===== Budgets =====
export const mockBudgets: Budget[] = [
  { id: '1', name: '餐饮预算', emoji: '🍜', categoryName: '餐饮', amount: 2500, used: 1820, cycle: '每月', overspendThreshold: 100 },
  { id: '2', name: '交通预算', emoji: '🚗', categoryName: '交通', amount: 800, used: 320, cycle: '每月', overspendThreshold: 100 },
  { id: '3', name: '购物预算', emoji: '🛍', categoryName: '购物', amount: 2000, used: 2800, cycle: '每月', overspendThreshold: 100 },
];

// ===== Events =====
export const mockEvents: FinanceEvent[] = [
  {
    id: '1', name: '日本旅行', emoji: '🗾', description: '大阪 & 京都自由行',
    startDate: '2026-04-01', endDate: '2026-04-10', color: '#6C5CE7',
    incomeTotal: 0, expenseTotal: 8500, transactionCount: 24,
  },
  {
    id: '2', name: '居家办公月', emoji: '🏠', description: '远程办公期间开支',
    startDate: '2026-05-01', endDate: '2026-05-31', color: '#10B981',
    incomeTotal: 0, expenseTotal: 2100, transactionCount: 8,
  },
];

// ===== Transactions =====
export const mockTransactions: Transaction[] = [
  {
    id: 'tx1', type: 'expense', amount: 28.00, category: '餐饮', categoryEmoji: '🍜',
    note: '午餐 - 公司食堂', date: '2026-06-01 12:30', account: '借记卡',
    tags: ['日常'], parentId: null, subTransactions: [], bookId: '1',
  },
  {
    id: 'tx2', type: 'expense', amount: 6.00, category: '交通', categoryEmoji: '🚗',
    note: '地铁通勤', date: '2026-06-01 08:15', account: '电子钱包',
    tags: ['日常'], parentId: null, subTransactions: [], bookId: '1',
  },
  {
    id: 'tx3', type: 'income', amount: 12800.00, category: '工资', categoryEmoji: '💰',
    note: '6月薪资', date: '2026-05-31 10:00', account: '借记卡',
    tags: ['工作'], parentId: null, subTransactions: [], bookId: '1',
  },
  {
    id: 'tx4', type: 'expense', amount: 236.50, category: '购物', categoryEmoji: '🛍',
    note: '超市采购', date: '2026-05-30 18:20', account: '信用卡',
    tags: ['日常'], parentId: null, subTransactions: [], bookId: '1',
  },
  {
    id: 'tx5', type: 'expense', amount: 880.00, category: '医疗', categoryEmoji: '🏥',
    note: '体检 - 含 3 笔子交易', date: '2026-05-28 09:00', account: '借记卡',
    tags: ['健康'], parentId: null, subTransactions: [
      { id: 'sub1', note: '挂号费', amount: 50.00, type: 'expense' },
      { id: 'sub2', note: '血液检查', amount: 230.00, type: 'expense' },
      { id: 'sub3', note: 'CT 扫描', amount: 600.00, type: 'expense' },
    ], bookId: '1',
  },
  {
    id: 'tx6', type: 'expense', amount: 80.00, category: '娱乐', categoryEmoji: '🎬',
    note: '电影票', date: '2026-05-28 14:00', account: '电子钱包',
    tags: [], parentId: null, subTransactions: [], bookId: '1',
  },
  {
    id: 'tx7', type: 'expense', amount: 198.00, category: '娱乐', categoryEmoji: '🎮',
    note: 'Steam 游戏', date: '2026-05-30 21:00', account: '信用卡',
    tags: [], parentId: null, subTransactions: [], bookId: '1',
  },
  {
    id: 'tx8', type: 'expense', amount: 35.00, category: '餐饮', categoryEmoji: '🍜',
    note: '午餐 - 牛肉面', date: '2026-06-02 12:30', account: '现金',
    tags: ['日常'], parentId: null, subTransactions: [], bookId: '1',
  },
];

// ===== Dashboard =====
export const mockDashboardStats: DashboardStats = {
  totalAssets: 128560.00,
  totalAssetsDelta: 3200,
  monthlyIncome: 12800.00,
  monthlyIncomeDelta: 8,
  monthlyExpense: 6240.00,
  monthlyExpenseDelta: -12,
  monthlyBalance: 6560.00,
  savingsRate: 51,
};

export const mockCategoryBreakdown: CategoryBreakdown[] = [
  { name: '餐饮', emoji: '🍜', amount: 2340, color: '#EF4444' },
  { name: '交通', emoji: '🚗', amount: 1180, color: '#10B981' },
  { name: '购物', emoji: '🛍', amount: 860, color: '#3B82F6' },
  { name: '娱乐', emoji: '🎮', amount: 520, color: '#F59E0B' },
  { name: '其他', emoji: '📦', amount: 340, color: '#8B5CF6' },
];

export const mockMonthlyTrends: MonthlyTrend[] = [
  { month: '1月', income: 9800, expense: 5200 },
  { month: '2月', income: 8500, expense: 6700 },
  { month: '3月', income: 11000, expense: 5800 },
  { month: '4月', income: 9500, expense: 7600 },
  { month: '5月', income: 12500, expense: 6400 },
  { month: '6月', income: 11200, expense: 7200 },
];
