const Discord = require("discord.js");
const { MessageButton } = require("discord-buttons");
const attachDiscordButtons = require("discord-buttons");

/**
 * @typedef {Object} ClickEvent
 * @property {Discord.Client} client
 * @property {Discord.Guild} guild
 * @property {Discord.TextChannel} channel
 * @property {Discord.Message} message
 * @property {Discord.WebhookClient} webhook
 * @property {{member: Discord.GuildMember, user: Discord.User}} clicker
 * @property {string} id
 * @property {boolean} replied
 * @property {boolean} deferred
 * @property {string} discordID
 * @property {string} applicationID
 * @property {string} token
 * @property {number} version
 * @property {{send: (text: string, ...args: any[])=>Promise<void>, edit: (...args: any[])=>Promise<void>, delete: ()=>Promise<void>, fetch: ()=>Promise<void>}} reply
 * @property {(ephemeral?:boolean)=>Promise<void>} think
 * @property {(ephemeral?:boolean)=>Promise<void>} defer
 */


/**
 * @typedef {Object} ButtonCallback
 * @property {string} id
 * @property {number} timeout
 * @property {(cb:(event:ClickEvent,bc:ButtonCallback)=>void)=>void} onClick
 * @property {(cb:(event:ClickEvent,bc:ButtonCallback)=>void)=>void} offClick
 * @property {(cb:(bc:ButtonCallback)=>void)=>void} onTimeout
 * @property {(cb:(bc:ButtonCallback)=>void)=>void} offTimeout
 * @property {()=>void} destroy
 */

let buttonClickEvents = new Set();

/**
 * @param {Discord.Client} client
 */
function attachToClient(client) {
  // Attach discord-button's clickButton event.
  attachDiscordButtons(client);
  client.on("clickButton", (buttonEvent) => {
    buttonClickEvents.forEach((callback) => {
      callback(buttonEvent);
    });
  });
}

class ButtonCallback {

  /** @type {String} */
  id;
  /** @type {Set<(button:ClickEvent,bc:ButtonCallback)=>void>} */
  #listeners = new Set();
  #lastClickTime = Date.now();
  #timeoutChecker = 0;
  #timeoutClickListener = () => { };
  timeout = 0;
  #destroyed = false;
  get destroyed() {
    return this.#destroyed;
  }

  #timeoutCallbacks = new Set();
  #disposeCallbacks = new Set();

  /**
   * @param {{timeout?:number}} opts 
   */
  constructor(opts = {}) {
    this.id = `edb${Math.floor(Math.random() * 0xffffffffffff).toString("36")}`;
    this.timeout = opts.timeout || -1;

    if (this.timeout > 0) {

      this.#timeoutClickListener = (button) => {
        if (this.id == button.id) {
          this.#lastClickTime = Date.now();
        }
      }

      this.#timeoutChecker = setInterval(() => {
        if ((Date.now() - this.timeout) > this.#lastClickTime) {
          this.#timeoutCallbacks?.forEach((callback) => {
            callback(this);
          })
          this.dispose();
        }
      }, 3000);

      buttonClickEvents.add(this.#timeoutClickListener);
    }
  }

  /**
   * @param {(event:ClickEvent,bc:ButtonCallback)=>void} cb
   */
  onClick(cb) {
    if (this.#destroyed) throw "Already Destroyed";
    let listener = (button) => {
      if (this.id == button.id) {
        cb(button, this);
      }
    }
    buttonClickEvents.add(listener);
    this.#listeners.add(listener);
  }

  /**
   * @param {(bc:ButtonCallback)=>void} cb
   */
  onTimeout(cb) {
    if (this.#destroyed) throw "Already Destroyed";
    this.#timeoutCallbacks.add(cb);
  }

  /**
   * @param {()=>void} cb
   */
  onDispose(cb) {
    if (this.#destroyed) throw "Already Destroyed";
    this.#disposeCallbacks.add(cb);
  }

  /**
   * @param {(event:ClickEvent,bc:ButtonCallback)=>void} cb
   */
  offClick(cb) {
    if (this.#destroyed) throw "Already Destroyed";
    this.#listeners.delete(cb);
    buttonClickEvents.delete(cb);
  }

  /**
   * @param {(bc:ButtonCallback)=>void} cb
   */
  offTimeout(cb) {
    if (this.#destroyed) throw "Already Destroyed";
    this.#timeoutCallbacks.delete(cb);
  }

  /**
   * @param {()=>void} cb
   */
  offDispose(cb) {
    if (this.#destroyed) throw "Already Destroyed";
    this.#disposeCallbacks.delete(cb);
  }

  dispose() {
    if (this.#destroyed) throw "Already Destroyed";
    this.#destroyed = true;
    clearInterval(this.#timeoutChecker);
    buttonClickEvents.delete(this.#timeoutClickListener);
    this.#listeners.forEach((listener) => {
      buttonClickEvents.delete(listener);
    });
    this.#timeoutCallbacks.forEach((callback) => {
      this.#timeoutCallbacks.delete(callback);
    });
    this.#disposeCallbacks.forEach((callback) => {
      callback();
      this.#disposeCallbacks.delete(callback);
    });
    this.#timeoutCallbacks = 0;
    this.#listeners = 0;
    this.id = 0;
    this.#timeoutChecker = 0;
    this.#timeoutClickListener = 0;
    this.timeout = 0;
    this.#lastClickTime = 0;
  }
}

/**
 * @param {{timeout: number, defer: boolean, [key:string]: any}} data Message button & callback timeout data.
 * @returns {MessageButton & {callback: ButtonCallback}}
 */
function createButton(data = {}) {
  let callback = new ButtonCallback({ timeout: data.timeout || -1 });
  let button = new MessageButton({ ...data, id: callback.id });
  if (data.defer) {
    callback.onClick((event) => {
      event.defer();
    })
  }
  let result = button;
  result.callback = callback;
  return result;
}


module.exports = { attachToClient, ButtonCallback, createButton };