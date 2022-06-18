import { writable, get } from 'svelte/store';

const currencyStore = writable([]);

currencyStore.attributes = writable([]);
currencyStore.items = writable([]);
currencyStore.primary = writable(false)

currencyStore.setPrimary = (index, item = false) => {
    const attributes = get(currencyStore.attributes);
    const items = get(currencyStore.items);

    items.forEach(item => {
        item.primary = false;
    });
    attributes.forEach(attr => {
        attr.primary = false;
    });

    if(item){
        items[index].primary = true;
    }else{
        attributes[index].primary = true;
    }
    currencyStore.primary.set(true);

    currencyStore.attributes.set(attributes);
    currencyStore.items.set(items);
}

currencyStore.export = () => {
    return {
        attributes: get(currencyStore.attributes),
        items: get(currencyStore.items)
    };
}

export { currencyStore };