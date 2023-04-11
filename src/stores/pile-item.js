import { get, writable } from "svelte/store";
import * as Utilities from "../helpers/utilities.js";
import { TJSDocument } from '@typhonjs-fvtt/runtime/svelte/store';
import * as PileUtilities from "../helpers/pile-utilities.js";
import * as SharingUtilities from "../helpers/sharing-utilities.js";
import CONSTANTS from "../constants/constants.js";
import * as Helpers from "../helpers/helpers.js";
import { Plugins } from "../plugins/main.js";

class PileBaseItem {

  constructor(store, data, isCurrency = false) {
    this.store = store;
    this.subscriptions = [];
    this.isCurrency = isCurrency;
    this.setup(data);
  }

  setupStores() {
    this.category = writable({ service: false, type: "", label: "" });
    this.quantity = writable(1);
    this.currentQuantity = writable(1);
    this.quantityLeft = writable(1);
    this.filtered = writable(true);
    this.presentFromTheStart = writable(false);
    this.rarityColor = writable(false);
  }

  setupSubscriptions() {
    // Higher order implementation
  }

  setup(data) {
    this.unsubscribe();
    this.setupStores(data);
    this.setupSubscriptions(data);
  }

  subscribeTo(target, callback) {
    this.subscriptions.push(target.subscribe(callback));
  }

  unsubscribe() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
  }

  preview() {
  }
}

export class PileItem extends PileBaseItem {

  setupStores(item) {
    super.setupStores();
    this.item = item;
    this.itemDocument = new TJSDocument(this.item);
    this.canStack = PileUtilities.canItemStack(this.item, this.actor);
    this.presentFromTheStart.set(Utilities.getItemQuantity(this.item) > 0 || !this.canStack);
    this.quantity.set(this.canStack ? Utilities.getItemQuantity(this.item) : 1);
    this.currentQuantity.set(Math.min(get(this.currentQuantity), get(this.quantityLeft), get(this.quantity)));
    this.id = this.item.id;
    this.type = this.item.type;
    this.name = writable(this.item.name);
    this.img = writable(this.item.img);
    this.abbreviation = writable("");
    this.identifier = this.id;
    this.itemFlagData = writable(PileUtilities.getItemFlagData(this.item));
  }

  setupSubscriptions() {
    super.setupSubscriptions()

    this.subscribeTo(this.store.pileData, this.setupProperties.bind(this));

    this.subscribeTo(this.store.shareData, () => {
      if (!this.toShare) {
        this.quantityLeft.set(get(this.quantity));
        return;
      }
      const quantityLeft = SharingUtilities.getItemSharesLeftForActor(this.store.actor, this.item, this.store.recipient);
      this.quantityLeft.set(quantityLeft);
    });

    this.subscribeTo(this.itemDocument, () => {
      const { data } = this.itemDocument.updateOptions;
      this.name.set(this.item.name);
      this.img.set(this.item.img);
      this.similarities = Utilities.setSimilarityProperties({}, this.item);
      if (PileUtilities.canItemStack(this.item, this.store.actor) && Utilities.hasItemQuantity(data)) {
        this.quantity.set(Utilities.getItemQuantity(data));
        const quantity = Math.min(get(this.currentQuantity), get(this.quantityLeft), get(this.quantity));
        this.currentQuantity.set(quantity);
      }
      if (hasProperty(data, CONSTANTS.FLAGS.ITEM)) {
        this.itemFlagData.set(PileUtilities.getItemFlagData(this.item));
        this.updateCategory();
        this.store.refreshItems();
      }
      if (Plugins["rarity-colors"].data) {
        this.rarityColor.set(Plugins["rarity-colors"].data.getItemColor(this.item));
      }
    });

    this.updateCategory();

    this.subscribeTo(this.quantity, this.filter.bind(this));
    this.subscribeTo(this.store.search, this.filter.bind(this));
    this.subscribeTo(this.category, this.filter.bind(this));
  }

  setupProperties() {
    const actorIsMerchant = PileUtilities.isItemPileMerchant(this.store.actor, get(this.store.pileData));
    const pileActor = actorIsMerchant ? this.store.actor : this.store.recipient;
    const pileActorData = actorIsMerchant ? this.store.pileData : this.store.recipientPileData;
    const pileCurrencies = get(this.store.pileCurrencies);
    this.isCurrency = PileUtilities.isItemCurrency(this.item, { target: pileActor, actorCurrencies: pileCurrencies });
    const currency = this.isCurrency ? PileUtilities.getItemCurrencyData(this.item, {
      target: pileActor,
      actorCurrencies: pileCurrencies
    }) : {};
    this.abbreviation.set(currency?.abbreviation ?? "");
    this.similarities = Utilities.setSimilarityProperties({}, this.item);
    this.toShare = this.isCurrency
      ? get(pileActorData).shareCurrenciesEnabled && !!this.store.recipient
      : get(pileActorData).shareItemsEnabled && !!this.store.recipient;
  }

  updateCategory() {
    const pileData = get(this.store.pileData);
    const itemFlagData = get(this.itemFlagData);
    this.category.update(cat => {
      cat.service = itemFlagData?.isService;
      if (itemFlagData.customCategory) {
        cat.type = itemFlagData.customCategory.toLowerCase();
        cat.label = itemFlagData.customCategory;
      } else if (cat.service && pileData.enabled && pileData.type === CONSTANTS.PILE_TYPES.MERCHANT) {
        cat.type = "item-piles-service";
        cat.label = "ITEM-PILES.Merchant.Service";
      } else {
        cat.type = this.type;
        cat.label = CONFIG.Item.typeLabels[this.type];
      }
      return cat;
    });
  }

  filter() {
    const name = get(this.name).trim();
    const search = get(this.store.search).trim();
    const presentFromTheStart = get(this.presentFromTheStart);
    const quantity = get(this.quantity);
    if (quantity === 0 && !presentFromTheStart) {
      this.filtered.set(true);
    } else if (search) {
      this.filtered.set(!name.toLowerCase().includes(search.toLowerCase()));
    } else {
      this.filtered.set(!presentFromTheStart && quantity === 0);
    }
  }

  take() {
    const quantity = Math.min(get(this.currentQuantity), get(this.quantityLeft));
    if (!quantity) return;
    return game.itempiles.API.transferItems(
      this.store.actor,
      this.store.recipient,
      [{ _id: this.id, quantity }],
      { interactionId: this.store.interactionId }
    );
  }

  async remove() {
    return game.itempiles.API.removeItems(this.store.actor, [this.id]);
  }

  updateQuantity(quantity, add = false) {
    let total = typeof quantity === "string" ? (new Roll(quantity).evaluate({ async: false })).total : quantity;
    if (add) {
      total += get(this.quantity);
    }
    this.quantity.set(total);
    return this.item.update(Utilities.setItemQuantity({}, total));
  }

  async updateFlags() {
    await this.item.update({
      [CONSTANTS.FLAGS.ITEM]: get(this.itemFlagData),
      [CONSTANTS.FLAGS.VERSION]: Helpers.getModuleVersion()
    })
  }

  preview() {
    const pileData = get(this.store.pileData);
    if (!pileData.canInspectItems && !game.user.isGM) return;
    if (game.user.isGM || this.item.permission[game.user.id] === 3) {
      return this.item.sheet.render(true);
    }
    const cls = this.item._getSheetClass();
    const sheet = new cls(this.item, { editable: false });
    return sheet._render(true);
  }
}

export class PileAttribute extends PileBaseItem {

  setupStores(attribute) {
    super.setupStores();
    this.attribute = attribute;
    this.path = this.attribute.path;
    this.name = writable(this.attribute.name);
    this.img = writable(this.attribute.img);
    this.abbreviation = writable(this.attribute.abbreviation);
    this.identifier = this.attribute.path;
    const startingQuantity = Number(getProperty(this.store.actor, this.path) ?? 0);
    this.presentFromTheStart.set(startingQuantity > 0);
    this.quantity.set(startingQuantity);
    this.currentQuantity.set(Math.min(get(this.currentQuantity), get(this.quantityLeft), get(this.quantity)));
    this.category.set({ type: "currency", label: "ITEM-PILES.Currency" });
  }

  setupSubscriptions() {
    super.setupSubscriptions();

    this.subscribeTo(this.store.pileData, this.setupProperties.bind(this));

    this.subscribeTo(this.store.shareData, (val) => {
      if (!this.toShare) {
        this.quantityLeft.set(get(this.quantity));
        return;
      }
      const quantityLeft = SharingUtilities.getAttributeSharesLeftForActor(this.store.actor, this.path, this.store.recipient);
      this.quantityLeft.set(quantityLeft);
    });

    this.subscribeTo(this.store.document, () => {
      const { data } = this.store.document.updateOptions;
      this.path = this.attribute.path;
      this.name.set(this.attribute.name);
      this.img.set(this.attribute.img);
      if (hasProperty(data, this.path)) {
        this.quantity.set(Number(getProperty(data, this.path) ?? 0));
        this.currentQuantity.set(Math.min(get(this.currentQuantity), get(this.quantityLeft), get(this.quantity)));
        this.store.refreshItems();
      }
    });

    this.subscribeTo(this.quantity, this.filter.bind(this));
    this.subscribeTo(this.store.search, this.filter.bind(this));
  }

  setupProperties() {
    this.toShare = get(this.store.pileData).shareCurrenciesEnabled && !!this.store.recipient;
  }

  filter() {
    const name = get(this.name);
    const search = get(this.store.search);
    const presentFromTheStart = get(this.presentFromTheStart);
    const quantity = get(this.quantity);
    if (quantity === 0 && !presentFromTheStart) {
      this.filtered.set(true);
    } else if (search) {
      this.filtered.set(!name.toLowerCase().includes(search.toLowerCase()));
    } else {
      this.filtered.set(!presentFromTheStart && quantity === 0);
    }
  }

  take() {
    const quantity = Math.min(get(this.currentQuantity), get(this.quantityLeft));
    return game.itempiles.API.transferAttributes(
      this.store.actor,
      this.store.recipient,
      { [this.path]: quantity },
      { interactionId: this.store.interactionId }
    );
  }

  updateQuantity() {
    return this.store.actor.update({
      [this.path]: get(this.quantity)
    });
  }

}
