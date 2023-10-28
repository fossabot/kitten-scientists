import { Icons } from "../../../images/Icons.js";
import { UserScript } from "../../../UserScript.js";
import { IconButton } from "../IconButton.js";

/**
 * A button that is intended to enable something when clicked.
 */
export class EnableButton extends IconButton {
  /**
   * Constructs a `EnableButton`.
   *
   * @param host A reference to the host.
   */
  constructor(host: UserScript) {
    super(host, Icons.CheckboxCheck, host.engine.i18n("ui.enable.all"));
  }
}
