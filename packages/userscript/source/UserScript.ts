import JQuery from "jquery";
import i18nData from "./i18n/i18nData.json";
import { Options } from "./Options";
import { isNil, Maybe, mustExist } from "./tools/Maybe";
import { sleep } from "./tools/Sleep";

declare global {
  const unsafeWindow: Window;
  interface Window {
    gamePage?: Maybe<GamePage>;
    $: JQuery;
    $I?: Maybe<I18nEngine>;
  }
}

export interface GamePage {
  console: {
    maxMessages: number;
  };
  msg: (...args: Array<string>) => { span: HTMLElement };
}
export type I18nEngine = (key: string) => string;

export type SupportedLanguages = keyof typeof i18nData;
export const DefaultLanguage: SupportedLanguages = "en";

export class UserScript {
  private readonly _gamePage: GamePage;
  private readonly _i18nEngine: I18nEngine;
  private _language: SupportedLanguages;

  private readonly _i18nData: typeof i18nData;
  private _options: Options;

  constructor(
    gamePage: GamePage,
    i18nEngine: I18nEngine,
    language: SupportedLanguages = DefaultLanguage
  ) {
    console.info("Kitten Scientists constructed.");

    this._gamePage = gamePage;
    this._i18nEngine = i18nEngine;
    this._language = language;

    this._i18nData = i18nData;
  }

  async run(): Promise<void> {
    if (this._language in this._i18nData === false) {
      console.warn(
        `Requested language '${this._language}' is not available. Falling back to '${DefaultLanguage}'.`
      );
      this._language = DefaultLanguage;
    }

    // Increase messages displayed in log
    this._gamePage.console.maxMessages = 1000;
  }

  /**
   * Retrieve an internationalized string literal.
   * @param key The key to retrieve from the translation table.
   * @param args Variable arguments to render into the string.
   * @returns The translated string.
   */
  private _i18n(
    key: keyof typeof i18nData[SupportedLanguages],
    args: Array<number | string>
  ): string {
    if (key.startsWith("$")) {
      return this._i18nEngine(key.slice(1));
    }
    let value = this._i18nData[this._language][key];
    if (typeof value === "undefined") {
      value = i18nData[DefaultLanguage][key];
      if (!value) {
        console.warn(`i18n key '${key}' not found in default language.`);
        return "$" + key;
      }
      console.warn(`i18n key '${key}' not found in selected language.`);
    }
    if (args) {
      for (let argIndex = 0; argIndex < args.length; ++argIndex) {
        value = value.replace(`{${argIndex}}`, `${args[argIndex]}`);
      }
    }
    return value;
  }

  private _printOutput(...args: Array<string>): void {
    if (this._options.auto.filter.enabled) {
      for (var filt in this._options.auto.filter.items) {
        var filter = this._options.auto.filter.items[filt];
        if (filter.enabled && filter.variant === args[1]) {
          return;
        }
      }
    }
    var color = args.pop();
    args[1] = args[1] || "ks-default";

    // update the color of the message immediately after adding
    var msg = this._gamePage.msg.apply(this._gamePage, args);
    $(msg.span).css("color", color);

    if (this._options.debug && console) console.log(args);
  }

  static async waitForGame(timeout: number = 30000): Promise<void> {
    console.debug(`Waiting for game... (timeout: ${Math.round(timeout / 1000)}s)`);

    if (timeout < 0) {
      throw new Error("Unable to find game page.");
    }

    if (UserScript._isGameLoaded()) {
      return;
    }

    await sleep(2000);
    return UserScript.waitForGame(timeout - 2000);
  }

  static async getDefaultInstance(): Promise<UserScript> {
    return new UserScript(
      mustExist(unsafeWindow.gamePage),
      mustExist(unsafeWindow.$I),
      localStorage["com.nuclearunicorn.kittengame.language"]
    );
  }

  private static _isGameLoaded(): boolean {
    return !isNil(unsafeWindow.gamePage);
  }
}
