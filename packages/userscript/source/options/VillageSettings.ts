import { objectEntries } from "../tools/Entries";
import { Job } from "../types";
import { Setting, SettingMax, SettingTrigger } from "./Settings";
import { LegacyStorage } from "./SettingsStorage";

export type VillageSettingsItems = {
  [item in Job]: SettingMax;
};

export class VillageSettings extends Setting {
  items: VillageSettingsItems;

  holdFestivals: Setting;
  hunt: SettingTrigger;
  promoteLeader: Setting;

  constructor(
    enabled = false,
    items: VillageSettingsItems = {
      engineer: new SettingMax(true, 1),
      farmer: new SettingMax(true, 1),
      geologist: new SettingMax(true, 1),
      hunter: new SettingMax(true, 1),
      miner: new SettingMax(true, 1),
      priest: new SettingMax(true, 1),
      scholar: new SettingMax(true, 1),
      woodcutter: new SettingMax(true, 1),
    },
    holdFestivals = new Setting(true),
    hunt = new SettingTrigger(true, 0.98),
    promoteLeader = new Setting(true)
  ) {
    super(enabled);
    this.items = items;
    this.holdFestivals = holdFestivals;
    this.hunt = hunt;
    this.promoteLeader = promoteLeader;
  }

  load(settings: VillageSettings) {
    this.enabled = settings.enabled;

    for (const [name, item] of objectEntries(settings.items)) {
      this.items[name].enabled = item.enabled;
      this.items[name].max = item.max;
    }

    this.holdFestivals.enabled = settings.holdFestivals.enabled;
    this.hunt.enabled = settings.hunt.enabled;
    this.promoteLeader.enabled = settings.promoteLeader.enabled;
  }

  static toLegacyOptions(settings: VillageSettings, subject: LegacyStorage) {
    subject.toggles.distribute = settings.enabled;

    for (const [name, item] of objectEntries(settings.items)) {
      subject.items[`toggle-${name}` as const] = item.enabled;
      subject.items[`set-${name}-max` as const] = item.max;
    }

    subject.items["toggle-festival"] = settings.holdFestivals.enabled;
    subject.items["toggle-hunt"] = settings.hunt.enabled;
    subject.items["toggle-promote"] = settings.promoteLeader.enabled;
  }

  static fromLegacyOptions(subject: LegacyStorage) {
    const options = new VillageSettings();
    options.enabled = subject.toggles.distribute;

    for (const [name, item] of objectEntries(options.items)) {
      item.enabled = subject.items[`toggle-${name}` as const] ?? item.enabled;
      item.max = subject.items[`set-${name}-max` as const] ?? item.max;
    }

    options.holdFestivals.enabled =
      subject.items["toggle-festival"] ?? options.holdFestivals.enabled;
    options.hunt.enabled = subject.items["toggle-hunt"] ?? options.hunt.enabled;
    options.promoteLeader.enabled =
      subject.items["toggle-promote"] ?? options.promoteLeader.enabled;

    return options;
  }
}
