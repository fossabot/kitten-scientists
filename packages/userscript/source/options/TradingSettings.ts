import { objectEntries } from "../tools/Entries";
import { Race } from "../types";
import { Requirement } from "./Options";
import { Setting, SettingLimited, SettingTrigger } from "./Settings";
import { SettingsSectionTrigger } from "./SettingsSection";
import { KittenStorageType } from "./SettingsStorage";

export class TradingSettingsItem extends SettingLimited {
  summer: boolean;
  $summer?: JQuery<HTMLElement>;

  autumn: boolean;
  $autumn?: JQuery<HTMLElement>;

  winter: boolean;
  $winter?: JQuery<HTMLElement>;

  spring: boolean;
  $spring?: JQuery<HTMLElement>;

  /**
   * A resource that is required to trade with the race.
   */
  require: Requirement;

  constructor(
    enabled: boolean,
    limited: boolean,
    summer: boolean,
    autumn: boolean,
    winter: boolean,
    spring: boolean,
    require: Requirement = false
  ) {
    super(enabled, limited);

    this.summer = summer;
    this.autumn = autumn;
    this.winter = winter;
    this.spring = spring;
    this.require = require;
  }
}

export type TradeAdditionSettings = {
  buildEmbassies: SettingTrigger;
  unlockRaces: Setting;
};

export type TradingSettingsItems = {
  [item in Race]: TradingSettingsItem;
};

export class TradingSettings extends SettingsSectionTrigger {
  addition: TradeAdditionSettings = {
    buildEmbassies: new SettingTrigger(true, 0),
    unlockRaces: new Setting(true),
  };

  items: TradingSettingsItems = {
    dragons: new TradingSettingsItem(true, true, true, true, true, true, "titanium"),
    zebras: new TradingSettingsItem(true, true, true, true, true, true),
    lizards: new TradingSettingsItem(true, true, true, false, false, false, "minerals"),
    sharks: new TradingSettingsItem(true, true, false, false, true, false, "iron"),
    griffins: new TradingSettingsItem(true, true, false, true, false, false, "wood"),
    nagas: new TradingSettingsItem(true, true, true, false, false, true),
    spiders: new TradingSettingsItem(true, true, true, true, false, true),
    leviathans: new TradingSettingsItem(true, true, true, true, true, true, "unobtainium"),
  };

  constructor(
    enabled = false,
    trigger = 1,
    items = {
      dragons: new TradingSettingsItem(true, true, true, true, true, true, "titanium"),
      zebras: new TradingSettingsItem(true, true, true, true, true, true),
      lizards: new TradingSettingsItem(true, true, true, false, false, false, "minerals"),
      sharks: new TradingSettingsItem(true, true, false, false, true, false, "iron"),
      griffins: new TradingSettingsItem(true, true, false, true, false, false, "wood"),
      nagas: new TradingSettingsItem(true, true, true, false, false, true),
      spiders: new TradingSettingsItem(true, true, true, true, false, true),
      leviathans: new TradingSettingsItem(true, true, true, true, true, true, "unobtainium"),
    },
    buildEmbassies = new SettingTrigger(true, 0),

    unlockRaces = new Setting(true)
  ) {
    super(enabled, trigger);
    this.items = items;
    this.addition.buildEmbassies = buildEmbassies;

    this.addition.unlockRaces = unlockRaces;
  }

  static toLegacyOptions(settings: TradingSettings, subject: KittenStorageType) {
    subject.toggles.trade = settings.enabled;
    subject.triggers.trade = settings.trigger;

    for (const [name, item] of objectEntries(settings.items)) {
      subject.items[`toggle-${name}` as const] = item.enabled;
      subject.items[`toggle-limited-${name}` as const] = item.limited;
      subject.items[`toggle-${name}-autumn` as const] = item.autumn;
      subject.items[`toggle-${name}-spring` as const] = item.spring;
      subject.items[`toggle-${name}-summer` as const] = item.summer;
      subject.items[`toggle-${name}-winter` as const] = item.winter;
    }

    subject.items["toggle-buildEmbassies"] = settings.addition.buildEmbassies.enabled;
    subject.items["toggle-races"] = settings.addition.unlockRaces.enabled;
  }

  static fromLegacyOptions(subject: KittenStorageType) {
    const options = new TradingSettings();
    options.enabled = subject.toggles.trade;
    options.trigger = subject.triggers.trade;

    for (const [name, item] of objectEntries(options.items)) {
      item.enabled = subject.items[`toggle-${name}` as const] ?? item.enabled;
      item.limited = subject.items[`toggle-limited-${name}` as const] ?? item.limited;
      item.autumn = subject.items[`toggle-${name}-autumn` as const] ?? item.autumn;
      item.spring = subject.items[`toggle-${name}-spring` as const] ?? item.spring;
      item.summer = subject.items[`toggle-${name}-summer` as const] ?? item.summer;
      item.winter = subject.items[`toggle-${name}-winter` as const] ?? item.winter;
    }

    options.addition.buildEmbassies.enabled =
      subject.items["toggle-buildEmbassies"] ?? options.addition.buildEmbassies.enabled;
    options.addition.unlockRaces.enabled =
      subject.items["toggle-races"] ?? options.addition.unlockRaces.enabled;

    return options;
  }
}
