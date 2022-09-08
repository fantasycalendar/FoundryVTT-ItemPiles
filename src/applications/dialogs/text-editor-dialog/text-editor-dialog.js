import CONSTANTS from "../../../constants/constants.js";

export default class TextEditorDialog extends FormApplication {
  
  constructor(text, options) {
    super();
    this.text = text;
    this.resolve = options.resolve;
  }
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize("ITEM-PILES.Applications.DropItem.Title"),
      template: `${CONSTANTS.PATH}templates/text-editor.html`,
      width: 430,
      height: 350,
      classes: ["item-piles-app"],
      resizable: true
    })
  }
  
  async getData(options) {
    const data = super.getData(options);
    data.text = this.text;
    return data;
  }
  
  static getActiveApps(id) {
    return Object.values(ui.windows).filter(app => app.id === `item-pile-text-editor-${id}`);
  }
  
  async _updateObject(event, formData) {
    this.resolve(formData.text);
    return this.close();
  }
  
  async close(options) {
    this.resolve(null);
    return super.close(options);
  }
  
  static async show(text, options = {}) {
    const apps = options.id ? this.getActiveApps(options.id) : [];
    if (apps.length) {
      for (let app of apps) {
        app.render(false, { focus: true });
      }
      return;
    }
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(text, options).render(true, { focus: true });
    })
  }
  
}