const { ButtonBuilder, ButtonStyle } = require('discord.js');
const backButton = new ButtonBuilder({
  style: ButtonStyle.Secondary,
  label: 'Back',
  emoji: '⬅️',
  customId: 'back'
})
const forwardButton = new ButtonBuilder({
  style: ButtonStyle.Secondary,
  label: 'Forward',
  emoji: '➡️',
  customId: 'forward'
})

module.exports = { backButton, forwardButton };