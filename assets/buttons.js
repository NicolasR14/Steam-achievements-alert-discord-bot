import { MessageAttachment , MessageEmbed,MessageActionRow, MessageButton} from 'discord.js';
const backButton = new MessageButton({
          style: 'SECONDARY',
          label: 'Back',
          emoji: '⬅️',
          customId: 'back'
        })
const forwardButton = new MessageButton({
      style: 'SECONDARY',
      label: 'Forward',
      emoji: '➡️',
      customId: 'forward'
    })

export {backButton,forwardButton};