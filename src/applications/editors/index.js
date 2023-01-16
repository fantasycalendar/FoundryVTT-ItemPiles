import CurrenciesEditor from "./currencies-editor/currencies-editor.js";
import ItemFiltersEditor from "./item-filters-editor/item-filters-editor.js";
import ItemSimilaritiesEditor from "./item-similarities-editor/item-similarities-editor.js";
import PriceModifiersEditor from "./price-modifiers-editor/price-modifiers-editor.js";
import PricePresetEditor from "./price-preset-editor/price-preset-editor.js";
import UnstackableItemTypesEditor from "./unstackable-item-types-editor/unstackable-item-types-editor.js";

export default {
  "currencies": CurrenciesEditor,
  "item-filters": ItemFiltersEditor,
  "item-similarities": ItemSimilaritiesEditor,
  "price-modifiers": PriceModifiersEditor,
  "unstackable-item-types": UnstackableItemTypesEditor,
  "price-presets": PricePresetEditor
}
