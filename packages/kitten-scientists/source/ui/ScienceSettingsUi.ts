import { ScienceSettings } from "../settings/ScienceSettings.js";
import { UserScript } from "../UserScript.js";
import { SettingListItem } from "./components/SettingListItem.js";
import { SettingsList } from "./components/SettingsList.js";
import { PolicySettingsUi } from "./PolicySettingsUi.js";
import { SettingsSectionUi } from "./SettingsSectionUi.js";
import { TechSettingsUi } from "./TechSettingsUi.js";

export class ScienceSettingsUi extends SettingsSectionUi<ScienceSettings> {
  private readonly _items: Array<SettingListItem>;
  private readonly _policiesUi: PolicySettingsUi;
  private readonly _techsUi: TechSettingsUi;
  protected readonly _observeStars: SettingListItem;

  constructor(host: UserScript, settings: ScienceSettings) {
    super(host, host.engine.i18n("ui.upgrade"), settings);

    this._policiesUi = new PolicySettingsUi(this._host, this.setting.policies);
    this._techsUi = new TechSettingsUi(this._host, this.setting.techs);

    this._observeStars = new SettingListItem(
      this._host,
      this._host.engine.i18n("option.observe"),
      this.setting.observe,
      {
        onCheck: () =>
          this._host.engine.imessage("status.sub.enable", [
            this._host.engine.i18n("option.observe"),
          ]),
        onUnCheck: () =>
          this._host.engine.imessage("status.sub.disable", [
            this._host.engine.i18n("option.observe"),
          ]),
      },
    );

    this._items = [this._policiesUi, this._techsUi, this._observeStars];

    const itemsList = new SettingsList(this._host, {
      hasDisableAll: false,
      hasEnableAll: false,
    });
    itemsList.addChildren([this._techsUi, this._policiesUi, this._observeStars]);
    this.addChild(itemsList);
  }
}
