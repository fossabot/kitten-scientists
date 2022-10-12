import { ResetBonfireSettings } from "./ResetBonfireSettings";
import { ResetReligionSettings } from "./ResetReligionSettings";
import { ResetResourcesSettings } from "./ResetResourcesSettings";
import { ResetSpaceSettings } from "./ResetSpaceSettings";
import { ResetTimeSettings } from "./ResetTimeSettings";
import { Setting } from "./Settings";
import { KittenStorageType } from "./SettingsStorage";

export class ResetSettings extends Setting {
  bonfire: ResetBonfireSettings;
  religion: ResetReligionSettings;
  resources: ResetResourcesSettings;
  space: ResetSpaceSettings;
  time: ResetTimeSettings;

  constructor(
    enabled = false,
    bonfire = new ResetBonfireSettings(),
    religion = new ResetReligionSettings(),
    resources = new ResetResourcesSettings(),
    space = new ResetSpaceSettings(),
    time = new ResetTimeSettings()
  ) {
    super(enabled);
    this.bonfire = bonfire;
    this.religion = religion;
    this.resources = resources;
    this.space = space;
    this.time = time;
  }

  load(settings: ResetSettings) {
    this.enabled = settings.enabled;

    this.bonfire.load(settings.bonfire);
    this.religion.load(settings.religion);
    this.resources.load(settings.resources);
    this.space.load(settings.space);
    this.time.load(settings.time);
  }

  static toLegacyOptions(settings: ResetSettings, subject: KittenStorageType) {
    subject.items["toggle-reset"] = settings.enabled;

    ResetBonfireSettings.toLegacyOptions(settings.bonfire, subject);
    ResetReligionSettings.toLegacyOptions(settings.religion, subject);
    ResetResourcesSettings.toLegacyOptions(settings.resources, subject);
    ResetSpaceSettings.toLegacyOptions(settings.space, subject);
    ResetTimeSettings.toLegacyOptions(settings.time, subject);
  }

  static fromLegacyOptions(subject: KittenStorageType) {
    const options = new ResetSettings();
    options.enabled = subject.items["toggle-reset"] ?? options.enabled;

    options.bonfire = ResetBonfireSettings.fromLegacyOptions(subject);
    options.religion = ResetReligionSettings.fromLegacyOptions(subject);
    options.resources = ResetResourcesSettings.fromLegacyOptions(subject);
    options.space = ResetSpaceSettings.fromLegacyOptions(subject);
    options.time = ResetTimeSettings.fromLegacyOptions(subject);

    return options;
  }
}
