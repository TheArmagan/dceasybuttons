const { Client } = require("discord.js");
const { MessageActionRow } = require("discord-buttons");
const client = new Client();
const easyButtons = require(".");

// Only for one time while starting the entire project
easyButtons.attachToClient(client);

client.on("message", async (message) => {
  
  let args = message.content.split(" ");

  if (args[0] == `abc!testeasybuttons`) {

    const myButton = easyButtons.createButton(
      {
        // These are discord-button data.
        label: "Cool Button",
        style: "gray", // "blurple" or "gray" or "green" or "red"
        disabled: false,

        // With defer option button never gives 
        // "This interaction failed" message while
        // bot online.
        defer: true,
        // After 10 seconds of not clicking to buttons,
        // button automatically get disposed. For saving
        // memory.
        timeout: 10000
      }
    );

    
    // Creating a message text for later use.
    let msgText = "Click button to change button name to your name. (Button automatically gets disabled after 10 seconds of inactivity.)";
    
    // Creating a message with myButton.
    let msg = await message.channel.send(msgText, myButton);

    // Creating callback using onClick function
    // for updating button label with new clicker's
    // tag.
    myButton.callback.onClick((event) => {
      // Set muButton's new label to clicker's tag.
      myButton.label = event.clicker.user.tag;
      // And update message with new buttons.
      msg.edit(msgText, myButton)
    });

    // On timeout disable buttons.
    myButton.callback.onTimeout(() => {
      // Disable the myButton, soo people 
      // can't click it anymore.
      myButton.disabled = true;
      // And update message with new buttons.
      msg.edit(`${msgText} (Ended)`, myButton)
    });

    // Available callbacks: onClick(event, buttonCallback), onTimeout(buttonCallback), onDispose()
    
  }

});

client.login("<your token>");