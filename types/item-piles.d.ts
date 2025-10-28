declare namespace ItemPiles {
  /**
   * To allow for maximum compatibility, no foundry types are defined as
   * part of this package. Use declaration merging to merge the types you'd
   * like to use so that TidySheet's API can use the same types
   */
  export interface FoundryTypes {
    Actor: unknown;
    Token: unknown;
    TokenDocument: unknown;
    Item: unknown;
    RollTable: unknown;
    User: unknown;
    RollData: unknown;
  }

  namespace FoundryTypes {
    // Helper method for including multiple Foundry Types
    export type For<T extends keyof FoundryTypes> = FoundryTypes[T];
  }

  /**
   * Extracts just the data properties from a type (properties only, no methods)
   */
  export type DataProperties<T> = {
    [K in keyof T as T[K] extends (...args: infer _Args) => infer _R
      ? never
      : K]: T[K];
  };

  /**
   * Represents either a document class or a plain object with the same structure
   */
  export type DocumentOrData<T> = T | DataProperties<T>;

  /**
   * Currency definition for the Item Piles system
   */
  export interface Currency {
    /** Currency type - either attribute or item */
    type: "attribute" | "item";
    /** Display name of the currency */
    name: string;
    /** Image path for the currency icon */
    img?: string;
    /** Abbreviation used in currency strings (e.g., "GP", "SP") */
    abbreviation: string;
    /** Exchange rate relative to primary currency (primary currencies only) */
    exchangeRate?: number;
    /** Whether this is the primary currency */
    primary?: boolean;
    /** Whether this is a secondary currency */
    secondary?: boolean;
    /** Data for the currency */
    data: {
      /** Path to the attribute on the actor */
      path?: string;
      /** UUID of the item representing this currency */
      uuid?: string;
      /** Item document representing this currency */
      item?: FoundryTypes["Item"];
    };
  }

  /**
   * Currency data with quantity
   */
  export interface CurrencyWithQuantity extends Currency {
    /** Current quantity of this currency */
    quantity: number;
  }

  /**
   * Price breakdown for a currency
   */
  export interface CurrencyWithCost extends Currency {
    /** Final cost in this currency */
    cost: number;
    /** Base cost before modifiers */
    baseCost: number;
    /** Maximum possible cost in this currency */
    maxCurrencyCost: number;
    /** String representation of the price */
    string: string;
  }

  /**
   * Price option for an item
   */
  export interface ItemPriceOptions {
    /** Whether this item is free */
    free: boolean;
    /** Base prices before modifiers */
    basePrices: CurrencyWithCost[];
    /** Base price string representation */
    basePriceString: string;
    /** Final prices after modifiers */
    prices: CurrencyWithCost[];
    /** Final price string representation */
    priceString: string;
    /** Total cost in primary currency */
    totalCost: number;
    /** Base cost in primary currency */
    baseCost: number;
    /** Whether this uses primary currency */
    primary: boolean;
    /** Maximum quantity that can be purchased */
    maxQuantity: number;
    /** Quantity being priced */
    quantity: number;
  }
  /**
   * Trade item specification
   */
  export interface TradeItemSpec {
    /** Item or item ID */
    item: FoundryTypes["Item"] | string;
    /** Quantity to trade */
    quantity?: number;
    /** Payment option index */
    paymentIndex?: number;
  }

  /**
   * Item filter configuration
   */
  export interface ItemFilter {
    /** Path to the item property to filter on */
    path: string;
    /** Filter string to apply */
    filters: string;
  }

  /**
   * Price modifier configuration for merchants
   */
  export interface PriceModifier {
    /** Actor to apply modifier to */
    actor?: FoundryTypes["Actor"];
    /** UUID of actor to apply modifier to */
    actorUuid?: string;
    /** Whether to apply modifier relative to existing value */
    relative?: boolean;
    /** Whether to override base merchant modifiers */
    override?: boolean;
    /** Multiplier for buy prices (default: 1.0) */
    buyPriceModifier?: number;
    /** Multiplier for sell prices (default: 0.5) */
    sellPriceModifier?: number;
  }

  /**
   * Item removal result
   */
  export interface ItemRemovalResult {
    /** The item that was removed or updated */
    item: FoundryTypes["Item"];
    /** Quantity that was removed */
    quantity: number;
    /** Whether the item was deleted */
    deleted: boolean;
  }

  /**
   * Pile flag defaults configuration
   */
  export interface PileDefaults {
    /** Whether the pile is enabled */
    enabled?: boolean;
    /** Type of pile */
    type?:
      | "pile"
      | "container"
      | "merchant"
      | "vault"
      | "auctioneer"
      | "banker";
    /** Distance in grid units from which the pile can be interacted with */
    distance?: number;
    /** Macro to execute on pile interaction */
    macro?: string;
    /** Whether to delete the pile when empty */
    deleteWhenEmpty?: "default" | boolean;
    /** Whether items can stack */
    canStackItems?: "yes" | "no";
    /** Whether items can be inspected */
    canInspectItems?: boolean;
    /** Whether to display item types */
    displayItemTypes?: boolean;
    /** Description text for the pile */
    description?: string;
    /** Override item filters */
    overrideItemFilters?: boolean;
    /** Override currencies */
    overrideCurrencies?: boolean;
    /** Override secondary currencies */
    overrideSecondaryCurrencies?: boolean;
    /** Required item properties */
    requiredItemProperties?: string[];
    /** Display settings for single item piles */
    displayOne?: boolean;
    /** Show item name on pile */
    showItemName?: boolean;
    /** Override single item scale */
    overrideSingleItemScale?: boolean;
    /** Scale for single item display */
    singleItemScale?: number;
    /** Enable item sharing */
    shareItemsEnabled?: boolean;
    /** Enable currency sharing */
    shareCurrenciesEnabled?: boolean;
    /** Enable take all */
    takeAllEnabled?: boolean;
    /** Enable split all */
    splitAllEnabled?: boolean;
    /** Only active players can interact */
    activePlayers?: boolean;
    /** Container is closed */
    closed?: boolean;
    /** Container is locked */
    locked?: boolean;
    /** Closed container image */
    closedImage?: string;
    /** Array of closed container images */
    closedImages?: string[];
    /** Empty container image */
    emptyImage?: string;
    /** Array of empty container images */
    emptyImages?: string[];
    /** Opened container image */
    openedImage?: string;
    /** Array of opened container images */
    openedImages?: string[];
    /** Locked container image */
    lockedImage?: string;
    /** Array of locked container images */
    lockedImages?: string[];
    /** Sound to play when closing */
    closeSound?: string;
    /** Array of close sounds */
    closeSounds?: string[];
    /** Sound to play when opening */
    openSound?: string;
    /** Array of open sounds */
    openSounds?: string[];
    /** Sound to play when locked */
    lockedSound?: string;
    /** Array of locked sounds */
    lockedSounds?: string[];
    /** Sound to play when unlocked */
    unlockedSound?: string;
    /** Array of unlocked sounds */
    unlockedSounds?: string[];
    /** Merchant image */
    merchantImage?: string;
    /** Infinite quantity for merchant items */
    infiniteQuantity?: boolean;
    /** Infinite currencies for merchant */
    infiniteCurrencies?: boolean;
    /** Purchase only mode */
    purchaseOnly?: boolean;
    /** Hide new items in merchant */
    hideNewItems?: boolean;
    /** Hide items with zero cost */
    hideItemsWithZeroCost?: boolean;
    /** Keep items with zero quantity */
    keepZeroQuantity?: boolean;
    /** Only accept base price */
    onlyAcceptBasePrice?: boolean;
    /** Display quantity setting */
    displayQuantity?: "yes" | "no" | "always";
    /** Buy price modifier */
    buyPriceModifier?: number;
    /** Sell price modifier */
    sellPriceModifier?: number;
    /** Item type specific price modifiers */
    itemTypePriceModifiers?: Array<{ type: string; modifier: number }>;
    /** Actor specific price modifiers */
    actorPriceModifiers?: PriceModifier[];
    /** Tables for populating merchant inventory */
    tablesForPopulate?: string[];
    /** Merchant column configuration */
    merchantColumns?: Array<{ label: string; path: string }>;
    /** Hide token when merchant is closed */
    hideTokenWhenClosed?: boolean;
    /** Open times configuration */
    openTimes?: {
      enabled: boolean;
      status: "open" | "closed" | "auto";
      open: { hour: number; minute: number };
      close: { hour: number; minute: number };
    };
    /** Days the merchant is closed */
    closedDays?: number[];
    /** Holidays the merchant is closed */
    closedHolidays?: string[];
    /** Refresh items when opening */
    refreshItemsOnOpen?: boolean;
    /** Days to refresh items */
    refreshItemsDays?: number[];
    /** Holidays to refresh items */
    refreshItemsHolidays?: string[];
    /** Log merchant activity */
    logMerchantActivity?: boolean;
    /** Overhead cost for merchant */
    overheadCost?: CurrencyData[];
    /** Number of columns in vault grid */
    cols?: number;
    /** Number of rows in vault grid */
    rows?: number;
    /** Restrict vault access */
    restrictVaultAccess?: boolean;
    /** Enable vault expansion */
    vaultExpansion?: boolean;
    /** Base expansion columns */
    baseExpansionCols?: number;
    /** Base expansion rows */
    baseExpansionRows?: number;
    /** Vault access configuration */
    vaultAccess?: Array<{
      actor: string;
      canView: boolean;
      canOrganize: boolean;
      canWithdraw: boolean;
      canDeposit: boolean;
    }>;
    /** Log vault actions */
    logVaultActions?: boolean;
    /** Vault logging type */
    vaultLogType?: "user_actor" | "user" | "actor";
  }

  /**
   * System integration configuration
   */
  export interface SystemIntegration {
    /** Version of the integration */
    VERSION: string;
    /** Actor class type for item piles */
    ACTOR_CLASS_TYPE: string;
    /** Item class type for loot items */
    ITEM_CLASS_LOOT_TYPE?: string;
    /** Item class type for weapons */
    ITEM_CLASS_WEAPON_TYPE?: string;
    /** Item class type for equipment */
    ITEM_CLASS_EQUIPMENT_TYPE?: string;
    /** Attribute path for item quantity */
    ITEM_QUANTITY_ATTRIBUTE: string;
    /** Attribute path for item price */
    ITEM_PRICE_ATTRIBUTE: string;
    /** Attribute path for quantity for price */
    QUANTITY_FOR_PRICE_ATTRIBUTE?: string;
    /** Item filters configuration */
    ITEM_FILTERS: ItemFilter[];
    /** Item similarity attributes */
    ITEM_SIMILARITIES: string[];
    /** Item types that cannot stack */
    UNSTACKABLE_ITEM_TYPES?: string[];
    /** Default pile settings */
    PILE_DEFAULTS: PileDefaults;
    /** Default token flag settings */
    TOKEN_FLAG_DEFAULTS?: Partial<PileDefaults>;
    /** Item transformer function */
    ITEM_TRANSFORMER?: (item: FoundryTypes["Item"]) => FoundryTypes["Item"];
    /** Item cost transformer function */
    ITEM_COST_TRANSFORMER?: (item: FoundryTypes["Item"]) => number;
    /** Price modifier transformer function */
    PRICE_MODIFIER_TRANSFORMER?: (data: PriceModifier) => PriceModifier;
    /** System hooks function */
    SYSTEM_HOOKS?: () => void;
    /** Sheet overrides function */
    SHEET_OVERRIDES?: () => void;
    /** Vault style configurations */
    VAULT_STYLES?: Array<{
      path: string;
      value: string;
      styling: Record<string, string>;
    }>;
    /** Currency configurations */
    CURRENCIES: Array<Currency & { primary: boolean; exchangeRate: number }>;
    /** Secondary currency configurations */
    SECONDARY_CURRENCIES?: Currency[];
    /** Decimal digits for fractional currency display */
    CURRENCY_DECIMAL_DIGITS?: number;
  }

  /**
   * Currency operation result
   */
  export interface CurrencyOperationResult {
    /** Items that were added/removed */
    items: ItemAndQuantity[];
    /** Attributes that were changed */
    attributes: Record<string, number>;
  }

  /**
   * Item data for adding/transferring
   */
  export interface ItemTransferData {
    /** The item document or item data */
    item: DocumentOrData<FoundryTypes["Item"]>;
    /** Quantity of the item */
    quantity?: number;
  }

  /**
   * Simple item reference
   */
  export interface ItemReference {
    /** ID of the item */
    _id: string;
    /** Quantity to transfer/remove */
    quantity?: number;
  }

  /**
   * Item with quantity for display
   */
  export interface DisplayItem {
    /** Display name */
    name: string;
    /** Image path */
    img: string;
    /** Quantity */
    quantity: number;
  }

  /**
   * Merchant price modifiers result
   */
  export interface MerchantPriceModifiers {
    /** Buy price multiplier */
    buyPriceModifier: number;
    /** Sell price multiplier */
    sellPriceModifier: number;
  }

  /**
   * Currency string data
   */
  export interface CurrencyData {
    /** Numeric cost */
    cost: number;
    /** Currency abbreviation with {#} placeholder */
    abbreviation: string;
    /** Whether cost is a percentage */
    percent?: boolean;
  }

  /**
   * Item with quantity result
   */
  export interface ItemAndQuantity {
    /** The item */
    item: FoundryTypes["Item"];
    /** Quantity of the item */
    quantity: number;
  }

  /**
   * Payment data result
   */
  export interface PaymentData {
    /** Whether the buyer can afford the purchase */
    canBuy: boolean;
    /** Items the buyer will receive */
    buyerReceive: ItemAndQuantity[];
    /** Change the buyer will receive */
    buyerChange: ItemAndQuantity[];
    /** Items/currencies the buyer will pay */
    buyerPayment: ItemAndQuantity[];
    /** Final prices */
    finalPrices: CurrencyWithCost[];
  }

  /**
   * Price information for merchant trades
   */
  export interface PriceInfo {
    /** Whether this uses primary currency */
    primary?: boolean;
    /** Items the buyer receives */
    buyerReceive: ItemAndQuantity[];
    /** Total currency cost */
    totalCurrencyCost?: number;
    /** Base price string */
    basePriceString?: string;
    /** Final prices */
    finalPrices?: CurrencyWithCost[];
  }

  /**
   * Transfer everything result
   */
  export interface TransferSummary {
    /** Items that were transferred */
    items: FoundryTypes["Item"][];
    /** Attributes that were transferred */
    attributes: Record<string, number>;
  }

  /**
   * Vault grid item data
   */
  export interface VaultGridItem {
    /** Item in the grid */
    item: FoundryTypes["Item"];
    /** X position */
    x: number;
    /** Y position */
    y: number;
    /** Width in grid units */
    width: number;
    /** Height in grid units */
    height: number;
    /** Whether the item is flipped */
    flipped?: boolean;
    /** Quantity */
    quantity: number;
  }

  /**
   * Vault grid data
   */
  export interface VaultGridData {
    /** Grid width */
    width: number;
    /** Grid height */
    height: number;
    /** Items in the grid */
    items: VaultGridItem[];
    /** Whether the grid has been modified */
    gridData?: Array<Array<string | null>>;
  }

  /**
   * Result of creating an item pile
   */
  export interface CreateItemPileResult {
    /** UUID of the created token */
    tokenUuid?: string;
    /** UUID of the created or used actor */
    actorUuid: string;
  }

  /**
   * Split pile result
   */
  export interface SplitPileResult {
    /** Items distributed to each actor */
    items: Record<string, ItemAndQuantity[]>;
    /** Attributes distributed to each actor */
    attributes: Record<string, Record<string, number>>;
  }

  /**
   * Item Piles API
   */
  export class API {
    /* ================================================
     * STATIC GETTERS - System Configuration
     * ================================================ */

    /** The actor class type used for item pile actors in this system */
    static readonly ACTOR_CLASS_TYPE: string;

    /** The item class type for loot items */
    static readonly ITEM_CLASS_LOOT_TYPE: string;

    /** The item class type for weapon items */
    static readonly ITEM_CLASS_WEAPON_TYPE: string;

    /** The item class type for equipment items */
    static readonly ITEM_CLASS_EQUIPMENT_TYPE: string;

    /** The currencies used in this system */
    static readonly CURRENCIES: Currency[];

    /** The secondary currencies used in this system */
    static readonly SECONDARY_CURRENCIES: Currency[];

    /** Decimal digits shown for fractional currency amounts */
    static readonly CURRENCY_DECIMAL_DIGITS: number;

    /** Attribute path for item prices */
    static readonly ITEM_PRICE_ATTRIBUTE: string;

    /** Attribute path for quantity for price */
    static readonly QUANTITY_FOR_PRICE_ATTRIBUTE: string;

    /** Attribute path for item quantities */
    static readonly ITEM_QUANTITY_ATTRIBUTE: string;

    /** Item filters for eligible interaction */
    static readonly ITEM_FILTERS: ItemFilter[];

    /** Attributes for detecting item similarities */
    static readonly ITEM_SIMILARITIES: string[];

    /** Item types that are always unique */
    static readonly UNSTACKABLE_ITEM_TYPES: string[];

    /** Default values for item pile actors */
    static readonly PILE_DEFAULTS: PileDefaults;

    /** Default values for item pile tokens */
    static readonly TOKEN_FLAG_DEFAULTS: Partial<PileDefaults>;

    /* ================================================
     * SYSTEM CONFIGURATION METHODS
     * ================================================ */

    /**
     * Sets the actor class type used for item pile actors
     */
    static setActorClassType(inClassType: string): Promise<void>;

    /**
     * Sets the currencies used in this system
     */
    static setCurrencies(
      inCurrencies: Array<Currency & { primary: boolean; exchangeRate: number }>
    ): Promise<void>;

    /**
     * Sets the secondary currencies used in this system
     */
    static setSecondaryCurrencies(
      inSecondaryCurrencies: Currency[]
    ): Promise<void>;

    /**
     * Sets the decimal digits for fractional currency display
     */
    static setCurrencyDecimalDigits(inDecimalDigits: number): Promise<void>;

    /**
     * Sets the attribute path for item quantities
     */
    static setItemQuantityAttribute(inAttribute: string): Promise<void>;

    /**
     * Sets the attribute path for item prices
     */
    static setItemPriceAttribute(inAttribute: string): Promise<void>;

    /**
     * Sets the attribute path for quantity for price
     */
    static setQuantityForPriceAttribute(inAttribute: string): Promise<void>;

    /**
     * Sets the item filters for interaction
     */
    static setItemFilters(inFilters: ItemFilter[]): Promise<void>;

    /**
     * Sets the attributes for detecting item similarities
     */
    static setItemSimilarities(inPaths: string[]): Promise<void>;

    /**
     * Sets the item types that are always unique
     */
    static setUnstackableItemTypes(inTypes: string[]): Promise<void>;

    /**
     * Sets the default pile settings
     */
    static setPileDefaults(inDefaults: Partial<PileDefaults>): Promise<void>;

    /**
     * Sets the default token flag settings
     */
    static setTokenFlagDefaults(
      inDefaults: Partial<PileDefaults>
    ): Promise<void>;

    /**
     * Adds a complete system integration
     */
    static addSystemIntegration(
      inData: SystemIntegration,
      version?: string
    ): void;

    /**
     * Gets the primary currency for the system or a specific actor
     */
    static getPrimaryCurrency(actor?: FoundryTypes["Actor"]): Currency;

    /**
     * Retrieves all item categories including custom ones
     */
    static getItemCategories(): Record<string, string>;

    /* ================================================
     * ITEM PILE CREATION & MANAGEMENT
     * ================================================ */

    /**
     * Creates an item pile token at a location and/or an item pile actor
     */
    static createItemPile(options?: {
      /** Position to create the pile at */
      position?: { x: number; y: number };
      /** Scene ID to create the pile on */
      sceneId?: string;
      /** Token data overrides */
      tokenOverrides?: Partial<DocumentOrData<FoundryTypes["TokenDocument"]>>;
      /** Actor data overrides */
      actorOverrides?: Partial<DocumentOrData<FoundryTypes["Actor"]>>;
      /** Item pile flag data */
      itemPileFlags?: Partial<PileDefaults>;
      /** Items to add to the pile */
      items?: Array<DocumentOrData<FoundryTypes["Item"]> | ItemTransferData>;
      /** Whether to create a new actor */
      createActor?: boolean;
      /** Actor UUID/ID/name to use */
      actor?: string;
      /** Folders to create the actor in */
      folders?: string[] | string;
    }): Promise<CreateItemPileResult>;

    /**
     * Turns tokens and actors into item piles
     */
    static turnTokensIntoItemPiles(
      targets:
        | FoundryTypes.For<"Token" | "TokenDocument">
        | Array<FoundryTypes.For<"Token" | "TokenDocument">>,
      options?: {
        /** Item pile settings to apply */
        pileSettings?: Partial<PileDefaults>;
        /** Token settings to update */
        tokenSettings?:
          | Partial<DocumentOrData<FoundryTypes["TokenDocument"]>>
          | ((
              token: FoundryTypes["TokenDocument"]
            ) => Partial<DocumentOrData<FoundryTypes["TokenDocument"]>>);
      }
    ): Promise<string[]>;

    /**
     * Reverts tokens from item piles to normal tokens
     */
    static revertTokensFromItemPiles(
      targets:
        | FoundryTypes.For<"Token" | "TokenDocument">
        | Array<FoundryTypes.For<"Token" | "TokenDocument">>,
      options?: {
        /** Token settings to update */
        tokenSettings?:
          | Partial<DocumentOrData<FoundryTypes["TokenDocument"]>>
          | ((
              token: FoundryTypes["TokenDocument"]
            ) => Partial<DocumentOrData<FoundryTypes["TokenDocument"]>>);
      }
    ): Promise<string[]>;

    /**
     * Opens an item pile container
     */
    static openItemPile(
      target: FoundryTypes.For<"Token" | "TokenDocument">,
      interactingToken?: FoundryTypes.For<"Token" | "TokenDocument">
    ): Promise<void>;

    /**
     * Closes an item pile container
     */
    static closeItemPile(
      target: FoundryTypes.For<"Token" | "TokenDocument">,
      interactingToken?: FoundryTypes.For<"Token" | "TokenDocument">
    ): Promise<void>;

    /**
     * Toggles an item pile's closed state
     */
    static toggleItemPileClosed(
      target: FoundryTypes.For<"Token" | "TokenDocument">,
      interactingToken?: FoundryTypes.For<"Token" | "TokenDocument">
    ): Promise<boolean>;

    /**
     * Locks an item pile container
     */
    static lockItemPile(
      target: FoundryTypes.For<"Token" | "TokenDocument">,
      interactingToken?: FoundryTypes.For<"Token" | "TokenDocument">
    ): Promise<void>;

    /**
     * Unlocks an item pile container
     */
    static unlockItemPile(
      target: FoundryTypes.For<"Token" | "TokenDocument">,
      interactingToken?: FoundryTypes.For<"Token" | "TokenDocument">
    ): Promise<void>;

    /**
     * Toggles an item pile's locked state
     */
    static toggleItemPileLocked(
      target: FoundryTypes.For<"Token" | "TokenDocument">,
      interactingToken?: FoundryTypes.For<"Token" | "TokenDocument">
    ): Promise<void>;

    /**
     * Plays the locked sound for an item pile
     */
    static rattleItemPile(
      target: FoundryTypes.For<"Token" | "TokenDocument">,
      interactingToken?: FoundryTypes.For<"Token" | "TokenDocument">
    ): Promise<boolean>;

    /**
     * Checks if an item pile is locked
     */
    static isItemPileLocked(
      target: FoundryTypes.For<"Token" | "TokenDocument">,
      data?: Partial<PileDefaults>
    ): boolean;

    /**
     * Checks if an item pile is closed
     */
    static isItemPileClosed(
      target: FoundryTypes.For<"Token" | "TokenDocument">,
      data?: Partial<PileDefaults>
    ): boolean;

    /**
     * Checks if a target is a valid item pile
     */
    static isValidItemPile(
      target: FoundryTypes.For<"Token" | "TokenDocument">,
      data?: Partial<PileDefaults>
    ): boolean;

    /**
     * Checks if an item pile is a regular pile
     */
    static isRegularItemPile(
      target: FoundryTypes.For<"Token" | "TokenDocument">,
      data?: Partial<PileDefaults>
    ): boolean;

    /**
     * Checks if an item pile is a container
     */
    static isItemPileContainer(
      target: FoundryTypes.For<"Token" | "TokenDocument">,
      data?: Partial<PileDefaults>
    ): boolean;

    /**
     * Checks if an item pile is lootable
     */
    static isItemPileLootable(
      target: FoundryTypes.For<"Token" | "TokenDocument">,
      data?: Partial<PileDefaults>
    ): boolean;

    /**
     * Checks if an item pile is a vault
     */
    static isItemPileVault(
      target: FoundryTypes.For<"Token" | "TokenDocument">,
      data?: Partial<PileDefaults>
    ): boolean;

    /**
     * Checks if an item pile is a merchant
     */
    static isItemPileMerchant(
      target: FoundryTypes.For<"Token" | "TokenDocument">,
      data?: Partial<PileDefaults>
    ): boolean;

    /**
     * Checks if an item pile is a banker (requires item_piles_bankers module)
     */
    static isItemPileBanker(
      target: FoundryTypes.For<"Token" | "TokenDocument">,
      data?: Partial<PileDefaults>
    ): boolean;

    /**
     * Checks if an item pile is an auctioneer (requires item_piles_auctioneer module)
     */
    static isItemPileAuctioneer(
      target: FoundryTypes.For<"Token" | "TokenDocument">,
      data?: Partial<PileDefaults>
    ): boolean;

    /**
     * Checks if an item pile is empty
     */
    static isItemPileEmpty(
      target: FoundryTypes.For<"Token" | "TokenDocument">
    ): boolean;

    /**
     * Updates an item pile with new data
     */
    static updateItemPile(
      target: FoundryTypes.For<"Actor" | "TokenDocument">,
      newData: Partial<PileDefaults>,
      options?: {
        /** Interacting token that triggered this update */
        interactingToken?: FoundryTypes.For<"Token" | "TokenDocument">;

        /** Token settings to update */
        tokenSettings?: Partial<DocumentOrData<FoundryTypes["TokenDocument"]>>;
      }
    ): Promise<FoundryTypes.For<"Actor" | "TokenDocument">>;

    /**
     * Deletes an item pile token
     */
    static deleteItemPile(
      target: FoundryTypes.For<"Token" | "TokenDocument">
    ): Promise<void>;

    /**
     * Splits an item pile's contents between players or specific targets
     */
    static splitItemPileContents(
      target: FoundryTypes.For<"Token" | "TokenDocument" | "Actor">,
      options?: {
        /** Targets to receive the split contents */
        targets?:
          | FoundryTypes.For<"TokenDocument" | "Actor">
          | Array<FoundryTypes.For<"TokenDocument" | "Actor">>;
        /** Actor that triggered the split */
        instigator?: FoundryTypes.For<"TokenDocument" | "Actor">;
      }
    ): Promise<SplitPileResult | false>;

    /* ================================================
     * MERCHANT METHODS
     * ================================================ */

    /**
     * Retrieves price modifiers for a merchant
     */
    static getMerchantPriceModifiers(
      target: FoundryTypes.For<"Actor" | "TokenDocument">,
      options?: {
        /** Actor whose modifiers to check */
        actor?: FoundryTypes["Actor"] | string;
        /** Only consider actor's modifiers */
        absolute?: boolean;
      }
    ): MerchantPriceModifiers;

    /**
     * Updates price modifiers for a merchant
     */
    static updateMerchantPriceModifiers(
      target: FoundryTypes.For<"Actor" | "TokenDocument">,
      priceModifierData?: PriceModifier[]
    ): Promise<FoundryTypes.For<"Actor" | "TokenDocument">>;

    /**
     * Refreshes a merchant's inventory
     */
    static refreshMerchantInventory(
      target: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      options?: {
        /** Whether to clear existing inventory */
        removeExistingActorItems?: boolean;
      }
    ): Promise<ItemAndQuantity[]>;

    /* ================================================
     * ITEM OPERATIONS
     * ================================================ */

    /**
     * Adds items to an actor
     */
    static addItems(
      target: FoundryTypes.For<"Actor" | "TokenDocument" | "Token">,
      items: Array<ItemTransferData | FoundryTypes["Item"]>,
      options?: {
        /** Remove existing items before adding */
        removeExistingActorItems?: boolean;
        /** Skip vault logging */
        skipVaultLogging?: boolean;
        /** Interaction ID */
        interactionId?: string;
      }
    ): Promise<ItemAndQuantity[]>;

    /**
     * Removes items from an actor
     */
    static removeItems(
      target: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      items: Array<ItemReference | FoundryTypes["Item"] | string>,
      options?: {
        /** Skip vault logging */
        skipVaultLogging?: boolean;
        /** Interaction ID */
        interactionId?: string;
      }
    ): Promise<ItemRemovalResult[]>;

    /**
     * Transfers items from one actor to another
     */
    static transferItems(
      source: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      target: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      items: Array<ItemReference | FoundryTypes["Item"] | string>,
      options?: {
        /** Skip vault logging */
        skipVaultLogging?: boolean;
        /** Interaction ID */
        interactionId?: string;
      }
    ): Promise<ItemAndQuantity[]>;

    /**
     * Transfers all items from one actor to another
     */
    static transferAllItems(
      source: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      target: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      options?: {
        /** Item type filters */
        itemFilters?: ItemFilter[];
        /** Skip vault logging */
        skipVaultLogging?: boolean;
        /** Interaction ID */
        interactionId?: string;
      }
    ): Promise<FoundryTypes["Item"][]>;

    /* ================================================
     * ATTRIBUTE OPERATIONS
     * ================================================ */

    /**
     * Sets attributes on an actor
     */
    static setAttributes(
      target: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      attributes: Record<string, number>,
      options?: {
        /** Interaction ID */
        interactionId?: string;
      }
    ): Promise<Record<string, number>>;

    /**
     * Adds attributes to an actor
     */
    static addAttributes(
      target: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      attributes: Record<string, number>,
      options?: {
        /** Skip vault logging */
        skipVaultLogging?: boolean;
        /** Interaction ID */
        interactionId?: string;
      }
    ): Promise<Record<string, number>>;

    /**
     * Removes attributes from an actor
     */
    static removeAttributes(
      target: FoundryTypes.For<"Token" | "TokenDocument">,
      attributes: string[] | Record<string, number>,
      options?: {
        /** Skip vault logging */
        skipVaultLogging?: boolean;
        /** Interaction ID */
        interactionId?: string;
      }
    ): Promise<Record<string, number>>;

    /**
     * Transfers attributes from one actor to another
     */
    static transferAttributes(
      source: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      target: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      attributes: string[] | Record<string, number>,
      options?: {
        /** Skip vault logging */
        skipVaultLogging?: boolean;
        /** Interaction ID */
        interactionId?: string;
      }
    ): Promise<Record<string, number>>;

    /**
     * Transfers all dynamic attributes from one actor to another
     */
    static transferAllAttributes(
      source: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      target: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      options?: {
        /** Skip vault logging */
        skipVaultLogging?: boolean;
        /** Interaction ID */
        interactionId?: string;
      }
    ): Promise<Record<string, number>>;

    /* ================================================
     * TRANSFER EVERYTHING & COMBINE
     * ================================================ */

    /**
     * Transfers all items and attributes from one actor to another
     */
    static transferEverything(
      source: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      target: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      options?: {
        /** Item type filters */
        itemFilters?: ItemFilter[];
        /** Skip vault logging */
        skipVaultLogging?: boolean;
        /** Interaction ID */
        interactionId?: string;
      }
    ): Promise<TransferSummary>;

    /**
     * Combines multiple item piles into a single pile
     */
    static combineItemPiles(
      target: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      sources: Array<FoundryTypes.For<"Actor" | "Token" | "TokenDocument">>,
      options?: {
        /** Item type filters */
        itemFilters?: ItemFilter[];
        /** Item pile flags to set on target */
        targetItemPileFlags?: Partial<PileDefaults>;
        /** Interaction ID */
        interactionId?: string;
      }
    ): Promise<TransferSummary>;

    /* ================================================
     * CURRENCY OPERATIONS
     * ================================================ */

    /**
     * Gets all currency abbreviations
     */
    static getCurrenciesAbbreviations(): string[];

    /**
     * Converts currency data to a string representation
     */
    static getStringFromCurrencies(currencies: CurrencyData[]): string;

    /**
     * Converts a currency string to currency data
     */
    static getCurrenciesFromString(currencies: string): CurrencyData[];

    /**
     * Calculates currency modifications
     */
    static calculateCurrencies(
      firstCurrencies: string,
      secondCurrencies: string | number,
      subtract?: boolean
    ): string;

    /**
     * Gets payment data for a price
     */
    static getPaymentData(
      price: string | number,
      options?: {
        /** Quantity to buy */
        quantity?: number;
        /** Target actor for payment */
        target?: FoundryTypes.For<"Actor" | "Token" | "TokenDocument"> | string;
      }
    ): PaymentData;

    /**
     * @deprecated Use getPaymentData instead
     */
    static getPaymentDataFromString(
      ...args: Parameters<typeof API.getPaymentData>
    ): PaymentData;

    /**
     * Updates currencies on an actor
     */
    static updateCurrencies(
      target: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      currencies: string,
      options?: {
        /** Interaction ID */
        interactionId?: string;
      }
    ): Promise<CurrencyOperationResult>;

    /**
     * Adds currencies to an actor
     */
    static addCurrencies(
      target: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      currencies: string,
      options?: {
        /** Interaction ID */
        interactionId?: string;
      }
    ): Promise<CurrencyOperationResult>;

    /**
     * Removes currencies from an actor
     */
    static removeCurrencies(
      target: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      currencies: string,
      options?: {
        /** Allow change to be given */
        change?: boolean;
        /** Interaction ID */
        interactionId?: string;
      }
    ): Promise<CurrencyOperationResult>;

    /**
     * Transfers currencies from one actor to another
     */
    static transferCurrencies(
      source: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      target: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      currencies: string,
      options?: {
        /** Allow change to be given */
        change?: boolean;
        /** Interaction ID */
        interactionId?: string;
      }
    ): Promise<CurrencyOperationResult>;

    /**
     * Transfers all currencies from one actor to another
     */
    static transferAllCurrencies(
      source: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      target: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      options?: {
        /** Interaction ID */
        interactionId?: string;
      }
    ): Promise<CurrencyOperationResult>;

    /* ================================================
     * ROLL TABLE & MERCHANT
     * ================================================ */

    /**
     * Rolls on an item table
     */
    static rollItemTable(
      table: string | FoundryTypes["RollTable"],
      options?: {
        /** Number of times to roll */
        timesToRoll?: string | number;
        /** Reset table before rolling */
        resetTable?: boolean;
        /** Normalize table before rolling */
        normalizeTable?: boolean;
        /** Display results in chat */
        displayChat?: boolean;
        /** Roll data to inject */
        rollData?: FoundryTypes["RollData"];
        /** Target actor to add items to */
        targetActor?: FoundryTypes["Actor"] | string;
        /** Remove existing items from target */
        removeExistingActorItems?: boolean;
        /** Custom category for items */
        customCategory?: boolean | string;
      }
    ): Promise<ItemAndQuantity[]>;

    /* ================================================
     * UTILITY METHODS
     * ================================================ */

    /**
     * Gets valid items from an actor
     */
    static getActorItems(
      target:
        | FoundryTypes["Actor"]
        | FoundryTypes["TokenDocument"]
        | FoundryTypes["Token"]
    ): FoundryTypes["Item"][];

    /**
     * Finds a similar item in a list
     */
    static findSimilarItem(
      itemsToSearch: FoundryTypes["Item"][],
      itemToFind: FoundryTypes["Item"],
      options?: {
        /** Whether to check similarity based on stacking rules */
        requireSameStack?: boolean;
      }
    ): FoundryTypes["Item"] | undefined;

    /**
     * Gets currencies from an actor
     */
    static getActorCurrencies(
      target: FoundryTypes.For<"Actor" | "TokenDocument" | "Token">,
      options?: {
        /** Get all currencies regardless of quantity */
        getAll?: boolean;
        /** Include secondary currencies */
        secondary?: boolean;
      }
    ): CurrencyWithQuantity[];

    /**
     * Updates the token HUD for all users
     */
    static updateTokenHud(): Promise<void>;

    /**
     * Requests a trade with another user
     */
    static requestTrade(user?: FoundryTypes["User"]): Promise<void>;

    /**
     * Spectates an ongoing trade
     */
    static spectateTrade(tradeId: {
      tradeId: string;
      tradeUser: string;
    }): Promise<void>;

    /**
     * Renders an item pile interface for users
     */
    static renderItemPileInterface(
      target: FoundryTypes.For<"Actor" | "TokenDocument">,
      options?: {
        /** Users to render for */
        userIds?:
          | Array<string | FoundryTypes["User"]>
          | string
          | FoundryTypes["User"]
          | null;
        /** Actor viewing the interface */
        inspectingTarget?: FoundryTypes.For<"Actor" | "TokenDocument"> | null;
        /** Use assigned character */
        useDefaultCharacter?: boolean;
      }
    ): Promise<void>;

    /**
     * Closes item pile interfaces
     */
    static unrenderItemPileInterface(
      target: FoundryTypes.For<"Actor" | "TokenDocument">,
      options?: {
        /** Users to close for */
        userIds?:
          | Array<string | FoundryTypes["User"]>
          | string
          | FoundryTypes["User"]
          | null;
      }
    ): Promise<void>;

    /**
     * Gets the total numerical cost of an item
     */
    static getCostOfItem(item: FoundryTypes["Item"]): number;

    /**
     * Gets price options for an item
     */
    static getPricesForItem(
      item: FoundryTypes["Item"],
      options?: {
        /** Selling actor */
        seller?: FoundryTypes["Actor"];
        /** Buying actor */
        buyer?: FoundryTypes["Actor"];
        /** Quantity to buy */
        quantity?: number;
      }
    ): ItemPriceOptions[];

    /**
     * Trades items between a seller and buyer
     */
    static tradeItems(
      seller: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      buyer: FoundryTypes.For<"Actor" | "Token" | "TokenDocument">,
      items: TradeItemSpec[],
      options?: {
        /** Interaction ID */
        interactionId?: string;
      }
    ): Promise<CurrencyOperationResult>;

    /**
     * Opens a dialog to give an item to another actor
     */
    static giveItem(item: FoundryTypes["Item"]): Promise<ItemAndQuantity[]>;

    /**
     * Checks if an item can fit in a vault
     */
    static canItemFitInVault(
      item: FoundryTypes["Item"],
      vaultActor: FoundryTypes["Actor"]
    ): boolean;

    /**
     * Checks if items can fit in a vault
     */
    static fitItemsIntoVault(
      items: FoundryTypes["Item"][],
      vaultActor: FoundryTypes["Actor"]
    ): boolean;

    /**
     * Registers a custom item pile type
     */
    static registerItemPileType(
      type: string,
      label: string,
      flags?: string[]
    ): Promise<void>;

    /**
     * Checks if an item is invalid for the pile
     */
    static isItemInvalid(item: FoundryTypes["Item"]): boolean;

    /**
     * Checks if an item can stack
     */
    static canItemStack(
      item: FoundryTypes["Item"],
      actor?: FoundryTypes["Actor"]
    ): boolean;

    /**
     * Gets vault grid data
     */
    static getVaultGridData(vaultActor: FoundryTypes["Actor"]): VaultGridData;

    /**
     * Gets item pile flag data from an actor
     */
    static getActorFlagData(
      actor: FoundryTypes["Actor"]
    ): Partial<PileDefaults>;

    /**
     * Gets the quantity of an item
     */
    static getItemQuantity(item: FoundryTypes["Item"]): number;

    /**
     * Shows the item pile configuration dialog
     */
    static showItemPileConfig(
      actor: FoundryTypes["Actor"]
    ): Promise<void> | undefined;
  }
}

export {};
