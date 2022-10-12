import { objectEntries } from "../tools/Entries";
import { Race } from "../types";
import { EmbassySettings } from "./EmbassySettings";
import { Requirement, Setting, SettingLimited, SettingTrigger } from "./Settings";
import { LegacyStorage } from "./SettingsStorage";

export class TradeSettingsItem extends SettingLimited {
  readonly race: Race;

  summer: boolean;
  autumn: boolean;
  winter: boolean;
  spring: boolean;

  /**
   * A resource that is required to trade with the race.
   */
  require: Requirement;

  constructor(
    race: Race,
    enabled: boolean,
    limited: boolean,
    summer: boolean,
    autumn: boolean,
    winter: boolean,
    spring: boolean,
    require: Requirement = false
  ) {
    super(enabled, limited);
    this.race = race;
    this.summer = summer;
    this.autumn = autumn;
    this.winter = winter;
    this.spring = spring;
    this.require = require;
  }
}

export type TradeSettingsItems = {
  [item in Race]: TradeSettingsItem;
};

export class TradeSettings extends SettingTrigger {
  items: TradeSettingsItems;

  buildEmbassies: EmbassySettings;
  unlockRaces: Setting;

  constructor(
    enabled = false,
    trigger = 1,
    items = {
      dragons: new TradeSettingsItem("dragons", true, true, true, true, true, true, "titanium"),
      griffins: new TradeSettingsItem("griffins", true, true, false, true, false, false, "wood"),
      leviathans: new TradeSettingsItem(
        "leviathans",
        true,
        true,
        true,
        true,
        true,
        true,
        "unobtainium"
      ),
      lizards: new TradeSettingsItem("lizards", true, true, true, false, false, false, "minerals"),
      nagas: new TradeSettingsItem("nagas", true, true, true, false, false, true),
      sharks: new TradeSettingsItem("sharks", true, true, false, false, true, false, "iron"),
      spiders: new TradeSettingsItem("spiders", true, true, true, true, false, true),
      zebras: new TradeSettingsItem("zebras", true, true, true, true, true, true),
    },
    buildEmbassies = new EmbassySettings(),
    unlockRaces = new Setting(true)
  ) {
    super(enabled, trigger);
    this.items = items;
    this.buildEmbassies = buildEmbassies;
    this.unlockRaces = unlockRaces;
  }

  load(settings: TradeSettings) {
    this.enabled = settings.enabled;
    this.trigger = settings.trigger;

    for (const [name, item] of objectEntries(settings.items)) {
      this.items[name].enabled = item.enabled;
      this.items[name].limited = item.limited;
      this.items[name].autumn = item.autumn;
      this.items[name].spring = item.spring;
      this.items[name].summer = item.summer;
      this.items[name].winter = item.winter;
    }

    this.buildEmbassies.load(settings.buildEmbassies);

    this.unlockRaces.enabled = settings.unlockRaces.enabled;
  }

  static toLegacyOptions(settings: TradeSettings, subject: LegacyStorage) {
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

    EmbassySettings.toLegacyOptions(settings.buildEmbassies, subject);

    subject.items["toggle-races"] = settings.unlockRaces.enabled;
  }

  static fromLegacyOptions(subject: LegacyStorage) {
    const options = new TradeSettings();
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

    options.buildEmbassies = EmbassySettings.fromLegacyOptions(subject);

    options.unlockRaces.enabled = subject.items["toggle-races"] ?? options.unlockRaces.enabled;

    return options;
  }
}
