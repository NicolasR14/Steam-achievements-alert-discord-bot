const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('display_new_achievements_here')
		.setDescription('Sets the channel as the channel where new achievements are displayed'),
		
	async execute(interaction,globalVariables) {
		await interaction.reply('New achievements will be displayed in this channel !');
        globalVariables.Guilds.forEach(guild =>{
            if(guild.id === interaction.guildId){
            guild.channel_id = interaction.channelId;
            guild.channel = interaction.channel;
            }
        })
        console.table(globalVariables.Guilds)
	},
};