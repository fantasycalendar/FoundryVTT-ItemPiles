import CurrenciesEditor from "./currencies-editor/currencies-editor.js";
import ItemFiltersEditor from "./item-filters-editor/item-filters-editor.js";
import ItemSimilaritiesEditor from "./item-similarities-editor/item-similarities-editor.js";
import PriceModifiersEditor from "./price-modifiers-editor/price-modifiers-editor.js";
import PricePresetEditor from "./price-preset-editor/price-preset-editor.js";
import VaultStylesEditor from "./vault-styles-editor/vault-styles-editor.js";
import StylesEditor from "./styles-editor/styles-editor.js";

export default {
  "currencies": CurrenciesEditor,
  "item-filters": ItemFiltersEditor,
  "item-similarities": ItemSimilaritiesEditor,
  "styles": StylesEditor,
  "vault-styles": VaultStylesEditor,
  "price-modifiers": PriceModifiersEditor,
  "price-presets": PricePresetEditor
}
