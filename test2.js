const { Client } = require("discord.js");
const { MessageActionRow, MessageButton } = require("discord-buttons");
const client = new Client();
const easyButtons = require(".");
const { ButtonCallback } = require(".");

easyButtons.attachToClient(client);


client.on("message", async (message) => {

  let args = message.content.split(" ");
  console.log(args)

  if (args[0] == `abc!countup`) {

    let myButtonCallback = new ButtonCallback({timeout: 10000});
    let myButton = new MessageButton()
      .setStyle("red")
      .setLabel("0")
      .setID(myButtonCallback.id);
    
    let number = 0;

    myButtonCallback.onClick((event) => {
      event.defer();
      myButton.setLabel(`${++number}`)
      event.message.edit("Count Up +1", myButton);
    });
    
    message.channel.send("Count Up +1", myButton);
  }

});

client.login("<token>")