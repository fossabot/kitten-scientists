import { cwarn } from "../tools/Log";
import { GamePage, Technology } from "../types";
import { difference, SettingsSection, SettingToggle } from "./SettingsSection";

export type TechSettingsItem = SettingToggle;
export class TechSettings extends SettingsSection {
  items: {
    [item in Technology]: TechSettingsItem;
  } = {
    acoustics: { enabled: true },
    advExogeology: { enabled: true },
    agriculture: { enabled: true },
    ai: { enabled: true },
    animal: { enabled: true },
    antimatter: { enabled: true },
    archeology: { enabled: true },
    archery: { enabled: true },
    architecture: { enabled: true },
    artificialGravity: { enabled: true },
    astronomy: { enabled: true },
    biochemistry: { enabled: true },
    biology: { enabled: true },
    blackchain: { enabled: true },
    brewery: { enabled: true },
    calendar: { enabled: true },
    chemistry: { enabled: true },
    chronophysics: { enabled: true },
    civil: { enabled: true },
    combustion: { enabled: true },
    construction: { enabled: true },
    cryptotheology: { enabled: true },
    currency: { enabled: true },
    dimensionalPhysics: { enabled: true },
    drama: { enabled: true },
    ecology: { enabled: true },
    electricity: { enabled: true },
    electronics: { enabled: true },
    engineering: { enabled: true },
    exogeology: { enabled: true },
    exogeophysics: { enabled: true },
    genetics: { enabled: true },
    hydroponics: { enabled: true },
    industrialization: { enabled: true },
    machinery: { enabled: true },
    math: { enabled: true },
    mechanization: { enabled: true },
    metal: { enabled: true },
    metalurgy: { enabled: true },
    metaphysics: { enabled: true },
    mining: { enabled: true },
    nanotechnology: { enabled: true },
    navigation: { enabled: true },
    nuclearFission: { enabled: true },
    oilProcessing: { enabled: true },
    orbitalEngineering: { enabled: true },
    paradoxalKnowledge: { enabled: true },
    particlePhysics: { enabled: true },
    philosophy: { enabled: true },
    physics: { enabled: true },
    quantumCryptography: { enabled: true },
    robotics: { enabled: true },
    rocketry: { enabled: true },
    sattelites: { enabled: true },
    steel: { enabled: true },
    superconductors: { enabled: true },
    tachyonTheory: { enabled: true },
    terraformation: { enabled: true },
    theology: { enabled: true },
    thorium: { enabled: true },
    voidSpace: { enabled: true },
    writing: { enabled: true },
  };

  static validateGame(game: GamePage, settings: TechSettings) {
    const inSettings = Object.keys(settings.items);
    const inGame = game.science.techs.map(tech => tech.name);

    const missingInSettings = difference(inGame, inSettings);
    const redundantInSettings = difference(inSettings, inGame);

    for (const tech of missingInSettings) {
      cwarn(`The technology '${tech}' is not tracked in Kitten Scientists!`);
    }
    for (const tech of redundantInSettings) {
      cwarn(`The technology '${tech}' is not a technology in Kitten Game!`);
    }
  }
}
