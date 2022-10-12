import { objectEntries } from "../tools/Entries";
import { isNil, mustExist } from "../tools/Maybe";
import { Resource } from "../types";
import { WorkshopManager } from "../WorkshopManager";
import { Setting } from "./Settings";
import { LegacyStorage } from "./SettingsStorage";

export class ResourcesSettingsItem extends Setting {
  readonly resource: Resource;
  consume?: number;
  stock = 0;

  constructor(id: Resource, enabled: boolean, consume: number | undefined, stock: number) {
    super(enabled);
    this.resource = id;
    this.consume = consume;
    this.stock = stock;
  }
}

export type ResourcesSettingsItems = { [item in Resource]: ResourcesSettingsItem };

export class ResourcesSettings extends Setting {
  items: ResourcesSettingsItems;

  constructor(
    items = {
      alloy: new ResourcesSettingsItem("alloy", false, 1, 0),
      antimatter: new ResourcesSettingsItem("antimatter", false, 1, 0),
      beam: new ResourcesSettingsItem("beam", false, 1, 0),
      blackcoin: new ResourcesSettingsItem("blackcoin", false, 1, 0),
      bloodstone: new ResourcesSettingsItem("bloodstone", false, 1, 0),
      blueprint: new ResourcesSettingsItem("blueprint", false, 1, 0),
      catnip: new ResourcesSettingsItem("catnip", false, 1, 0),
      coal: new ResourcesSettingsItem("coal", false, 1, 0),
      compedium: new ResourcesSettingsItem("compedium", false, 1, 0),
      concrate: new ResourcesSettingsItem("concrate", false, 1, 0),
      culture: new ResourcesSettingsItem("culture", false, 1, 0),
      eludium: new ResourcesSettingsItem("eludium", false, 1, 0),
      faith: new ResourcesSettingsItem("faith", false, 1, 0),
      furs: new ResourcesSettingsItem("furs", true, undefined, 1000),
      gear: new ResourcesSettingsItem("gear", false, 1, 0),
      gold: new ResourcesSettingsItem("gold", false, 1, 0),
      iron: new ResourcesSettingsItem("iron", false, 1, 0),
      ivory: new ResourcesSettingsItem("ivory", false, 1, 0),
      karma: new ResourcesSettingsItem("karma", false, 1, 0),
      kerosene: new ResourcesSettingsItem("kerosene", false, 1, 0),
      manpower: new ResourcesSettingsItem("manpower", false, 1, 0),
      manuscript: new ResourcesSettingsItem("manuscript", false, 1, 0),
      megalith: new ResourcesSettingsItem("megalith", false, 1, 0),
      minerals: new ResourcesSettingsItem("minerals", false, 1, 0),
      necrocorn: new ResourcesSettingsItem("necrocorn", false, 1, 0),
      oil: new ResourcesSettingsItem("oil", false, 1, 0),
      paragon: new ResourcesSettingsItem("paragon", false, 1, 0),
      parchment: new ResourcesSettingsItem("parchment", false, 1, 0),
      plate: new ResourcesSettingsItem("plate", false, 1, 0),
      relic: new ResourcesSettingsItem("relic", false, 1, 0),
      scaffold: new ResourcesSettingsItem("scaffold", false, 1, 0),
      science: new ResourcesSettingsItem("science", false, 1, 0),
      ship: new ResourcesSettingsItem("ship", false, 1, 0),
      slab: new ResourcesSettingsItem("slab", false, 1, 0),
      spice: new ResourcesSettingsItem("spice", false, 1, 0),
      steel: new ResourcesSettingsItem("steel", false, 1, 0),
      tanker: new ResourcesSettingsItem("tanker", false, 1, 0),
      tears: new ResourcesSettingsItem("tears", false, 1, 0),
      temporalFlux: new ResourcesSettingsItem("temporalFlux", false, 1, 0),
      thorium: new ResourcesSettingsItem("thorium", false, 1, 0),
      timeCrystal: new ResourcesSettingsItem("timeCrystal", false, 1, 0),
      titanium: new ResourcesSettingsItem("titanium", false, 1, 0),
      unicorns: new ResourcesSettingsItem("unicorns", false, 1, 0),
      unobtainium: new ResourcesSettingsItem("unobtainium", false, 1, 0),
      uranium: new ResourcesSettingsItem("uranium", false, 1, 0),
      void: new ResourcesSettingsItem("void", false, 1, 0),
      wood: new ResourcesSettingsItem("wood", false, 1, 0),
      zebras: new ResourcesSettingsItem("zebras", false, 1, 0),
    }
  ) {
    super(true);
    this.items = items;
  }

  load(settings: ResourcesSettings) {
    this.enabled = settings.enabled;

    for (const [name, item] of objectEntries(settings.items)) {
      this.items[name].enabled = item.enabled;
      this.items[name].consume = item.consume;
      this.items[name].stock = item.stock;
    }
  }

  static toLegacyOptions(settings: ResourcesSettings, subject: LegacyStorage) {
    for (const [name, item] of objectEntries(settings.items)) {
      if (isNil(subject.resources[name])) {
        subject.resources[name] = {
          checkForReset: false,
          stockForReset: 0,
          consume: item.consume,
          enabled: item.enabled,
          stock: item.stock,
        };
        continue;
      }

      mustExist(subject.resources[name]).consume = item.consume;
      mustExist(subject.resources[name]).enabled = item.enabled;
      mustExist(subject.resources[name]).stock = item.stock;
    }
  }

  static fromLegacyOptions(subject: LegacyStorage) {
    const options = new ResourcesSettings();
    options.enabled = true;

    for (const [name, item] of objectEntries(subject.resources)) {
      if (item.checkForReset) {
        continue;
      }

      // We didn't explicitly store the `enabled` state in legacy.
      // Instead, it is derived from the setting having non-default values.
      options.items[name].enabled =
        item.consume !== WorkshopManager.DEFAULT_CONSUME_RATE || item.stock !== 0;
      options.items[name].consume = item.consume;
      options.items[name].stock = item.stock;
    }

    return options;
  }
}
