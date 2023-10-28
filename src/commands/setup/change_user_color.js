const { SlashCommandBuilder } = require('discord.js');
const { changeColorDB } = require('../../connectAndQueryJSON')
const { User } = require('../../models/User.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('change_color_player')
        .setDescription('Change the color for a player (format : #FFFFFF)')
        .addUserOption(option =>
            option.setName('player_mention')
                .setDescription('player mention')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('the color (format : #FFFFFF)')
                .setRequired(true)),
    async execute(interaction, globalVariables) {
        const discord_id = interaction.options.getUser('player_mention').id
        const color = interaction.options.getString('color')

        let Reg_Exp = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i;
        if (!Reg_Exp.test(color)) {
            await interaction.reply('Wrong color code. Please use format : #FFFFFF')
            return
        }
        var userObject = globalVariables.Users.find(user => user.discord_id === discord_id)

        if (userObject) {
            userObject.color = color
            await interaction.reply('Player color updated')
            return
        }
        await interaction.reply('Error occurred')
    }
}