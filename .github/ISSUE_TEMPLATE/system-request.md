---
name: System request
about: Request a new supported system
title: "[SYSTEM] - Write the system's name here"
labels: enhancement
assignees: ''

---

# **[INSERT FOUNDRY PAGE LINK TO SYSTEM HERE]**

### **Actor Class Type**: "[WRITE TYPE HERE]"

*The actor class type is the type of actor that will be used for the default item pile actor that is created on first
item drop*

D&D5e system example: `character`

### **Item Quantity Attribute**: "[WRITE ATTRIBUTE PATH HERE]"

*The item quantity attribute is the path to the attribute on items that denote how many of that item that exists*

D&D5e system example: `system.quantity`

### **Item Price Attribute**: "[WRITE ATTRIBUTE PATH HERE]"

*The item price attribute is the path to the attribute on each item that determine how much it costs*

D&D5e system example: `system.price`

### **Item Filters**: "[WRITE ITEM FILTERS HERE]"

*Item filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and
classes*

D&D5e system example: `spell, feat, class`

### **Item Similarities**: [WRITE ITEM SIMILARITIES HERE]

*Item similarities determines how item piles detect similarities and differences in the system*

D&D5e system example: `name, type`

### **Currencies**:

*Currencies in item piles are a list of names, attribute paths, and images*

- **Name**: [WRITE ATTRIBUTE NAME HERE] _or localized name_ [WRITE ATTRIBUTE NAME HERE]
- **Path**: [WRITE ATTRIBUTE PATH HERE]
- **Image**: [WRITE IMAGE PATH HERE (or blank)]
- **Exchange Rate**: [WRITE CURRENCY EXCHANGE RATE]
- **Shorthand Name**: [WRITE CURRENCY SHORT HAND NAME]
- **Primary Currency**: Yes/No

D&D5e system example:

- **Name**: "Platinum Coins" _or localized name_ "DND5E.CurrencyPP"
- **Path**: "system.currency.pp"
- **Image**: "icons/commodities/currency/coin-inset-snail-silver.webp"
- **Exchange Rate**: 10
- **Shorthand Name**: PP
- **Primary Currency**: No

---

- **Name**: "Gold Coins" _or localized name_ "DND5E.CurrencyGP"
- **Path**: "system.currency.gp"
- **Image**: "icons/commodities/currency/coin-embossed-crown-gold.webp"
- **Exchange Rate**: 1
- **Shorthand Name**: GP
- **Primary Currency**: Yes

---

- **Name**: "Electrum Coins" _or localized name_ "DND5E.CurrencyEP"
- **Path**: "system.currency.ep"
- **Image**: "icons/commodities/currency/coin-inset-copper-axe.webp"
- **Exchange Rate**: 0.5
- **Shorthand Name**: EP
- **Primary Currency**: No

---

- **Name**: "Silver Coins" _or localized name_ "DND5E.CurrencySP"
- **Path**: "system.currency.sp"
- **Image**: "icons/commodities/currency/coin-engraved-moon-silver.webp"
- **Exchange Rate**: 0.1
- **Shorthand Name**: SP
- **Primary Currency**: No

---

- **Name**: "Copper Coins" _or localized name_ "DND5E.CurrencyCP"
- **Path**: "system.currency.cp"
- **Image**: "icons/commodities/currency/coin-engraved-waves-copper.webp"
- **Exchange Rate**: 0.01
- **Shorthand Name**: CP
- **Primary Currency**: No
