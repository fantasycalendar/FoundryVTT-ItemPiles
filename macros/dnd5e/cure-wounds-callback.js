if (!game.modules.get("advanced-macros")?.active) {
  ui.notifications.error(`This macro requires the "Advanced Macros" module to function!`);
  return;
}

if (!args.length) {
  ui.notifications.error(`This macro isn't called from the hotbar or executed from the window, it's executed by Item Piles as a part of buying the "Cure Wounds" service!`);
  return;
}

const { buyer, seller, item, quantity } = args[0];

const sellerSpellCastingAttr = seller.system.attributes?.spellcasting || "wis";
const sellerSpellCastingBonus = seller.system.abilities[sellerSpellCastingAttr]?.mod || 0;

const healingRoll = new Roll(`${quantity}d8 + @mod`, { mod: sellerSpellCastingBonus }).evaluate({ async: false });

const buyerNewHealth = Math.min(buyer.system.attributes.hp.max, buyer.system.attributes.hp.value + healingRoll.total);

await buyer.update({
  "system.attributes.hp.value": buyerNewHealth
});

await healingRoll.toMessage({
  flavor: `${seller.name} heals ${buyer.name}`
});