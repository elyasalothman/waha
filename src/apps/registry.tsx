import { lazy, type ComponentType } from "react";
const SalahApp = lazy(() => import("@/apps/life/salah").then((m) => ({ default: m.SalahApp })));
const WeatherApp = lazy(() =>
  import("@/apps/life/weather").then((m) => ({ default: m.WeatherApp })),
);
const HijriApp = lazy(() => import("@/apps/life/hijri").then((m) => ({ default: m.HijriApp })));
const QiblaApp = lazy(() => import("@/apps/life/qibla").then((m) => ({ default: m.QiblaApp })));
const ZakatApp = lazy(() => import("@/apps/life/zakat").then((m) => ({ default: m.ZakatApp })));
const TasbihApp = lazy(() => import("@/apps/life/tasbih").then((m) => ({ default: m.TasbihApp })));
const ClocksApp = lazy(() => import("@/apps/life/clocks").then((m) => ({ default: m.ClocksApp })));
const FuelApp = lazy(() => import("@/apps/life/fuel").then((m) => ({ default: m.FuelApp })));
const SalahlogApp = lazy(() =>
  import("@/apps/life/salahlog").then((m) => ({ default: m.SalahlogApp })),
);
const WaterApp = lazy(() => import("@/apps/life/water").then((m) => ({ default: m.WaterApp })));
const ShoppingApp = lazy(() =>
  import("@/apps/life/shopping").then((m) => ({ default: m.ShoppingApp })),
);
const CountdownApp = lazy(() =>
  import("@/apps/life/countdown").then((m) => ({ default: m.CountdownApp })),
);
const EmergencyApp = lazy(() =>
  import("@/apps/life/emergency").then((m) => ({ default: m.EmergencyApp })),
);
const SitesApp = lazy(() => import("@/apps/life/sites").then((m) => ({ default: m.SitesApp })));
const ServicesApp = lazy(() =>
  import("@/apps/life/services").then((m) => ({ default: m.ServicesApp })),
);
const PapersApp = lazy(() => import("@/apps/life/papers").then((m) => ({ default: m.PapersApp })));
const BillsApp = lazy(() => import("@/apps/life/bills").then((m) => ({ default: m.BillsApp })));
const AthkarApp = lazy(() => import("@/apps/life/athkar").then((m) => ({ default: m.AthkarApp })));
const KhatmaApp = lazy(() => import("@/apps/life/khatma").then((m) => ({ default: m.KhatmaApp })));
const MedsApp = lazy(() => import("@/apps/life/meds").then((m) => ({ default: m.MedsApp })));
const CarApp = lazy(() => import("@/apps/life/car").then((m) => ({ default: m.CarApp })));
const FastingApp = lazy(() =>
  import("@/apps/life/fasting").then((m) => ({ default: m.FastingApp })),
);
const FamilyApp = lazy(() => import("@/apps/life/family").then((m) => ({ default: m.FamilyApp })));
const AsmaApp = lazy(() => import("@/apps/life/asma").then((m) => ({ default: m.AsmaApp })));
const DuaApp = lazy(() => import("@/apps/life/dua").then((m) => ({ default: m.DuaApp })));
const UmrahApp = lazy(() => import("@/apps/life/umrah").then((m) => ({ default: m.UmrahApp })));
const HolidaysApp = lazy(() =>
  import("@/apps/life/holidays").then((m) => ({ default: m.HolidaysApp })),
);
const NazariApp = lazy(() => import("@/apps/life/nazari").then((m) => ({ default: m.NazariApp })));
const NamesApp = lazy(() => import("@/apps/life/names").then((m) => ({ default: m.NamesApp })));
const GreetApp = lazy(() => import("@/apps/life/greet").then((m) => ({ default: m.GreetApp })));
const LettersApp = lazy(() =>
  import("@/apps/life/letters").then((m) => ({ default: m.LettersApp })),
);
const TablesApp = lazy(() => import("@/apps/life/tables").then((m) => ({ default: m.TablesApp })));
const ProverbsApp = lazy(() =>
  import("@/apps/life/proverbs").then((m) => ({ default: m.ProverbsApp })),
);
const SleepApp = lazy(() => import("@/apps/life/sleep").then((m) => ({ default: m.SleepApp })));
const CaloriesApp = lazy(() =>
  import("@/apps/life/calories").then((m) => ({ default: m.CaloriesApp })),
);
const BreatheApp = lazy(() =>
  import("@/apps/life/breathe").then((m) => ({ default: m.BreatheApp })),
);
const PregnancyApp = lazy(() =>
  import("@/apps/life/pregnancy").then((m) => ({ default: m.PregnancyApp })),
);
const ChatApp = lazy(() => import("@/apps/studio/chat").then((m) => ({ default: m.ChatApp })));
const SnakeApp = lazy(() => import("@/apps/games/snake").then((m) => ({ default: m.SnakeApp })));
const Merge2048App = lazy(() =>
  import("@/apps/games/merge2048").then((m) => ({ default: m.Merge2048App })),
);
const MemoryApp = lazy(() => import("@/apps/games/memory").then((m) => ({ default: m.MemoryApp })));
const SudokuApp = lazy(() => import("@/apps/games/sudoku").then((m) => ({ default: m.SudokuApp })));
const KalimaApp = lazy(() => import("@/apps/games/kalima").then((m) => ({ default: m.KalimaApp })));
const AbiarApp = lazy(() => import("@/apps/games/abiar").then((m) => ({ default: m.AbiarApp })));
const MajraApp = lazy(() => import("@/apps/games/majra").then((m) => ({ default: m.MajraApp })));
const KutlApp = lazy(() => import("@/apps/games/kutl").then((m) => ({ default: m.KutlApp })));
const XoApp = lazy(() => import("@/apps/games/xo").then((m) => ({ default: m.XoApp })));
const ReactionApp = lazy(() =>
  import("@/apps/games/reaction").then((m) => ({ default: m.ReactionApp })),
);
const TypeApp = lazy(() => import("@/apps/games/type").then((m) => ({ default: m.TypeApp })));
const BreakoutApp = lazy(() =>
  import("@/apps/games/breakout").then((m) => ({ default: m.BreakoutApp })),
);
const TriviaApp = lazy(() => import("@/apps/games/trivia").then((m) => ({ default: m.TriviaApp })));
const MinesApp = lazy(() => import("@/apps/games/mines").then((m) => ({ default: m.MinesApp })));
const TetrisApp = lazy(() => import("@/apps/games/tetris").then((m) => ({ default: m.TetrisApp })));
const Connect4App = lazy(() =>
  import("@/apps/games/connect4").then((m) => ({ default: m.Connect4App })),
);
const BalootApp = lazy(() => import("@/apps/games/baloot").then((m) => ({ default: m.BalootApp })));
const CalcApp = lazy(() => import("@/apps/tools/calc").then((m) => ({ default: m.CalcApp })));
const UnitsApp = lazy(() => import("@/apps/tools/units").then((m) => ({ default: m.UnitsApp })));
const CurrencyApp = lazy(() =>
  import("@/apps/tools/currency").then((m) => ({ default: m.CurrencyApp })),
);
const PasswordApp = lazy(() =>
  import("@/apps/tools/password").then((m) => ({ default: m.PasswordApp })),
);
const QrApp = lazy(() => import("@/apps/tools/qr").then((m) => ({ default: m.QrApp })));
const ColorsApp = lazy(() => import("@/apps/tools/colors").then((m) => ({ default: m.ColorsApp })));
const TextlabApp = lazy(() =>
  import("@/apps/tools/textlab").then((m) => ({ default: m.TextlabApp })),
);
const JsonApp = lazy(() => import("@/apps/tools/json").then((m) => ({ default: m.JsonApp })));
const EncodeApp = lazy(() => import("@/apps/tools/encode").then((m) => ({ default: m.EncodeApp })));
const DatesApp = lazy(() => import("@/apps/tools/dates").then((m) => ({ default: m.DatesApp })));
const BmiApp = lazy(() => import("@/apps/tools/bmi").then((m) => ({ default: m.BmiApp })));
const InvoiceApp = lazy(() =>
  import("@/apps/tools/invoice").then((m) => ({ default: m.InvoiceApp })),
);
const TafqeetApp = lazy(() =>
  import("@/apps/tools/tafqeet").then((m) => ({ default: m.TafqeetApp })),
);
const WheelApp = lazy(() => import("@/apps/tools/wheel").then((m) => ({ default: m.WheelApp })));
const NotesApp = lazy(() =>
  import("@/apps/workspace/notes").then((m) => ({ default: m.NotesApp })),
);
const TasksApp = lazy(() =>
  import("@/apps/workspace/tasks").then((m) => ({ default: m.TasksApp })),
);
const HabitsApp = lazy(() =>
  import("@/apps/workspace/habits").then((m) => ({ default: m.HabitsApp })),
);
const FocusApp = lazy(() =>
  import("@/apps/workspace/focus").then((m) => ({ default: m.FocusApp })),
);
const MarkdownApp = lazy(() =>
  import("@/apps/workspace/markdown").then((m) => ({ default: m.MarkdownApp })),
);
const MeetingsApp = lazy(() =>
  import("@/apps/workspace/meetings").then((m) => ({ default: m.MeetingsApp })),
);
const LetterApp = lazy(() =>
  import("@/apps/workspace/letter").then((m) => ({ default: m.LetterApp })),
);
const TimesheetApp = lazy(() =>
  import("@/apps/workspace/timesheet").then((m) => ({ default: m.TimesheetApp })),
);
const LeaveApp = lazy(() =>
  import("@/apps/workspace/leave").then((m) => ({ default: m.LeaveApp })),
);
const ClientsApp = lazy(() =>
  import("@/apps/workspace/clients").then((m) => ({ default: m.ClientsApp })),
);
const PipelineApp = lazy(() =>
  import("@/apps/workspace/pipeline").then((m) => ({ default: m.PipelineApp })),
);
const QuoteApp = lazy(() =>
  import("@/apps/workspace/quote").then((m) => ({ default: m.QuoteApp })),
);
const ZatcaApp = lazy(() =>
  import("@/apps/workspace/zatca").then((m) => ({ default: m.ZatcaApp })),
);
const LicensesApp = lazy(() =>
  import("@/apps/workspace/licenses").then((m) => ({ default: m.LicensesApp })),
);
const PortalsApp = lazy(() =>
  import("@/apps/workspace/portals").then((m) => ({ default: m.PortalsApp })),
);
const BudgetApp = lazy(() => import("@/apps/money/budget").then((m) => ({ default: m.BudgetApp })));
const SavingsApp = lazy(() =>
  import("@/apps/money/savings").then((m) => ({ default: m.SavingsApp })),
);
const InstallmentApp = lazy(() =>
  import("@/apps/money/installment").then((m) => ({ default: m.InstallmentApp })),
);
const SplitApp = lazy(() => import("@/apps/money/split").then((m) => ({ default: m.SplitApp })));
const GoldApp = lazy(() => import("@/apps/money/gold").then((m) => ({ default: m.GoldApp })));
const SalaryApp = lazy(() => import("@/apps/money/salary").then((m) => ({ default: m.SalaryApp })));
const FaraidApp = lazy(() => import("@/apps/money/faraid").then((m) => ({ default: m.FaraidApp })));
const VatApp = lazy(() => import("@/apps/money/vat").then((m) => ({ default: m.VatApp })));
const EidiyaApp = lazy(() => import("@/apps/money/eidiya").then((m) => ({ default: m.EidiyaApp })));
const IbanApp = lazy(() => import("@/apps/money/iban").then((m) => ({ default: m.IbanApp })));
const ExpensesApp = lazy(() =>
  import("@/apps/money/expenses").then((m) => ({ default: m.ExpensesApp })),
);
const MarginApp = lazy(() => import("@/apps/money/margin").then((m) => ({ default: m.MarginApp })));
const PayrollApp = lazy(() =>
  import("@/apps/money/payroll").then((m) => ({ default: m.PayrollApp })),
);
const CashbookApp = lazy(() =>
  import("@/apps/money/cashbook").then((m) => ({ default: m.CashbookApp })),
);

export const APPS: Record<string, ComponentType> = {
  salah: SalahApp,
  salahlog: SalahlogApp,
  weather: WeatherApp,
  hijri: HijriApp,
  qibla: QiblaApp,
  zakat: ZakatApp,
  tasbih: TasbihApp,
  clocks: ClocksApp,
  fuel: FuelApp,
  water: WaterApp,
  shopping: ShoppingApp,
  countdown: CountdownApp,
  emergency: EmergencyApp,
  sites: SitesApp,
  services: ServicesApp,
  papers: PapersApp,
  bills: BillsApp,
  athkar: AthkarApp,
  khatma: KhatmaApp,
  meds: MedsApp,
  car: CarApp,
  fasting: FastingApp,
  family: FamilyApp,
  asma: AsmaApp,
  dua: DuaApp,
  umrah: UmrahApp,
  holidays: HolidaysApp,
  nazari: NazariApp,
  names: NamesApp,
  greet: GreetApp,
  letters: LettersApp,
  tables: TablesApp,
  proverbs: ProverbsApp,
  sleep: SleepApp,
  calories: CaloriesApp,
  breathe: BreatheApp,
  pregnancy: PregnancyApp,
  budget: BudgetApp,
  savings: SavingsApp,
  installment: InstallmentApp,
  split: SplitApp,
  gold: GoldApp,
  salary: SalaryApp,
  faraid: FaraidApp,
  vat: VatApp,
  eidiya: EidiyaApp,
  iban: IbanApp,
  expenses: ExpensesApp,
  margin: MarginApp,
  payroll: PayrollApp,
  cashbook: CashbookApp,
  currency: CurrencyApp,
  chat: ChatApp,
  snake: SnakeApp,
  merge2048: Merge2048App,
  tetris: TetrisApp,
  connect4: Connect4App,
  baloot: BalootApp,
  memory: MemoryApp,
  sudoku: SudokuApp,
  kalima: KalimaApp,
  abiar: AbiarApp,
  majra: MajraApp,
  kutl: KutlApp,
  xo: XoApp,
  reaction: ReactionApp,
  type: TypeApp,
  breakout: BreakoutApp,
  trivia: TriviaApp,
  mines: MinesApp,
  search: lazy(() => import("@/apps/tools/search").then((m) => ({ default: m.SearchApp }))),
  browser: lazy(() => import("@/apps/tools/browser").then((m) => ({ default: m.BrowserApp }))),
  calc: CalcApp,
  units: UnitsApp,
  password: PasswordApp,
  qr: QrApp,
  colors: ColorsApp,
  textlab: TextlabApp,
  json: JsonApp,
  encode: EncodeApp,
  dates: DatesApp,
  bmi: BmiApp,
  invoice: InvoiceApp,
  tafqeet: TafqeetApp,
  wheel: WheelApp,
  notes: NotesApp,
  tasks: TasksApp,
  habits: HabitsApp,
  focus: FocusApp,
  markdown: MarkdownApp,
  meetings: MeetingsApp,
  letter: LetterApp,
  timesheet: TimesheetApp,
  leave: LeaveApp,
  clients: ClientsApp,
  pipeline: PipelineApp,
  quote: QuoteApp,
  zatca: ZatcaApp,
  licenses: LicensesApp,
  portals: PortalsApp,
};
