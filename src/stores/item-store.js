import { get, writable } from "svelte/store";
import { TJSDocument } from '@typhonjs-fvtt/runtime/svelte/store';
import CONSTANTS from "../constants/constants.js";
import * as Utilities from "../helpers/utilities.js";
import * as PileUtilities from "../helpers/pile-utilities.js";
import * as SharingUtilities from "../helpers/sharing-utilities.js";
import * as Helpers from "../helpers/helpers.js";
import { getAttributeSharesLeftForActor } from "../helpers/sharing-utilities.js";

const __STORES__ = {
    _data: new Map(),
    add(store) {
        const id = store.uuid + "-" + store.interactionId
        this._data.set(id, store);
    },
    remove(store) {
        const id = store.uuid + "-" + store.interactionId
        this._data.delete(id);
    },
    get(uuid) {
        return Array.from(this._data)
            .filter(entry => entry[0].startsWith(uuid))
            .map(entry => entry[1]);
    }
};

export default class ItemPileStore {

    constructor(source, recipient = false) {

        this.interactionId = randomID();
        this.uuid = Utilities.getUuid(source);
        this.source = Utilities.getActor(source);
        this.recipientUuid = recipient ? Utilities.getUuid(recipient) : false;
        this.recipient = recipient ? Utilities.getActor(recipient) : false;

        __STORES__.add(this);

        this.pileData = writable(PileUtilities.getActorFlagData(this.source));
        this.shareData = writable(SharingUtilities.getItemPileSharingData(this.source))
        this.deleted = writable(false);

        this.search = writable("");
        this.editQuantities = !recipient;

        this.allItems = writable([]);
        this.attributes = writable([]);

        this.items = writable([]);
        this.currencies = writable([]);

        this.numItems = writable(0);
        this.numCurrencies = writable(0);

        this.document = new TJSDocument(this.source);

        const items = PileUtilities.getActorItems(this.source).map(item => {
            return new PileItem(this, item);
        });
        this.allItems.set(items);

        const attributes = PileUtilities.getActorCurrencyAttributes(this.source).map(attribute => {
            return new PileAttribute(this, attribute);
        });
        this.attributes.set(attributes);

        this.allItems.subscribe((val) => {
            if(!val) return;
            this.refreshItems.bind(this)
        });
        this.attributes.subscribe((val) => {
            if(!val) return;
            this.refreshItems.bind(this)
        });

        const filterDebounce = foundry.utils.debounce(() => {
            this.refreshItems();
        }, 300);
        this.search.subscribe((val) => {
            if(!val) return;
            filterDebounce()
        })

        this.document.subscribe(() => {
            const { data } = this.document.updateOptions;
            if (hasProperty(data, CONSTANTS.FLAGS.PILE)) {
                this.pileData.set(PileUtilities.getActorFlagData(this.source));
            }
            if (hasProperty(data, CONSTANTS.FLAGS.SHARING)) {
                this.shareData.set(SharingUtilities.getItemPileSharingData(this.source));
            }
            this.refreshItems();
        });

    }

    static notifyChanges(event, actor, ...args) {
        const uuid = Utilities.getUuid(actor);
        for (const store of __STORES__.get(uuid)) {
            store[event](...args);
        }
    }

    refreshItems() {
        const allItems = get(this.allItems);

        const items = allItems.filter(entry => !entry.isCurrency);
        const itemCurrencies = allItems.filter(entry => entry.isCurrency);

        this.numItems.set(items.filter(entry => get(entry.data.quantity) > 0).length);
        this.items.set(items.filter(entry => get(entry.data.visible)));

        const attributes = get(this.attributes).filter(currency => get(currency.data.visible));
        const currencies = attributes.concat(itemCurrencies);

        this.numCurrencies.set(currencies.filter(entry => get(entry.data.quantity) > 0).length);
        this.currencies.set(currencies.filter(entry => get(entry.data.visible)));
    }

    createItem(item) {
        const items = get(this.allItems);
        const similarItem = Utilities.findSimilarItem(items.map(item => ({
            pileItem: item,
            ...item.similarities
        })), item);
        if (similarItem) {
            similarItem.pileItem.setup(item);
        } else {
            items.push(new PileItem(this, item));
        }
        this.allItems.set(items);
        this.refreshItems();
    }

    deleteItem(item) {
        const items = get(this.allItems);
        const pileItem = items.find(pileItem => pileItem.id === item.id);
        if(this.editQuantities) {
            items.splice(items.indexOf(pileItem), 1);
            this.allItems.set(items);
        }else{
            pileItem.id = null;
            pileItem.data.quantity.set(0);
            pileItem.data.quantityLeft.set(0);
        }
        pileItem.unsubscribe();
        this.refreshItems();
    }

    delete(){
        this.deleted.set(true);
    }

    async update() {

        const itemsToUpdate = [];
        const itemsToDelete = [];
        const attributesToUpdate = {};

        const items = get(this.allItems).filter(item => item.id);
        for (let item of items) {
            const itemQuantity = get(item.data.quantity);
            if (itemQuantity === 0) {
                itemsToDelete.push(item.id);
            } else {
                itemsToUpdate.push({
                    _id: item.id,
                    [game.itempiles.ITEM_QUANTITY_ATTRIBUTE]: itemQuantity
                })
            }
        }

        const attributes = get(this.attributes);
        for (let attribute of attributes) {
            attributesToUpdate[attribute.path] = get(attribute.data.quantity);
        }

        const pileSharingData = SharingUtilities.getItemPileSharingData(this.source);

        await this.source.update(attributesToUpdate);
        if (pileSharingData?.currencies) {
            pileSharingData.currencies = pileSharingData.currencies.map(currency => {
                if (attributesToUpdate[currency.path] !== undefined) {
                    currency.actors = currency.actors.map(actor => {
                        actor.quantity = Math.max(0, Math.min(actor.quantity, attributesToUpdate[currency.path]));
                        return actor;
                    })
                }
                return currency;
            })
        }

        await this.source.updateEmbeddedDocuments("Item", itemsToUpdate);
        await this.source.deleteEmbeddedDocuments("Item", itemsToDelete);
        if (pileSharingData?.items) {
            pileSharingData.items = pileSharingData.items.map(item => {
                const sharingItem = itemsToUpdate.find(item => item._id === item.id);
                if (sharingItem) {
                    item.actors = item.actors.map(actor => {
                        actor.quantity = Math.max(0, Math.min(actor.quantity, sharingItem.quantity));
                        return actor;
                    })
                }
                return item;
            })
        }

        await SharingUtilities.updateItemPileSharingData(this.source, pileSharingData);

        Helpers.custom_notify("Item Pile successfully updated.");

        this.refreshItems();

    }

    takeAll() {
        game.itempiles.transferEverything(
            this.source,
            this.recipient,
            { interactionId: this.interactionId }
        );
    }

    splitAll() {
        return game.itempiles.splitItemPileContents(this.source, { instigator: this.recipient });
    }

    closeContainer() {
        // TODO: close friggin container
    }

    onDestroy(){
        __STORES__.remove(this);
    }
}

class PileBaseItem {

    constructor(store) {
        this.store = store;
        this.subscriptions = [];
        this.data = writable({});
        this.data.quantity = writable(0);
        this.data.currentQuantity = writable(1);
        this.data.quantityLeft = writable(0);
        this.data.visible = writable(false);
        this.data.wasVisibleFromTheStart = writable(false);
    }

    setup() {
        this.unsubscribe();
    }

    subscribeTo(target, callback) {
        this.subscriptions.push(target.subscribe(callback));
    }

    unsubscribe() {
        this.subscriptions.forEach(unsubscribe => unsubscribe());
        this.subscriptions = [];
    }
}

class PileItem extends PileBaseItem {

    constructor(store, item) {
        super(store);
        this.data.wasVisibleFromTheStart = writable(Utilities.getItemQuantity(item) > 0);
        this.setup(item);
    }

    take(){
        const quantity = Math.min(get(this.data.currentQuantity), get(this.data.quantityLeft));
        return game.itempiles.transferItems(
            this.store.source,
            this.store.recipient,
            [{ _id: this.id, quantity }],
            { interactionId: this.store.interactionId }
        );
    }

    setup(item) {
        super.setup();

        this.item = item;

        this.data.quantity.set(Utilities.getItemQuantity(this.item));

        this.setupProperties();
        this.refreshShareData();

        this.data.currentQuantity.set(Math.min(get(this.data.currentQuantity), get(this.data.quantityLeft), get(this.data.quantity)));

        this.subscribeTo(this.data.quantity, this.filter.bind(this));
        this.subscribeTo(this.store.search, this.filter.bind(this));

        this.subscribeTo(this.store.pileData, this.setupProperties.bind(this));

        this.itemDocument = new TJSDocument(this.item);
        this.subscribeTo(this.itemDocument, () => {
            const { data } = this.itemDocument.updateOptions;
            this.id = this.item.id;
            this.name = this.item.name;
            this.img = this.item.img;
            this.type = this.item.type;
            this.identifier = this.item.name+"-"+this.item.type;
            this.similarities = Utilities.setSimilarityProperties({}, this.item);
            if (hasProperty(data, game.itempiles.ITEM_QUANTITY_ATTRIBUTE)) {
                this.data.quantity.set(Utilities.getItemQuantity(data));
                const quantity = Math.min(get(this.data.currentQuantity), get(this.data.quantityLeft), get(this.data.quantity));
                this.data.currentQuantity.set(quantity);
                this.refreshShareData();
            }
        });

        this.subscribeTo(this.store.shareData, (val) => {
            this.refreshShareData();
        });

    }

    setupProperties() {
        this.isCurrency = PileUtilities.isItemCurrency(this.item, { target: this.store.source });
        this.similarities = Utilities.setSimilarityProperties({}, this.item);
        this.toShare = this.isCurrency
            ? get(this.store.pileData).shareCurrenciesEnabled && !!this.store.recipient
            : get(this.store.pileData).shareItemsEnabled && !!this.store.recipient;
    }

    refreshShareData() {

        if (!this.toShare) {
            this.data.quantityLeft.set(get(this.data.quantity));
            return;
        }

        const quantityLeft = SharingUtilities.getItemSharesLeftForActor(this.store.source, this.item, this.store.recipient);

        this.data.quantityLeft.set(quantityLeft);

    }

    filter(){
        const search = get(this.store.search);
        const visibleFromTheStart = get(this.data.wasVisibleFromTheStart);
        const quantity = get(this.data.quantity);
        if(quantity === 0 && !visibleFromTheStart){
            this.data.visible.set(false);
        }else if(search){
            this.data.visible.set(this.name.toLowerCase().includes(search.toLowerCase()));
        }else {
            this.data.visible.set(visibleFromTheStart || quantity > 0);
        }
    }
}

class PileAttribute extends PileBaseItem {

    constructor(store, attribute) {
        super(store);
        this.data.wasVisibleFromTheStart = writable(Number(getProperty(this.store.source.data, attribute.path) ?? 0) > 0);
        this.setup(attribute);
    }

    take(){
        const quantity = Math.min(get(this.data.currentQuantity), get(this.data.quantityLeft));
        return game.itempiles.transferAttributes(
            this.store.source,
            this.store.recipient,
            { [ this.path ]: quantity },
            { interactionId: this.interactionId }
        );
    }

    setup(attribute) {

        this.path = attribute.path;
        this.name = attribute.name;
        this.img = attribute.img;
        this.identifier = attribute.path;

        this.data.quantity.set(Number(getProperty(this.store.source.data, this.path) ?? 0));

        this.subscribeTo(this.data.quantity, this.filter.bind(this));
        this.subscribeTo(this.store.search, this.filter.bind(this));

        this.setupProperties();
        this.refreshShareData();

        this.data.currentQuantity.set(Math.min(get(this.data.currentQuantity), get(this.data.quantityLeft), get(this.data.quantity)));

        this.subscribeTo(this.store.pileData, this.setupProperties.bind(this));

        this.subscribeTo(this.store.document, () => {
            const { data } = this.store.document.updateOptions;
            if (hasProperty(data, this.path)) {
                this.data.quantity.set(Number(getProperty(data, this.path) ?? 0));
                this.data.currentQuantity.set(Math.min(get(this.data.currentQuantity), get(this.data.quantityLeft), get(this.data.quantity)));
            }
        });

        this.subscribeTo(this.store.shareData, (val) => {
            this.refreshShareData();
        });

    }

    setupProperties() {
        this.toShare = get(this.store.pileData).shareCurrenciesEnabled && !!this.store.recipient;
    }

    refreshShareData() {

        if (!this.toShare) {
            this.data.quantityLeft.set(get(this.data.quantity));
            return;
        }

        const quantityLeft = SharingUtilities.getAttributeSharesLeftForActor(this.store.source, this.path, this.store.recipient);

        this.data.quantityLeft.set(quantityLeft);

    }

    filter(){
        const search = get(this.store.search);
        const visibleFromTheStart = get(this.data.wasVisibleFromTheStart);
        const quantity = get(this.data.quantity);
        if(quantity === 0 && !visibleFromTheStart && !this.store.editQuantities){
            this.data.visible.set(false);
        }else if(search){
            this.data.visible.set(this.name.toLowerCase().includes(search.toLowerCase()));
        }else {
            this.data.visible.set(visibleFromTheStart || quantity > 0 || this.store.editQuantities);
        }
    }

}