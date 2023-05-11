import {ButtonBuilder} from 'discord.js';
const backButton = new ButtonBuilder({
          style: 'SECONDARY',
          label: 'Back',
          emoji: '⬅️',
          customId: 'back'
        })
const forwardButton = new ButtonBuilder({
      style: 'SECONDARY',
      label: 'Forward',
      emoji: '➡️',
      customId: 'forward'
    })

export {backButton,forwardButton};