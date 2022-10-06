import { BonfireManager } from "./BonfireManager";
import {
  ActivityClass,
  ActivitySummary,
  ActivitySummarySection,
  ActivityTypeClass,
} from "./helper/ActivitySummary";
import i18nData from "./i18n/i18nData.json";
import { BonfireSettings } from "./options/BonfireSettings";
import { EngineSettings } from "./options/EngineSettings";
import { ReligionSettings } from "./options/ReligionSettings";
import { ScienceSettings } from "./options/ScienceSettings";
import { SpaceSettings } from "./options/SpaceSettings";
import { TimeControlSettings } from "./options/TimeControlSettings";
import { TimeSettings } from "./options/TimeSettings";
import { TradeSettings } from "./options/TradeSettings";
import { VillageSettings } from "./options/VillageSettings";
import { WorkshopSettings } from "./options/WorkshopSettings";
import { ReligionManager } from "./ReligionManager";
import { ScienceManager } from "./ScienceManager";
import { SpaceManager } from "./SpaceManager";
import { TimeControlManager } from "./TimeControlManager";
import { TimeManager } from "./TimeManager";
import { cdebug, clog, cwarn } from "./tools/Log";
import { mustExist } from "./tools/Maybe";
import { TradeManager } from "./TradeManager";
import { DefaultLanguage, UserScript } from "./UserScript";
import { VillageManager } from "./VillageManager";
import { WorkshopManager } from "./WorkshopManager";

export type TickContext = {
  tick: number;
};
export type Automation = {
  tick(context: TickContext): void | Promise<void>;
};
export type SupportedLanguages = keyof typeof i18nData;

export class Engine {
  /**
   * All i18n literals of the userscript.
   */
  private readonly _i18nData: typeof i18nData;

  readonly _host: UserScript;
  readonly settings: EngineSettings;
  readonly bonfireManager: BonfireManager;
  readonly religionManager: ReligionManager;
  readonly scienceManager: ScienceManager;
  readonly spaceManager: SpaceManager;
  readonly timeControlManager: TimeControlManager;
  readonly timeManager: TimeManager;
  readonly tradingManager: TradeManager;
  readonly villageManager: VillageManager;
  readonly workshopManager: WorkshopManager;

  private _activitySummary: ActivitySummary;
  private _intervalMainLoop: number | undefined = undefined;

  constructor(host: UserScript) {
    this._i18nData = i18nData;

    this._host = host;
    this._activitySummary = new ActivitySummary(this._host);

    this.settings = new EngineSettings();

    this.workshopManager = new WorkshopManager(this._host);

    this.bonfireManager = new BonfireManager(this._host, this.workshopManager);
    this.religionManager = new ReligionManager(
      this._host,
      this.bonfireManager,
      this.workshopManager
    );
    this.scienceManager = new ScienceManager(this._host, this.workshopManager);
    this.spaceManager = new SpaceManager(this._host, this.workshopManager);
    this.timeControlManager = new TimeControlManager(
      this._host,
      this.bonfireManager,
      this.religionManager,
      this.spaceManager
    );
    this.timeManager = new TimeManager(this._host, this.workshopManager);
    this.tradingManager = new TradeManager(this._host, this.workshopManager);
    this.villageManager = new VillageManager(this._host, this.workshopManager);
  }

  isLanguageSupported(language: string): boolean {
    return language in this._i18nData;
  }

  load(settings: {
    engine: EngineSettings;
    bonfire: BonfireSettings;
    religion: ReligionSettings;
    science: ScienceSettings;
    space: SpaceSettings;
    time: TimeSettings;
    timeControl: TimeControlSettings;
    trading: TradeSettings;
    village: VillageSettings;
    workshop: WorkshopSettings;
  }) {
    this.settings.load(settings.engine);
    this.bonfireManager.load(settings.bonfire);
    this.religionManager.load(settings.religion);
    this.scienceManager.load(settings.science);
    this.spaceManager.load(settings.space);
    this.timeControlManager.load(settings.timeControl);
    this.timeManager.load(settings.time);
    this.tradingManager.load(settings.trading);
    this.villageManager.load(settings.village);
    this.workshopManager.load(settings.workshop);
  }

  /**
   * Start the Kitten Scientists engine.
   *
   * @param msg Should we print to the log that the engine was started?
   */
  start(msg = true): void {
    if (this._intervalMainLoop) {
      return;
    }

    const loop = () => {
      const entry = Date.now();
      this._iterate()
        .then(() => {
          const exit = Date.now();
          const timeTaken = exit - entry;
          this._intervalMainLoop = setTimeout(
            loop,
            Math.max(10, this._host.engine.settings.interval - timeTaken)
          );
        })
        .catch(error => {
          this._host.engine.warning(error as string);
        });
    };
    this._intervalMainLoop = setTimeout(loop, this._host.engine.settings.interval);

    if (msg) {
      this._host.engine.imessage("status.ks.enable");
    }
  }

  /**
   * Stop the Kitten Scientists engine.
   *
   * @param msg Should we print to the log that the engine was stopped?
   */
  stop(msg = true): void {
    if (!this._intervalMainLoop) {
      return;
    }

    clearTimeout(this._intervalMainLoop);
    this._intervalMainLoop = undefined;

    if (msg) {
      this._host.engine.imessage("status.ks.disable");
    }
  }

  /**
   * The main loop of the automation script.
   */
  private async _iterate(): Promise<void> {
    const context = { tick: new Date().getTime() };

    const subOptions = this._host.engine.settings.options;

    // The order in which these actions are performed is probably
    // semi-intentional and should be preserved or improved.

    // Observe astronomical events.
    if (subOptions.enabled && subOptions.items.observe.enabled) {
      this.observeStars();
    }
    await this.scienceManager.tick(context);
    this.bonfireManager.tick(context);
    this.spaceManager.tick(context);
    await this.workshopManager.tick(context);
    this.tradingManager.tick(context);
    this.religionManager.tick(context);
    this.timeManager.tick(context);
    // Blackcoin trading.
    if (subOptions.enabled && subOptions.items.crypto.enabled) {
      this.crypto();
    }
    // Feed leviathans.
    if (subOptions.enabled && subOptions.items.autofeed.enabled) {
      this.autofeed();
    }

    this.villageManager.tick(context);

    // Time automations (Tempus Fugit & Shatter TC)
    await this.timeControlManager.tick(context);

    // Miscelaneous automations.
    if (subOptions.enabled) {
      // Fix used cryochambers
      // If the option is enabled and we have used cryochambers...
      if (
        subOptions.items.fixCry.enabled &&
        0 < this._host.gamePage.time.getVSU("usedCryochambers").val
      ) {
        let fixed = 0;
        const btn = this.timeManager.manager.tab.vsPanel.children[0].children[0]; //check?
        // doFixCryochamber will check resources
        while (btn.controller.doFixCryochamber(btn.model)) {
          ++fixed;
        }
        if (0 < fixed) {
          this._host.engine.iactivity("act.fix.cry", [fixed], "ks-fixCry");
          this._host.engine.storeForSummary("fix.cry", fixed);
        }
      }
    }
  }

  /**
   * Feed leviathans.
   */
  autofeed(): void {
    this.tradingManager.autoFeedElders();
  }

  private waitForBestPrice = false;

  /**
   * Blackcoin trading automation.
   */
  crypto(): void {
    const coinPrice = this._host.gamePage.calendar.cryptoPrice;
    const relicsInitial = this._host.gamePage.resPool.get("relic").value;
    const coinsInitial = this._host.gamePage.resPool.get("blackcoin").value;
    let coinsExchanged = 0.0;
    let relicsExchanged = 0.0;

    // Waits for coin price to drop below a certain treshold before starting the exchange process
    if (this.waitForBestPrice === true && coinPrice < 860.0) {
      this.waitForBestPrice = false;
    }

    // All of this code is straight-forward. Buy low, sell high.

    // Exchanges up to a certain threshold, in order to keep a good exchange rate, then waits for a higher treshold before exchanging for relics.
    if (
      this.waitForBestPrice === false &&
      coinPrice < 950.0 &&
      (this._host.engine.settings.options.items.crypto.trigger ?? 0) < relicsInitial
    ) {
      // function name changed in v1.4.8.0
      if (typeof this._host.gamePage.diplomacy.buyEcoin === "function") {
        this._host.gamePage.diplomacy.buyEcoin();
      } else {
        this._host.gamePage.diplomacy.buyBcoin();
      }

      const currentCoin = this._host.gamePage.resPool.get("blackcoin").value;
      coinsExchanged = Math.round(currentCoin - coinsInitial);
      this._host.engine.iactivity("blackcoin.buy", [coinsExchanged]);
    } else if (coinPrice > 1050.0 && 0 < this._host.gamePage.resPool.get("blackcoin").value) {
      this.waitForBestPrice = true;

      // function name changed in v1.4.8.0
      if (typeof this._host.gamePage.diplomacy.sellEcoin === "function") {
        this._host.gamePage.diplomacy.sellEcoin();
      } else {
        this._host.gamePage.diplomacy.sellBcoin();
      }

      const relicsCurrent = mustExist(this._host.gamePage.resPool.get("relic")).value;
      relicsExchanged = Math.round(relicsCurrent - relicsInitial);

      this._host.engine.iactivity("blackcoin.sell", [relicsExchanged]);
    }
  }

  /**
   * If there is currently an astronomical event, observe it.
   */
  observeStars(): void {
    if (this._host.gamePage.calendar.observeBtn !== null) {
      this._host.gamePage.calendar.observeHandler();
      this._host.engine.iactivity("act.observe", [], "ks-star");
      this._host.engine.storeForSummary("stars", 1);
    }
  }

  /**
   * Retrieve an internationalized string literal.
   *
   * @param key The key to retrieve from the translation table.
   * @param args Variable arguments to render into the string.
   * @returns The translated string.
   */
  i18n<TKittenGameLiteral extends `$${string}`>(
    key: keyof typeof i18nData[SupportedLanguages] | TKittenGameLiteral,
    args: Array<number | string> = []
  ): string {
    // Key is to be translated through KG engine.
    if (key.startsWith("$")) {
      return this._host.i18nEngine(key.slice(1));
    }

    let value =
      this._i18nData[this._host.language][key as keyof typeof i18nData[SupportedLanguages]];
    if (typeof value === "undefined" || value === null) {
      value = i18nData[DefaultLanguage][key as keyof typeof i18nData[SupportedLanguages]];
      if (!value) {
        cwarn(`i18n key '${key}' not found in default language.`);
        return `$${key}`;
      }
      cwarn(`i18n key '${key}' not found in selected language.`);
    }
    if (args) {
      for (let argIndex = 0; argIndex < args.length; ++argIndex) {
        value = value.replace(`{${argIndex}}`, `${args[argIndex]}`);
      }
    }
    return value;
  }

  private _printOutput(
    cssClasses: "ks-activity" | `ks-activity ${ActivityTypeClass}` | "ks-default" | "ks-summary",
    color: string,
    ...args: Array<number | string>
  ): void {
    if (this.settings.filters.enabled) {
      for (const filterItem of Object.values(this.settings.filters.items)) {
        if (filterItem.enabled && filterItem.variant === cssClasses) {
          return;
        }
      }
    }

    // update the color of the message immediately after adding
    const msg = this._host.gamePage.msg(...args, cssClasses);
    $(msg.span).css("color", color);

    cdebug(args);
  }

  private _message(...args: Array<number | string>): void {
    this._printOutput("ks-default", "#aa50fe", ...args);
  }

  private _activity(text: string, logStyle?: ActivityClass): void {
    if (logStyle) {
      const activityClass: ActivityTypeClass = `type_${logStyle}` as const;
      this._printOutput(`ks-activity ${activityClass}` as const, "#e65C00", text);
    } else {
      this._printOutput("ks-activity", "#e65C00", text);
    }
  }

  private _summary(...args: Array<number | string>): void {
    this._printOutput("ks-summary", "#009933", ...args);
  }

  warning(...args: Array<number | string>): void {
    args.unshift("Warning!");
    if (console) {
      clog(args);
    }
  }

  imessage(
    i18nLiteral: keyof typeof i18nData[SupportedLanguages],
    i18nArgs: Array<number | string> = []
  ): void {
    this._message(this.i18n(i18nLiteral, i18nArgs));
  }
  iactivity(
    i18nLiteral: keyof typeof i18nData[SupportedLanguages],
    i18nArgs: Array<number | string> = [],
    logStyle?: ActivityClass
  ): void {
    this._activity(this.i18n(i18nLiteral, i18nArgs), logStyle);
  }
  private _isummary(
    i18nLiteral: keyof typeof i18nData[SupportedLanguages],
    i18nArgs: Array<number | string>
  ): void {
    this._summary(this.i18n(i18nLiteral, i18nArgs));
  }
  private _iwarning(
    i18nLiteral: keyof typeof i18nData[SupportedLanguages],
    i18nArgs: Array<number | string>
  ): void {
    this.warning(this.i18n(i18nLiteral, i18nArgs));
  }

  resetActivitySummary(): void {
    this._activitySummary.resetActivity();
  }

  storeForSummary(name: string, amount = 1, section: ActivitySummarySection = "other"): void {
    this._activitySummary.storeActivity(name, amount, section);
  }

  displayActivitySummary(): void {
    const summary = this._activitySummary.renderSummary();
    for (const summaryLine of summary) {
      this._summary(summaryLine);
    }

    // Clear out the old activity
    this.resetActivitySummary();
  }
}
