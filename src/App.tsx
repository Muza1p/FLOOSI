import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Activity, ArrowDownLeft, ArrowUpRight, BriefcaseBusiness,
  CalendarDays, ChevronLeft, ChevronRight, CirclePlus,
  Coins, LayoutDashboard, List, Plus, Search, ShoppingBasket,
  Sparkles, Wallet, X, Utensils, House, Car, HeartPulse,
  BookOpen, UserRound, Gift, Repeat, Gamepad2, ShoppingBag,
  Ellipsis, Check, SlidersHorizontal, Pencil, Trash2, Settings as SettingsIcon,
} from 'lucide-react'

import { useFinanceStore } from './features/finance/store'
import { calculateFinancialSummary } from './features/finance/calculateSummary'
import { defaultExpenseCategories } from './features/expenses/defaultCategories'
import type { FinanceScope, MovementKind, IncomeSource } from './features/finance/types'
import type { PurchaseItem } from './features/expenses/types'
import { playFeedbackSound } from './features/feedback/sounds'

const categoryEmoji = (id: string, name: string) => {
  void name
  const emojis: Record<string, string> = {
    food: '🍲', vegetables: '🥬', tomatoes: '🍅', potatoes: '🥔',
    cucumber: '🥒', lettuce: '🥬', watermelon: '🍉', onion: '🧅',
    garlic: '🧄', carrot: '🥕', eggplant: '🍆', pepper: '🌶️',
    okra: '🥗', zucchini: '🥒', lemon: '🍋', fruits: '🍇',
    apple: '🍎', banana: '🍌', orange: '🍊', grapes: '🍇',
    dates: '🌴', strawberry: '🍓', melon: '🍈',
    'meat-fish': '🥩', chicken: '🐔', beef: '🥩', lamb: '🍖',
    duck: '🦆', fish: '🐟', 'minced-meat': '🥩', eggs: '🥚',
    dairy: '🥛', milk: '🥛', yogurt: '🥣', cheese: '🧀',
    butter: '🧈', bakery: '🥖', bread: '🍞', rice: '🍚',
    flour: '🌾', sugar: '🍬', oil: '🫒', 'tea-coffee': '☕',
    spices: '🧂', 'canned-food': '🥫', snacks: '🍿',
    'water-drinks': '🧃', personal: '🧴', hygiene: '🧼',
    miswak: '🪥', toothpaste: '🦷', shampoo: '🧴',
    soap: '🧼', deodorant: '🌸', shaving: '🪒',
    'skin-care': '🧴', 'hair-care': '💇', clothing: '👕',
    shoes: '👟', accessories: '⌚', laundry: '🧺',
    home: '🏠', rent: '🏡', electricity: '💡', water: '🚰',
    gas: '🔥', internet: '📶', 'phone-bill': '📱',
    cleaning: '🧹', 'home-tools': '🛠️', furniture: '🛋️',
    maintenance: '🔧', kitchen: '🍳', 'home-appliances': '🧊',
    transport: '🚗', fuel: '⛽', taxi: '🚕', bus: '🚌',
    commuting: '🚘', 'school-transport': '🚌',
    'car-maintenance': '🔧', 'car-wash': '🚿', parking: '🅿️',
    health: '❤️', medicines: '💊', doctor: '🩺', tests: '🧪',
    hospital: '🏥', dental: '🦷', glasses: '👓',
    education: '📚', books: '📖', stationery: '✏️',
    tuition: '🎓', printing: '🖨️', 'education-transport': '🚌',
    family: '👨‍👩‍👧‍👦', children: '🧸', 'baby-food': '🍼',
    'family-needs': '🛒', 'family-support': '🤝',
    shopping: '🛍️', electronics: '💻', 'phone-accessories': '📱',
    tools: '🧰', 'online-shopping': '📦',
    subscriptions: '🔁', 'mobile-subscriptions': '📲',
    streaming: '🎬', apps: '📱', 'cloud-services': '☁️',
    entertainment: '🎮', restaurants: '🍽️', cafes: '☕',
    games: '🎮', trips: '🧳', hobbies: '🎨',
    gifts: '🎁', 'gifts-others': '🎁', occasions: '🎉',
    donations: '💝', other: '🧾', 'custom-expense': '📝',
  }
  return emojis[id] ?? '🧾'
}

type Page = 'home' | 'purchases' | 'income' | 'records' | 'settings'
type AppMode = 'personal' | 'merchant'

const money = (amount: number) =>
  new Intl.NumberFormat('ar-IQ', { maximumFractionDigits: 0 }).format(amount)

const cashBreakdown = (value: number) => {
  let remaining = Math.floor(value)
  return [50000, 25000, 10000, 5000, 1000, 500, 250].flatMap((denomination) => {
    const count = Math.floor(remaining / denomination)
    remaining %= denomination
    return count > 0 ? [{ denomination, count }] : []
  })
}


const evaluateArithmeticExpression = (source: string): number => {
  const tokens = source.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
    .match(/\d+(?:\.\d*)?|\.\d+|[+\-*/()%]/g) ?? []
  const compact = source.replace(/\s/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
  if (!tokens.length || tokens.join('') !== compact) throw new Error('Invalid expression')

  let index = 0
  const factor = (): number => {
    let value: number
    if (tokens[index] === '+') {
      index++
      value = factor()
    } else if (tokens[index] === '-') {
      index++
      value = -factor()
    } else if (tokens[index] === '(') {
      index++
      value = expression()
      if (tokens[index] !== ')') throw new Error('Missing closing parenthesis')
      index++
    } else {
      const token = tokens[index++]
      if (!token || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token)) throw new Error('Invalid number')
      value = Number(token)
    }
    while (tokens[index] === '%') {
      value /= 100
      index++
    }
    return value
  }
  const term = (): number => {
    let value = factor()
    while (tokens[index] === '*' || tokens[index] === '/') {
      const operator = tokens[index++]
      const next = factor()
      if (operator === '/' && next === 0) throw new Error('Division by zero')
      value = operator === '*' ? value * next : value / next
    }
    return value
  }
  const expression = (): number => {
    let value = term()
    while (tokens[index] === '+' || tokens[index] === '-') {
      const operator = tokens[index++]
      const next = term()
      value = operator === '+' ? value + next : value - next
    }
    return value
  }

  const result = expression()
  if (index !== tokens.length || !Number.isFinite(result)) throw new Error('Invalid result')
  return result
}

const today = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString().slice(0, 10)

const icons: Record<string, typeof Wallet> = {
  utensils: Utensils, house: House, car: Car, 'heart-pulse': HeartPulse,
  'book-open': BookOpen, user: UserRound, gift: Gift, repeat: Repeat,
  'gamepad-2': Gamepad2, 'shopping-bag': ShoppingBag, ellipsis: Ellipsis,
}
void icons

const incomeSources: { value: IncomeSource; label: string }[] = [
  { value: 'salary', label: 'راتب شهري' },
  { value: 'daily_work', label: 'عمل يومي' },
  { value: 'freelance', label: 'عمل حر' },
  { value: 'other', label: 'مصدر آخر' },
]

export default function App() {
  const movements = useFinanceStore((s) => s.movements)
  const addMovement = useFinanceStore((s) => s.addMovement)
  const updateMovement = useFinanceStore((s) => s.updateMovement)
  const deleteMovement = useFinanceStore((s) => s.deleteMovement)
  const deletedMovements = useFinanceStore((s) => s.deletedMovements ?? [])
  const restoreMovement = useFinanceStore((s) => s.restoreMovement)
  const permanentlyDeleteMovement = useFinanceStore((s) => s.permanentlyDeleteMovement)
  const emptyTrash = useFinanceStore((s) => s.emptyTrash)

  const [page, setPage] = useState<Page>('home')
  const [settingsSection, setSettingsSection] = useState<'trash' | null>(null)
  const [appMode, setAppMode] = useState<AppMode>(() => {
    try {
      return localStorage.getItem('tadbiri-app-mode') === 'merchant' ? 'merchant' : 'personal'
    } catch {
      return 'personal'
    }
  })
  const changeAppMode = (mode: AppMode) => {
    setAppMode(mode)
    setPage('home')
    setShowForm(false)
    setShowQuickActions(false)
    try { localStorage.setItem('tadbiri-app-mode', mode) } catch (error) { console.warn('Could not save app mode:', error) }
  }
  const [showForm, setShowForm] = useState(false)
  const [editingMovementId, setEditingMovementId] = useState<string | null>(null)
    const [showQuickActions, setShowQuickActions] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return localStorage.getItem('tadbiri-sounds') !== 'off' } catch { return true }
  })
  const [celebration, setCelebration] = useState(false)
const [kind, setKind] = useState<MovementKind>('expense')
  const [scope, setScope] = useState<FinanceScope>('personal')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [calculatorExpression, setCalculatorExpression] = useState('')
  const [purchaseBasket, setPurchaseBasket] = useState<PurchaseItem[]>([])
  const [date, setDate] = useState(today())
  const [incomeSource, setIncomeSource] = useState<IncomeSource>('salary')
  const [categoryId, setCategoryId] = useState('')
  const [categoryPath, setCategoryPath] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [formError, setFormError] = useState('')

  const summary = useMemo(() => calculateFinancialSummary(movements), [movements])
  const iqD = summary.find((item) => item.currencyCode === 'IQD')
  const income = iqD?.totalIncomeMinor ?? 0
  const remaining = iqD?.personalRemainingMinor ?? 0
  const expenses = iqD?.totalPersonalExpensesMinor ?? 0
  const workNet = iqD?.workNetMinor ?? 0
  const workCosts = iqD?.totalWorkCostsMinor ?? 0

  const recent = useMemo(
    () => [...movements].sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    ),
    [movements],
  )

  const roots = defaultExpenseCategories.filter((c) => !c.parentId)
  const activeParent = categoryPath.at(-1)
  const visibleCategories = activeParent
    ? defaultExpenseCategories.filter((c) => c.parentId === activeParent)
    : roots

  const searchResults = search.trim()
    ? defaultExpenseCategories.filter((c) =>
        c.name.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : []

  const selectedCategory = defaultExpenseCategories.find((c) => c.id === categoryId)

  const basketTotal = useMemo(
    () => purchaseBasket.reduce((sum, item) => sum + item.totalMinor, 0),
    [purchaseBasket],
  )

  const addToBasket = (id: string, name: string) => {
    setPurchaseBasket((items) => {
      const existing = items.find((item) => item.name === name)
      if (existing) {
        return items.map((item) =>
          item.id === existing.id
            ? { ...item, quantity: item.quantity + 1, totalMinor: (item.quantity + 1) * item.unitPriceMinor }
            : item,
        )
      }
      return [...items, {
        id: crypto.randomUUID(),
        name,
        quantity: 1,
        unitPriceMinor: 0,
        totalMinor: 0,
      }]
    })
    setSearch('')
    setFormError('')
    void id
  }

  const updateBasketItem = (id: string, updates: Partial<PurchaseItem>) => {
    setPurchaseBasket((items) => items.map((item) => {
      if (item.id !== id) return item
      const next = { ...item, ...updates }
      next.quantity = Math.max(1, Number(next.quantity) || 1)
      next.unitPriceMinor = Math.max(0, Number(next.unitPriceMinor) || 0)
      next.totalMinor = next.quantity * next.unitPriceMinor
      return next
    }))
  }

  const removeBasketItem = (id: string) => {
    setPurchaseBasket((items) => items.filter((item) => item.id !== id))
  }

  const openBasketForm = () => {
    if (purchaseBasket.length === 0 || basketTotal <= 0) {
      setFormError('أضف المنتجات وحدد أسعارها أولاً.')
      return
    }
    setKind('expense')
    setTitle('مشتريات متعددة')
    setCategoryId('')
    setAmount(String(basketTotal))
    setDate(today())
    setFormError('')
    setShowForm(true)
  }


  const openForm = (type: MovementKind, selectedCategoryId = '') => {
    setEditingMovementId(null)
    setPurchaseBasket([])
    setShowQuickActions(false)
    setShowCalculator(false)
    setKind(type)
    setCategoryId(selectedCategoryId)
    setTitle(
      selectedCategoryId
        ? defaultExpenseCategories.find((c) => c.id === selectedCategoryId)?.name ?? ''
        : '',
    )
    setAmount('')
    setDate(today())
    setFormError('')
    setShowForm(true)
  }

  const openEditMovement = (item: (typeof recent)[number]) => {
    const d = new Date(item.occurredAt)
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    setEditingMovementId(item.id)
    setKind(item.kind)
    setScope(item.scope)
    setTitle(item.title)
    setAmount(String(item.amountMinor))
    setDate(localDate)
    setCategoryId(item.categoryId ?? '')
    setIncomeSource(item.incomeSource ?? 'salary')
    setPurchaseBasket(item.items ?? [])
    setFormError('')
    setShowQuickActions(false)
    setShowCalculator(false)
    setShowForm(true)
  }

  const submitMovement = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const numericAmount = kind === 'expense' && purchaseBasket.length > 0 ? basketTotal : Number(amount)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormError('أدخل مبلغاً صحيحاً أكبر من صفر.')
      return
    }

    const finalTitle = title.trim() || selectedCategory?.name || (kind === 'income' ? 'دخل جديد' : 'مصروف عام')

    const movement = {
      id: editingMovementId ?? crypto.randomUUID(),
      title: finalTitle,
      kind,
      scope,
      amountMinor: Math.round(numericAmount),
      currencyCode: 'IQD',
      occurredAt: new Date(`${date}T12:00:00`).toISOString(),
      expenseNature: kind === 'expense' ? scope === 'work' ? 'work_cost' as const : 'personal' as const : undefined,
      categoryId: kind === 'expense' && categoryId ? categoryId : undefined,
      incomeSource: kind === 'income' ? incomeSource : undefined,
      items: kind === 'expense' && purchaseBasket.length > 0 ? purchaseBasket : undefined,
    }

    if (editingMovementId) {
      updateMovement(editingMovementId, movement)
    } else {
      addMovement(movement)
    }
    if (soundEnabled) playFeedbackSound('success')
    setCelebration(true)
    setShowForm(false)
    setEditingMovementId(null)
    setShowQuickActions(false)
    setTitle('')
    setAmount('')
    if (kind === 'expense' && purchaseBasket.length > 0) setPurchaseBasket([])
    setFormError('')
    setPage('home')
  }

  const navigateCategory = (id: string) => {
    const hasChildren = defaultExpenseCategories.some((c) => c.parentId === id)
    if (hasChildren) {
      setCategoryPath((path) => [...path, id])
    } else {
      openForm('expense', id)
    }
  }

  const goBackCategory = () => setCategoryPath((path) => path.slice(0, -1))

  const progress = income > 0 ? Math.min(100, Math.max(0, (remaining / income) * 100)) : 0


  const previousProgress = useRef<number | null>(null)

  useEffect(() => {
    try { localStorage.setItem('tadbiri-sounds', soundEnabled ? 'on' : 'off') } catch (error) { console.warn('Could not save sound preference:', error) }
  }, [soundEnabled])

  useEffect(() => {
    const previous = previousProgress.current
    if (soundEnabled && previous !== null) {
      if (previous > 50 && progress <= 50 && progress > 0) playFeedbackSound('halfway')
      if (previous > 0 && progress <= 0) playFeedbackSound('empty')
    }
    previousProgress.current = progress
  }, [progress, soundEnabled])

  useEffect(() => {
    if (!celebration) return
    const timeout = window.setTimeout(() => setCelebration(false), 1700)
    return () => window.clearTimeout(timeout)
  }, [celebration])
return (
    <main dir="rtl" className="min-h-screen overflow-x-hidden bg-[#101713] text-[#f1f0e7]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full bg-[#34533e]/20 blur-[110px]" />
        <div className="absolute -bottom-52 -left-40 h-[420px] w-[420px] rounded-full bg-[#a88c54]/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto min-h-screen w-full max-w-[1120px] px-4 pb-32 pt-6 sm:px-7 sm:pt-9">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#b6a477]/25 bg-gradient-to-br from-[#354c3b] to-[#1d2d24] text-[#dfc991] shadow-lg shadow-black/20">
              <Wallet size={23} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-wide">تدبيري</h1>
              <p className="mt-0.5 text-[11px] tracking-wider text-[#89968b]">إدارة أموالك بوعي</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled((enabled) => !enabled)}
              aria-label={soundEnabled ? 'إيقاف الأصوات' : 'تشغيل الأصوات'}
              title={soundEnabled ? 'إيقاف الأصوات' : 'تشغيل الأصوات'}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.035] text-lg transition hover:bg-white/10 active:scale-95"
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
            <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#b6c89a]" />
              <span className="text-[11px] text-[#a9b2a7]">مساحتك المالية</span>
            </div>
          </div>
        </header>

        <div className="mt-5 flex rounded-2xl border border-white/10 bg-[#18231c] p-1.5">
          <button
            type="button"
            onClick={() => changeAppMode('personal')}
            className={`flex-1 rounded-xl px-3 py-3 text-sm font-semibold transition ${appMode === 'personal' ? 'bg-[#354735] text-[#eadbb0] shadow-lg' : 'text-[#89968b]'}`}
          >
            <Wallet size={16} className="ml-2 inline" /> أموالي الشخصية
          </button>
          <button
            type="button"
            onClick={() => changeAppMode('merchant')}
            className={`flex-1 rounded-xl px-3 py-3 text-sm font-semibold transition ${appMode === 'merchant' ? 'bg-[#354735] text-[#eadbb0] shadow-lg' : 'text-[#89968b]'}`}
          >
            <ShoppingBag size={16} className="ml-2 inline" /> نشاطي التجاري
          </button>
        </div>

        {appMode === 'personal' ? (
        <AnimatePresence mode="wait">
          {page === 'home' && (
            <motion.section key="home" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-9 space-y-6">
              <div>
                <p className="text-xs tracking-wide text-[#9ca89b]">مساء الخير، هذه صورتك المالية</p>
                <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">كل مبلغ له وجهة.</h2>
                <p className="mt-2 text-sm text-[#829084]">تابع ما استلمته وما صرفته وما تبقّى لديك.</p>
              </div>

              <section className="relative overflow-hidden rounded-[30px] border border-[#b8a477]/20 bg-gradient-to-br from-[#263c2e] via-[#1d3025] to-[#17241c] p-5 shadow-2xl shadow-black/20 sm:p-8">
                <div className="pointer-events-none absolute -left-20 -top-28 h-72 w-72 rounded-full border border-[#d4c394]/10" />
                <div className="pointer-events-none absolute -left-10 -top-16 h-52 w-52 rounded-full border border-[#d4c394]/10" />
                <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
                  <div className="order-2 w-full sm:order-1 sm:flex-1">
                    <div className="flex items-center gap-2 text-sm text-[#c3cbbb]">
                      <Wallet size={17} className="text-[#d6c18f]" />
                      إجمالي المبلغ المستلم
                    </div>
                    <p className="mt-4 text-4xl font-semibold tracking-tight text-[#f4f0df] sm:text-5xl">
                      {money(income)}
                      <span className="mr-2 text-sm font-normal text-[#b4c0b0]">د.ع</span>
                    </p>
                    <p className="mt-3 text-xs text-[#aab7a8]">مجموع الأموال التي استلمتها وسجلتها في تدبيري</p>
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                        <div className="flex items-center gap-2 text-[11px] text-[#c2cbbb]"><ArrowUpRight size={15} /> إجمالي المصروف</div>
                        <p className="mt-2 text-lg font-semibold">{money(expenses)} <span className="text-[10px] font-normal text-[#aab7a8]">د.ع</span></p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                        <div className="flex items-center gap-2 text-[11px] text-[#c2cbbb]"><Wallet size={15} /> المبلغ المتبقي</div>
                        <p className="mt-2 text-lg font-semibold">{money(remaining)} <span className="text-[10px] font-normal text-[#aab7a8]">د.ع</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="order-1 flex shrink-0 flex-col items-center sm:order-2">
                    <motion.div
                      className="relative h-[230px] w-[230px] [perspective:900px]"
                      initial={{ opacity: 0, scale: 0.88, rotateX: 12 }}
                      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                      transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                    >
                      <motion.div
                        className="absolute inset-[13px] rounded-full border border-[#d5c18e]/10 shadow-[inset_0_0_35px_rgba(213,193,142,0.07),0_0_45px_rgba(184,164,119,0.10)]"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
                      />
                      <div className="absolute inset-[25px] rounded-full border border-white/[0.045] bg-[radial-gradient(circle_at_35%_25%,rgba(213,193,142,0.12),rgba(20,34,25,0.18)_58%,rgba(8,17,12,0.4))] shadow-[inset_0_8px_24px_rgba(255,255,255,0.025),inset_0_-12px_30px_rgba(0,0,0,0.28)]" />
                      <svg viewBox="0 0 230 230" className="absolute inset-0 h-full w-full -rotate-90 overflow-visible">
                        <defs>
                          <linearGradient id="tadbiriBalanceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f0dfad" />
                            <stop offset="48%" stopColor="#c8b47c" />
                            <stop offset="100%" stopColor="#829b70" />
                          </linearGradient>
                          <filter id="tadbiriBalanceGlow" x="-60%" y="-60%" width="220%" height="220%">
                            <feGaussianBlur stdDeviation="3.5" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>
                        <circle cx="115" cy="115" r="96" fill="none" stroke="rgba(255,255,255,.075)" strokeWidth="7" />
                        <circle cx="115" cy="115" r="84" fill="none" stroke="rgba(213,193,142,.10)" strokeWidth="1" />
                        <motion.circle
                          cx="115" cy="115" r="96" fill="none"
                          stroke="url(#tadbiriBalanceGradient)"
                          strokeWidth="8" strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 96}
                          initial={{ strokeDashoffset: 2 * Math.PI * 96 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 96 * (1 - progress / 100) }}
                          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                          filter="url(#tadbiriBalanceGlow)"
                        />
                        <motion.circle
                          cx="115" cy="19" r="3.5"
                          fill="#f0dfad"
                          animate={{ opacity: [0.55, 1, 0.55], scale: [0.85, 1.2, 0.85] }}
                          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[11px] tracking-[2px] text-[#b8c3b4]">نسبة المتبقي</span>
                        <motion.span
                          key={Math.round(progress)}
                          initial={{ opacity: 0, y: 8, scale: 0.88 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.45 }}
                          className="mt-2 text-[42px] font-semibold leading-none tracking-tight text-[#f1e7c9] drop-shadow-[0_2px_15px_rgba(213,193,142,0.22)]"
                        >
                          {Math.round(progress)}٪
                        </motion.span>
                        <span className="mt-2 text-[10px] text-[#9fac9d]">من إجمالي الدخل</span>
                        <span className="mt-3 h-px w-8 bg-gradient-to-r from-transparent via-[#d5c18e]/60 to-transparent" />
                        <span className="mt-2 text-[9px] tracking-wider text-[#b9c5ae]">تدبيري</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <button onClick={() => setPage('purchases')} className="group rounded-[22px] border border-[#b8a477]/20 bg-[#1a261f] p-4 text-right transition hover:border-[#c6b17e]/50 active:scale-[.98]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#354735] text-[#d8c58f]"><ShoppingBasket size={20} /></span>
                  <p className="mt-4 text-sm font-semibold">المشتريات</p>
                  <p className="mt-1 text-[11px] text-[#879488]">سجّل ما تشتريه</p>
                </button>
                <button onClick={() => openForm('income')} className="group rounded-[22px] border border-white/[0.08] bg-[#1a261f] p-4 text-right transition hover:border-[#a7b99c]/40 active:scale-[.98]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2a4034] text-[#b8d0b0]"><ArrowDownLeft size={20} /></span>
                  <p className="mt-4 text-sm font-semibold">إضافة دخل</p>
                  <p className="mt-1 text-[11px] text-[#879488]">راتب أو مصدر آخر</p>
                </button>
                <button onClick={() => setPage('records')} className="col-span-2 rounded-[22px] border border-white/[0.08] bg-[#1a261f] p-4 text-right transition hover:border-[#a7b99c]/40 active:scale-[.98] sm:col-span-1">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#403b2c] text-[#d9c58f]"><List size={20} /></span>
                  <p className="mt-4 text-sm font-semibold">السجل المالي</p>
                  <p className="mt-1 text-[11px] text-[#879488]">كل الحركات بالتفصيل</p>
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-white/[0.07] bg-[#18231c] p-5">
                  <div className="flex items-center justify-between text-[#a9b4a8]"><span className="flex items-center gap-2 text-xs"><BriefcaseBusiness size={16} /> صافي العمل</span><Activity size={17} className="text-[#c2b181]" /></div>
                  <p className="mt-4 text-2xl font-semibold">{money(workNet)} <span className="text-xs font-normal text-[#899589]">د.ع</span></p>
                  <p className="mt-2 text-[11px] text-[#778579]">بعد تكاليف العمل والسحوبات</p>
                </div>
                <div className="rounded-[22px] border border-white/[0.07] bg-[#18231c] p-5">
                  <div className="flex items-center justify-between text-[#a9b4a8]"><span className="flex items-center gap-2 text-xs"><Coins size={16} /> تكاليف العمل</span><SlidersHorizontal size={17} className="text-[#c2b181]" /></div>
                  <p className="mt-4 text-2xl font-semibold">{money(workCosts)} <span className="text-xs font-normal text-[#899589]">د.ع</span></p>
                  <p className="mt-2 text-[11px] text-[#778579]">المصروفات المسجلة على العمل</p>
                </div>
              </div>

              <section className="rounded-[24px] border border-white/[0.07] bg-[#18231c] p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div><h3 className="font-semibold">آخر الحركات</h3><p className="mt-1 text-[11px] text-[#829084]">آخر ما سجلته في حساباتك</p></div>
                  <button onClick={() => setPage('records')} className="text-xs text-[#d0bd8b]">عرض الكل <ChevronLeft size={14} className="inline" /></button>
                </div>
                {recent.length === 0 ? (
                  <div className="py-9 text-center">
                    <Sparkles size={25} className="mx-auto text-[#c6b17e]" />
                    <p className="mt-3 text-sm">ابدأ بتسجيل أول حركة</p>
                    <p className="mt-1 text-xs text-[#829084]">أموالك ستظهر هنا بعد إدخال بياناتك.</p>
                  </div>
                ) : (
                  <div className="mt-4 divide-y divide-white/[0.06]">
                    {recent.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.kind === 'income' ? 'bg-[#294235] text-[#b8d0b0]' : 'bg-[#40352a] text-[#d6b28d]'}`}>
                            {item.kind === 'income' ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
                          </span>
                          <div className="min-w-0"><p className="truncate text-sm">{item.title}</p><p className="mt-1 text-[10px] text-[#829084]">{new Date(item.occurredAt).toLocaleDateString('ar-IQ')}</p></div>
                        </div>
                        <p className={`shrink-0 text-sm font-semibold ${item.kind === 'income' ? 'text-[#b8d0b0]' : 'text-[#d6b28d]'}`}>{item.kind === 'income' ? '+' : '−'}{money(item.amountMinor)} د.ع</p>
                      </div>
                    ))}
                  </div>
                  )}
                </section>
              </motion.section>
            )}

            {page === 'settings' && (
            <motion.section key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-8 space-y-7">
              {settingsSection === 'trash' ? (
                <div>
                  <button type="button" onClick={() => setSettingsSection(null)} className="mb-7 inline-flex items-center gap-2 text-xs text-[#aab4a7]">
                    <ChevronRight size={16} /> الإعدادات
                  </button>
                  <div className="mb-6 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] text-[#b8a477]">إدارة البيانات</p>
                      <h2 className="mt-2 text-2xl font-semibold">المحذوفة مؤخراً</h2>
                      <p className="mt-2 text-xs text-[#829084]">السجلات التي حذفتها ويمكنك استعادتها.</p>
                    </div>
                    <span className="text-sm text-[#c4b487]">{deletedMovements.length} سجل</span>
                  </div>
                  {deletedMovements.length === 0 ? (
                    <div className="border-y border-white/[0.08] py-12 text-center">
                      <Trash2 size={23} className="mx-auto text-[#829084]" strokeWidth={1.5} />
                      <p className="mt-3 text-sm text-[#c4b487]">لا توجد سجلات محذوفة</p>
                      <p className="mt-1 text-[11px] text-[#829084]">ستظهر هنا السجلات بعد حذفها.</p>
                    </div>
                  ) : (
                    <div className="border-t border-white/[0.08]">
                      {deletedMovements.map(({ movement, deletedAt }) => (
                        <div key={movement.id} className="border-b border-white/[0.07] py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{movement.title}</p>
                              <p className="mt-1 text-[11px] text-[#9aa596]">{movement.kind === 'income' ? 'دخل' : 'مصروف'} · {money(movement.amountMinor)} د.ع</p>
                              <p className="mt-1 text-[10px] text-[#718073]">حُذف في {new Date(deletedAt).toLocaleString('ar-IQ')}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-3 pt-1">
                              <button type="button" onClick={() => restoreMovement(movement.id)} className="text-xs text-[#c4b487]">استعادة</button>
                              <button type="button" aria-label={`حذف ${movement.title} نهائياً`} onClick={() => { if (window.confirm(`حذف «${movement.title}» نهائياً؟ لا يمكن استعادته بعد ذلك.`)) permanentlyDeleteMovement(movement.id) }} className="rounded-lg p-1.5 text-[#c58f84]"><Trash2 size={15} /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={() => { if (window.confirm('هل تريد حذف جميع السجلات الموجودة في السلة نهائياً؟ لا يمكن التراجع عن ذلك.')) emptyTrash() }} className="mt-5 text-xs text-[#c58f84]">إفراغ سلة المحذوفات</button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="mb-8">
                    <p className="text-[11px] text-[#b8a477]">تدبيري · مساحة التحكم</p>
                    <h2 className="mt-2 text-2xl font-semibold">الإعدادات</h2>
                    <p className="mt-2 text-xs text-[#829084]">تحكم بتفاصيل التطبيق وبياناتك.</p>
                  </div>
                  <div className="border-y border-white/[0.08]">
                    <button type="button" onClick={() => setSettingsSection('trash')} className="group flex w-full items-center gap-4 py-4 text-right">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] text-[#c4b487]"><Trash2 size={17} strokeWidth={1.6} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">المحذوفة مؤخراً</span>
                        <span className="mt-1 block text-[11px] text-[#829084]">استعادة السجلات أو حذفها نهائياً</span>
                      </span>
                      <span className="min-w-6 text-center text-xs text-[#c4b487]">{deletedMovements.length}</span>
                      <ChevronLeft size={16} className="text-[#718073]" />
                    </button>
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {page === 'purchases' && (
            <motion.section key="purchases" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-9">
              <button onClick={() => { setPage('home'); setCategoryPath([]); setSearch('') }} className="mb-5 flex items-center gap-2 text-xs text-[#9ba99a]"><ChevronRight size={16} /> الرئيسية</button>
              <div className="flex items-end justify-between gap-3">
                <div><p className="text-xs text-[#c4b487]">إدارة المشتريات</p><h2 className="mt-2 text-3xl font-semibold">شنو اشتريت؟</h2><p className="mt-2 text-sm text-[#829084]">اختَر المجموعة ثم العنصر وسجّل المبلغ.</p></div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#b8a477]/20 bg-[#24372a] text-[#d5c18e]"><ShoppingBasket size={23} /></span>
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/[0.09] bg-[#19251e] px-4 py-3.5">
                <Search size={18} className="shrink-0 text-[#aeb9a9]" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث عن طماطة، مسواك، دجاج..." className="w-full bg-transparent text-sm outline-none placeholder:text-[#657367]" />
                {search && <button onClick={() => setSearch('')}><X size={17} className="text-[#9ba99a]" /></button>}
              </div>

              {search.trim() ? (
                <div className="mt-4 space-y-2">
                  <p className="mb-3 text-xs text-[#829084]">نتائج البحث ({searchResults.length})</p>
                  {searchResults.map((c) => {
                    const hasChildren = defaultExpenseCategories.some((x) => x.parentId === c.id)
                    return <button key={c.id} onClick={() => hasChildren ? setCategoryPath([c.id]) : addToBasket(c.id, c.name)} className="flex w-full items-center justify-between rounded-xl border border-white/[0.07] bg-[#19251e] px-4 py-3 text-right text-sm transition hover:border-[#b8a477]/40"><span className="flex items-center gap-3"><span className="text-xl">{categoryEmoji(c.id, c.name)}</span>{c.name}</span>{hasChildren ? <ChevronLeft size={16} className="text-[#a89a73]" /> : <Plus size={16} className="text-[#c5b17e]" />}</button>
                  })}
                  {searchResults.length === 0 && <p className="py-10 text-center text-sm text-[#829084]">ما لقينا هذا العنصر. تقدر تضيفه لاحقاً من تخصيص التصنيفات.</p>}
                </div>
              ) : (
                <>
                  {categoryPath.length > 0 && (
                    <button onClick={goBackCategory} className="mt-5 flex items-center gap-2 text-xs text-[#d1bd8a]"><ChevronRight size={15} /> رجوع للمجموعة السابقة</button>
                  )}
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {visibleCategories.map((c) => {
                      const hasChildren = defaultExpenseCategories.some((x) => x.parentId === c.id)
                      return (
                        <motion.button whileTap={{ scale: .97 }} key={c.id} onClick={() => navigateCategory(c.id)} className="flex min-h-[125px] flex-col items-start justify-between rounded-[22px] border border-white/[0.08] bg-gradient-to-br from-[#202e24] to-[#18231c] p-4 text-right transition hover:border-[#b8a477]/40">
                          <motion.span whileHover={{ scale: 1.12, rotate: -5 }} className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#b8a477]/15 bg-[#354333] text-[25px]">{categoryEmoji(c.id, c.name)}</motion.span>
                          <span className="flex w-full items-center justify-between gap-2 text-sm font-medium"><span>{c.name}</span>{hasChildren ? <ChevronLeft size={15} className="shrink-0 text-[#9b987b]" /> : <Plus size={15} className="shrink-0 text-[#c8b37d]" />}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </>
              )}

              {purchaseBasket.length > 0 && (
                <div className="mt-7 rounded-[24px] border border-[#b8a477]/25 bg-[#1b281f] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-[#c5b17e]">قائمة مشترياتك</p>
                      <h3 className="mt-1 text-xl font-semibold">السلة ({purchaseBasket.length})</h3>
                    </div>
                    <ShoppingBasket size={23} className="text-[#d5c18e]" />
                  </div>

                  <div className="mt-4 space-y-3">
                    {purchaseBasket.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-white/[0.07] bg-[#111a14] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm">{item.name}</p>
                          <button type="button" onClick={() => removeBasketItem(item.id)} className="rounded-lg p-2 text-[#d6a58c]" aria-label={`حذف ${item.name}`}>
                            <X size={17} />
                          </button>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <label className="text-[11px] text-[#9ba99a]">
                            سعر الوحدة بالدينار
                            <input
                              type="number"
                              min="0"
                              inputMode="numeric"
                              value={item.unitPriceMinor || ''}
                              onChange={(e) => updateBasketItem(item.id, { unitPriceMinor: Number(e.target.value) })}
                              placeholder="أدخل السعر"
                              className="mt-1 w-full rounded-xl border border-white/10 bg-[#1b281f] px-3 py-3 text-sm text-white outline-none focus:border-[#b8a477]/50"
                            />
                          </label>

                          <div>
                            <p className="text-[11px] text-[#9ba99a]">الكمية</p>
                            <div className="mt-1 flex items-center justify-between rounded-xl border border-white/10 bg-[#1b281f] px-2 py-2">
                              <button type="button" onClick={() => updateBasketItem(item.id, { quantity: item.quantity + 1 })} className="h-9 w-9 rounded-lg bg-[#354333] text-lg text-[#e5d5a8]">+</button>
                              <span className="font-semibold tabular-nums">{item.quantity}</span>
                              <button type="button" onClick={() => updateBasketItem(item.id, { quantity: Math.max(1, item.quantity - 1) })} className="h-9 w-9 rounded-lg bg-[#354333] text-lg text-[#e5d5a8]">−</button>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3 text-xs">
                          <span className="text-[#9ba99a]">إجمالي المنتج</span>
                          <span className="font-semibold text-[#e5d5a8]">{money(item.totalMinor)} د.ع</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-[#354333] px-4 py-3">
                    <span className="text-sm text-[#d5dfce]">المجموع الكلي</span>
                    <span className="text-lg font-bold tabular-nums text-[#e5d5a8]">{money(basketTotal)} د.ع</span>
                  </div>

                  {basketTotal <= 0 && (
                    <p className="mt-3 text-xs text-[#d6a58c]">أدخل سعر وحدة واحداً على الأقل لإكمال التسجيل.</p>
                  )}

                  <button
                    type="button"
                    disabled={basketTotal <= 0}
                    onClick={openBasketForm}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-[#c5b17e] to-[#9caa7c] py-3.5 text-sm font-bold text-[#172219] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Check size={17} /> متابعة وتسجيل المشتريات
                  </button>
                </div>
              )}

              <button onClick={() => openForm('expense')} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#b8a477]/30 bg-[#1b281f] py-4 text-sm text-[#d2c08f]"><CirclePlus size={18} /> تسجيل مصروف آخر</button>
            </motion.section>
          )}

          {page === 'income' && (
            <motion.section key="income" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-9">
              <p className="text-xs text-[#c4b487]">مصادر الأموال</p>
              <h2 className="mt-2 text-3xl font-semibold">إضافة دخل</h2>
              <p className="mt-2 text-sm text-[#829084]">سجّل الراتب أو أي مبلغ استلمته.</p>
              <div className="mt-7 grid grid-cols-2 gap-3">
                {incomeSources.map((source) => (
                  <button key={source.value} onClick={() => { setIncomeSource(source.value); setTitle(source.label); setKind('income'); setAmount(''); setShowForm(true) }} className="rounded-[22px] border border-white/[0.08] bg-[#1b281f] p-5 text-right transition hover:border-[#b8a477]/40">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#304432] text-[#c9d3b7]"><ArrowDownLeft size={20} /></span>
                    <p className="mt-4 text-sm font-semibold">{source.label}</p>
                    <p className="mt-1 text-[11px] text-[#829084]">إضافة مبلغ مستلم</p>
                  </button>
                ))}
              </div>
            </motion.section>
          )}

          {page === 'records' && (
            <motion.section key="records" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-9">
              <p className="text-xs text-[#c4b487]">الحسابات والتفاصيل</p>
              <h2 className="mt-2 text-3xl font-semibold">السجل المالي</h2>
              <p className="mt-2 text-sm text-[#829084]">كل الدخل والمصروفات التي أدخلتها.</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/[0.07] bg-[#1a261f] p-4"><p className="text-[11px] text-[#9ba99a]">إجمالي الدخل</p><p className="mt-2 text-lg font-semibold text-[#b8d0b0]">{money(income)} د.ع</p></div>
                <div className="rounded-2xl border border-white/[0.07] bg-[#1a261f] p-4"><p className="text-[11px] text-[#9ba99a]">المصروفات الشخصية</p><p className="mt-2 text-lg font-semibold text-[#d6b28d]">{money(expenses)} د.ع</p></div>
              </div>
              {recent.length === 0 ? <div className="py-16 text-center text-sm text-[#829084]">لا توجد حركات مسجلة حتى الآن.</div> : (
                <div className="mt-5 divide-y divide-white/[0.07] rounded-[22px] border border-white/[0.07] bg-[#18231c] px-4">
                  {recent.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.kind === 'income' ? 'bg-[#294235] text-[#b8d0b0]' : 'bg-[#40352a] text-[#d6b28d]'}`}>{item.kind === 'income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}</span>
                        <div className="min-w-0"><p className="truncate text-sm font-medium">{item.title}</p><p className="mt-1 text-[10px] text-[#829084]">{item.scope === 'work' ? 'العمل' : 'شخصي'} · {new Date(item.occurredAt).toLocaleDateString('ar-IQ')}</p></div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                      <p className={`text-sm font-semibold ${item.kind === 'income' ? 'text-[#b8d0b0]' : 'text-[#d6b28d]'}`}>{item.kind === 'income' ? '+' : '−'}{money(item.amountMinor)} د.ع</p>
                      <button type="button" onClick={() => openEditMovement(item)} aria-label="تعديل الحركة" title="تعديل" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#c4b487] transition hover:bg-white/[0.09]"><Pencil size={15} /></button>
                      <button type="button" onClick={() => { if (window.confirm(`هل تريد نقل «${item.title}» إلى المحذوفة مؤخراً؟ يمكنك استعادته من الإعدادات.`)) { deleteMovement(item.id); if (editingMovementId === item.id) { setShowForm(false); setEditingMovementId(null) } } }} aria-label="حذف الحركة" title="حذف" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#d6a29a] transition hover:bg-[#633b35]/30"><Trash2 size={15} /></button>
                    </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
        ) : (
          <motion.section
            key="merchant-foundation"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-9 space-y-5"
          >
            <div>
              <p className="text-xs text-[#c4b487]">إدارة النشاط التجاري</p>
              <h2 className="mt-2 text-3xl font-semibold">مساحة تجارتك</h2>
              <p className="mt-2 text-sm text-[#829084]">إدارة مستقلة للبضاعة والمبيعات والموردين والأرباح.</p>
            </div>
            <div className="rounded-2xl border border-[#b8a477]/20 bg-[#1a261f] p-5">
              <p className="text-sm font-semibold text-[#e1d3a8]">مساحة إدارة النشاط التجاري</p>
              <p className="mt-2 text-xs leading-7 text-[#9ba99a]">
                هنا ستُدار المنتجات والمخزون والمشتريات والمبيعات والزبائن والموردون والتقارير. تبقى بيانات التجارة مستقلة عن سجلات أموالك الشخصية.
              </p>
            </div>
          </motion.section>
        )}
        <AnimatePresence>
          {appMode === 'personal' && showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-5">
              <motion.form onSubmit={submitMovement} onClick={(e) => e.stopPropagation()} initial={{ y: 45, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 35, opacity: 0 }} transition={{ type: 'spring', damping: 26, stiffness: 280 }} className="max-h-[82svh] w-full max-w-lg overflow-y-auto rounded-t-[24px] border border-white/10 bg-[#1b281f] p-3 sm:rounded-[24px] sm:p-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-[11px] text-[#c5b17e]">{kind === 'income' ? 'إضافة مبلغ مستلم' : 'تسجيل عملية شراء'}</p><h3 className="mt-1 text-xl font-semibold">{kind === 'income' ? 'إضافة دخل جديد' : 'تسجيل مصروف'}</h3></div>
                  <button type="button" onClick={() => setShowForm(false)} className="rounded-xl bg-white/[0.07] p-2"><X size={19} /></button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-black/20 p-1">
                  <button type="button" onClick={() => setKind('income')} className={`rounded-lg py-3 text-sm ${kind === 'income' ? 'bg-[#354b38] text-[#d5e0ca]' : 'text-[#829084]'}`}>دخل</button>
                  <button type="button" onClick={() => setKind('expense')} className={`rounded-lg py-3 text-sm ${kind === 'expense' ? 'bg-[#4a3b2d] text-[#e2c5a4]' : 'text-[#829084]'}`}>مصروف</button>
                </div>

                {kind === 'income' && (
                  <>
                    <label className="mt-3 block text-xs text-[#aeb9a9]">مصدر الدخل</label>
                    <select value={incomeSource} onChange={(e) => { const v = e.target.value as IncomeSource; setIncomeSource(v); setTitle(incomeSources.find((x) => x.value === v)?.label ?? '') }} className="mt-2 w-full rounded-xl border border-white/10 bg-[#111a14] px-4 py-3.5 text-sm text-white outline-none">
                      {incomeSources.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </>
                )}

                <label className="mt-3 block text-xs text-[#aeb9a9]">الوصف</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === 'income' ? 'وصف اختياري: راتب أو عمل...' : 'وصف اختياري: مشتريات أو غرض... '} className="mt-2 w-full rounded-xl border border-white/10 bg-[#111a14] px-4 py-3.5 text-sm text-white outline-none placeholder:text-[#627064] focus:border-[#9caa7c]" />

                {kind === 'expense' && (
                  <div className="mt-4">
                    <label className="block text-xs text-[#aeb9a9]">التصنيف (اختياري)</label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#111a14] px-3 py-3 text-sm text-white outline-none focus:border-[#9caa7c]">
                      <option value="">بدون تصنيف</option>
                      {defaultExpenseCategories.map((c) => (
                        <option key={c.id} value={c.id}>{categoryEmoji(c.id, c.name)} {c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mt-3 rounded-2xl border border-[#b8a477]/20 bg-[#111a14] p-3 sm:p-4">
                  <label className="block text-xs text-[#aeb9a9]">المبلغ بالدينار العراقي</label>
                  <div className="mt-2 flex min-h-16 items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-all text-3xl font-bold tabular-nums text-[#e5d5a8]">{amount ? money(Number(amount)) : '٠'}</p>
                      <p className="mt-1 text-[10px] text-[#8f9b8d]">دينار عراقي</p>
                    </div>
                    <span className="shrink-0 text-3xl">💵</span>
                  </div>
                                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                    {[250, 500, 1000, 5000, 10000, 25000].map((value) => (
                      <button key={value} type="button" onClick={() => setAmount(String(Number(amount || 0) + value))} className="flex min-h-[58px] flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border border-[#b8a477]/30 bg-[#26352a] px-1.5 py-1 text-[#e5d5a8] shadow-sm transition active:scale-95">
                        <img src={`/currency-notes/iqd-${value}.jpg`} alt={`${money(value)} دينار عراقي`} className="h-7 w-full rounded object-contain" />
                        <span className="text-[11px] font-bold tabular-nums">{money(value)}</span>
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => { if (!showCalculator) setCalculatorExpression(amount || ''); setShowCalculator((v) => !v) }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#b8a477]/25 bg-[#26352a] py-2.5 text-xs font-semibold text-[#e5d5a8] active:scale-[.99]">
                    {showCalculator ? 'إغلاق الحاسبة' : 'فتح الحاسبة'}
                    <span>{showCalculator ? '⌃' : '⌄'}</span>
                  </button>
                  {showCalculator && (
                    <>
                    <div className="mt-3 rounded-xl border border-[#b8a477]/20 bg-[#17231b] p-3">
                      <div className="mb-3 rounded-lg border border-white/[0.06] bg-[#101812] p-3">
                        <p className="min-h-6 break-all text-left text-sm text-[#aeb9a9]">
                          {calculatorExpression || 'أدخل المعادلة'}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-xs text-[#8f9b8d]">الناتج</span>
                          <span className="break-all text-2xl font-bold tabular-nums text-[#e5d5a8]">
                            {(() => {
                              try {
                                return new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(evaluateArithmeticExpression(calculatorExpression))
                              } catch {
                                return '—'
                              }
                            })()}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {['7','8','9','÷','4','5','6','×','1','2','3','−','00','0','.','+','(',')','%'].map((key) => (
                          <button key={key} type="button"
                            onClick={() => setCalculatorExpression((current) => current + key)}
                            className={`min-h-12 rounded-xl border py-2 text-lg font-semibold transition active:scale-95 ${
                              ['÷','×','−','+','%','(',')'].includes(key)
                                ? 'border-[#b8a477]/25 bg-[#354333] text-[#e5d5a8]'
                                : 'border-white/[0.07] bg-white/[0.045] text-white'
                            }`}>
                            {key}
                          </button>
                        ))}
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-2">
                        <button type="button" onClick={() => setCalculatorExpression('')}
                          className="rounded-xl border border-[#b58c65]/20 bg-[#3b3025] py-3 text-sm font-semibold text-[#e2c5a4]">مسح الكل</button>
                        <button type="button" onClick={() => setCalculatorExpression((current) => current.slice(0, -1))}
                          className="rounded-xl border border-[#b58c65]/20 bg-[#3b3025] py-3 text-lg text-[#e2c5a4]">⌫</button>
                        <button type="button" onClick={() => {
                          try {
                            setCalculatorExpression(String(evaluateArithmeticExpression(calculatorExpression)))
                          } catch {
                            // المعادلة غير مكتملة
                          }
                        }}
                          className="rounded-xl border border-[#b8a477]/30 bg-[#354333] py-3 text-lg font-bold text-[#e5d5a8]">=</button>
                      </div>

                      {calculatorExpression && (() => {
                        try {
                          const result = evaluateArithmeticExpression(calculatorExpression)
                          return (
                            <button type="button" onClick={() => {
                              setAmount(String(result))
                              setShowCalculator(false)
                            }}
                              className="mt-3 w-full rounded-xl bg-gradient-to-l from-[#c5b17e] to-[#9caa7c] py-3 text-sm font-bold text-[#172219] active:scale-[.99]">
                              استخدام الناتج في المبلغ
                            </button>
                          )
                        } catch {
                          return <p className="mt-3 text-center text-xs text-[#d6a58c]">أكمل المعادلة بشكل صحيح</p>
                        }
                      })()}
                    </div>
                    </>
                  )}

                  {Number(amount) > 0 && (
                    <div className="mt-3 rounded-xl border border-[#b8a477]/15 bg-[#17231b]/80 p-3">
                      <p className="mb-2 text-xs font-semibold text-[#c9bd9b]">تفصيل المبلغ بالفئات النقدية</p>
                      <div className="flex flex-wrap gap-2">
                        {cashBreakdown(Number(amount)).map((item) => (
                          <span key={item.denomination} className="rounded-lg border border-white/[0.07] bg-white/[0.04] px-2.5 py-1.5 text-xs text-[#dce6d0]">
                            {money(item.denomination)} د.ع × {item.count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <label className="mt-3 block text-xs text-[#aeb9a9]">يُسجّل ضمن</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setScope('personal')} className={`rounded-xl border py-3 text-sm ${scope === 'personal' ? 'border-[#8fa27e] bg-[#304332] text-[#dce6d0]' : 'border-white/10 text-[#829084]'}`}>أموالي الشخصية</button>
                  <button type="button" onClick={() => setScope('work')} className={`rounded-xl border py-3 text-sm ${scope === 'work' ? 'border-[#8fa27e] bg-[#304332] text-[#dce6d0]' : 'border-white/10 text-[#829084]'}`}>العمل</button>
                </div>

                <label className="mt-3 flex items-center gap-2 text-xs text-[#aeb9a9]"><CalendarDays size={15} /> تاريخ العملية</label>
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#111a14] px-4 py-3.5 text-sm text-white outline-none" />

                {formError && <p className="mt-3 text-xs text-[#e4a28b]">{formError}</p>}
                <button type="submit" className="sticky bottom-0 mt-3 w-full rounded-xl bg-gradient-to-l from-[#c5b17e] to-[#9caa7c] py-3 text-sm font-bold text-[#172219] transition active:scale-[.99]"><Check size={17} className="ml-2 inline" /> {editingMovementId ? 'حفظ التعديلات' : 'حفظ العملية'}</button>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {celebration && (
            <motion.div
              initial={{ opacity: 0, scale: 0.75, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -12 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center"
            >
              <div className="rounded-[28px] border border-[#d7c58e]/30 bg-[#1b2920]/95 px-9 py-7 text-center shadow-2xl shadow-black/50 backdrop-blur-xl">
                <motion.div
                  initial={{ y: 12, rotate: -12 }}
                  animate={{ y: [0, -9, 0], rotate: [0, 8, -8, 0] }}
                  transition={{ duration: 0.8, repeat: 1 }}
                  className="text-5xl"
                >
                  💵✨
                </motion.div>
                <p className="mt-4 text-lg font-bold text-[#e5d5a8]">تم التسجيل بنجاح!</p>
                <p className="mt-1 text-xs text-[#aeb9a9]">كل خطوة تقرّبك من تنظيم أموالك 🎉</p>
              </div>
            </motion.div>
          )}

          {appMode === 'personal' && showQuickActions && !showForm && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              className="fixed bottom-[105px] left-1/2 z-50 w-[min(310px,calc(100%-32px))] -translate-x-1/2 rounded-[24px] border border-[#b8a477]/20 bg-[#1b2920]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-2xl"
            >
              <p className="px-2 pb-2 text-xs text-[#aeb9a9]">شنو تحب تسجل؟</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => openForm('income')} className="rounded-2xl border border-[#8fa27e]/25 bg-[#304332] p-4 text-right transition active:scale-95">
                  <span className="text-2xl">💵</span>
                  <span className="mt-2 block text-sm font-semibold text-[#e1e8d8]">استلمت فلوس</span>
                </button>
                <button type="button" onClick={() => openForm('expense')} className="rounded-2xl border border-[#b58c65]/20 bg-[#3b3025] p-4 text-right transition active:scale-95">
                  <span className="text-2xl">🛍️</span>
                  <span className="mt-2 block text-sm font-semibold text-[#e8d5c0]">سجلت مصروف</span>
                </button>
                <button type="button" onClick={() => { setShowQuickActions(false); setPage('purchases'); setCategoryPath([]); setSearch('') }} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-right transition active:scale-95">
                  <span className="text-2xl">🧺</span>
                  <span className="mt-2 block text-sm font-semibold">المشتريات</span>
                </button>
                <button type="button" onClick={() => { setShowQuickActions(false); setPage('records') }} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-right transition active:scale-95">
                  <span className="text-2xl">📒</span>
                  <span className="mt-2 block text-sm font-semibold">سجل العمليات</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          aria-label="فتح الإجراءات السريعة"
          aria-expanded={showQuickActions}
          onClick={() => setShowQuickActions((open) => !open)}
          whileTap={{ scale: 0.88, rotate: 45 }}
          className="fixed bottom-[91px] left-1/2 z-50 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border border-[#e4d2a0]/40 bg-gradient-to-br from-[#e0cf9f] to-[#a99b70] text-[#18231b] shadow-[0_8px_30px_rgba(0,0,0,.4)]"
        >
          <Plus size={27} strokeWidth={2.5} />
        </motion.button>

        {appMode === 'personal' && <nav className="fixed bottom-3 left-1/2 z-40 flex w-[calc(100%-24px)] max-w-[480px] -translate-x-1/2 items-center justify-around rounded-[23px] border border-white/[0.1] bg-[#18231e]/95 px-2 py-2 shadow-[0_12px_50px_rgba(0,0,0,.5)] backdrop-blur-2xl">
          {([
            { id: 'home', label: 'الرئيسية', icon: LayoutDashboard },
            { id: 'purchases', label: 'المشتريات', icon: ShoppingBasket },
            { id: 'income', label: 'الدخل', icon: ArrowDownLeft },
            { id: 'records', label: 'السجل', icon: List },
            { id: 'settings', label: 'الإعدادات', icon: SettingsIcon },
          ] as const).map((item) => {
            const Icon = item.icon
            const active = page === item.id
            return <button key={item.id} onClick={() => { setPage(item.id); setSettingsSection(null); setCategoryPath([]); setSearch('') }} className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2.5 transition ${active ? 'bg-[#354735] text-[#e1d3a8]' : 'text-[#829084]'}`}><Icon size={19} /><span className="text-[10px]">{item.label}</span></button>
          })}
        </nav>}
        </div>
      </main>
  )
}
