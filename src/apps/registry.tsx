import type { ComponentType } from "react";
import { SalahApp } from "@/apps/life/salah";
import { WeatherApp } from "@/apps/life/weather";
import { HijriApp } from "@/apps/life/hijri";
import { QiblaApp } from "@/apps/life/qibla";
import { ZakatApp } from "@/apps/life/zakat";
import { TasbihApp } from "@/apps/life/tasbih";
import { ClocksApp } from "@/apps/life/clocks";
import { FuelApp } from "@/apps/life/fuel";
import { SalahlogApp } from "@/apps/life/salahlog";
import { WaterApp } from "@/apps/life/water";
import { ShoppingApp } from "@/apps/life/shopping";
import { CountdownApp } from "@/apps/life/countdown";
import { EmergencyApp } from "@/apps/life/emergency";
import { ServicesApp } from "@/apps/life/services";
import { PapersApp } from "@/apps/life/papers";
import { BillsApp } from "@/apps/life/bills";
import { AthkarApp } from "@/apps/life/athkar";
import { KhatmaApp } from "@/apps/life/khatma";
import { MedsApp } from "@/apps/life/meds";
import { CarApp } from "@/apps/life/car";
import { FastingApp } from "@/apps/life/fasting";
import { FamilyApp } from "@/apps/life/family";
import { AsmaApp } from "@/apps/life/asma";
import { DuaApp } from "@/apps/life/dua";
import { UmrahApp } from "@/apps/life/umrah";
import { HolidaysApp } from "@/apps/life/holidays";
import { NazariApp } from "@/apps/life/nazari";
import { NamesApp } from "@/apps/life/names";
import { GreetApp } from "@/apps/life/greet";
import { LettersApp } from "@/apps/life/letters";
import { TablesApp } from "@/apps/life/tables";
import { ProverbsApp } from "@/apps/life/proverbs";
import { SleepApp } from "@/apps/life/sleep";
import { CaloriesApp } from "@/apps/life/calories";
import { BreatheApp } from "@/apps/life/breathe";
import { PregnancyApp } from "@/apps/life/pregnancy";
import { ChatApp } from "@/apps/studio/chat";
import { SnakeApp } from "@/apps/games/snake";
import { Merge2048App } from "@/apps/games/merge2048";
import { MemoryApp } from "@/apps/games/memory";
import { SudokuApp } from "@/apps/games/sudoku";
import { KalimaApp } from "@/apps/games/kalima";
import { XoApp } from "@/apps/games/xo";
import { ReactionApp } from "@/apps/games/reaction";
import { TypeApp } from "@/apps/games/type";
import { BreakoutApp } from "@/apps/games/breakout";
import { TriviaApp } from "@/apps/games/trivia";
import { MinesApp } from "@/apps/games/mines";
import { TetrisApp } from "@/apps/games/tetris";
import { Connect4App } from "@/apps/games/connect4";
import { BalootApp } from "@/apps/games/baloot";
import { CalcApp } from "@/apps/tools/calc";
import { UnitsApp } from "@/apps/tools/units";
import { CurrencyApp } from "@/apps/tools/currency";
import { PasswordApp } from "@/apps/tools/password";
import { QrApp } from "@/apps/tools/qr";
import { ColorsApp } from "@/apps/tools/colors";
import { TextlabApp } from "@/apps/tools/textlab";
import { JsonApp } from "@/apps/tools/json";
import { EncodeApp } from "@/apps/tools/encode";
import { DatesApp } from "@/apps/tools/dates";
import { BmiApp } from "@/apps/tools/bmi";
import { InvoiceApp } from "@/apps/tools/invoice";
import { TafqeetApp } from "@/apps/tools/tafqeet";
import { WheelApp } from "@/apps/tools/wheel";
import { NotesApp } from "@/apps/workspace/notes";
import { TasksApp } from "@/apps/workspace/tasks";
import { HabitsApp } from "@/apps/workspace/habits";
import { FocusApp } from "@/apps/workspace/focus";
import { MarkdownApp } from "@/apps/workspace/markdown";
import { MeetingsApp } from "@/apps/workspace/meetings";
import { LetterApp } from "@/apps/workspace/letter";
import { TimesheetApp } from "@/apps/workspace/timesheet";
import { LeaveApp } from "@/apps/workspace/leave";
import { ClientsApp } from "@/apps/workspace/clients";
import { PipelineApp } from "@/apps/workspace/pipeline";
import { QuoteApp } from "@/apps/workspace/quote";
import { ZatcaApp } from "@/apps/workspace/zatca";
import { LicensesApp } from "@/apps/workspace/licenses";
import { PortalsApp } from "@/apps/workspace/portals";
import { BudgetApp } from "@/apps/money/budget";
import { SavingsApp } from "@/apps/money/savings";
import { InstallmentApp } from "@/apps/money/installment";
import { SplitApp } from "@/apps/money/split";
import { GoldApp } from "@/apps/money/gold";
import { SalaryApp } from "@/apps/money/salary";
import { FaraidApp } from "@/apps/money/faraid";
import { VatApp } from "@/apps/money/vat";
import { EidiyaApp } from "@/apps/money/eidiya";
import { IbanApp } from "@/apps/money/iban";
import { ExpensesApp } from "@/apps/money/expenses";
import { MarginApp } from "@/apps/money/margin";
import { PayrollApp } from "@/apps/money/payroll";
import { CashbookApp } from "@/apps/money/cashbook";

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
  xo: XoApp,
  reaction: ReactionApp,
  type: TypeApp,
  breakout: BreakoutApp,
  trivia: TriviaApp,
  mines: MinesApp,
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
