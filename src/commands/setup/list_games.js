const { SlashCommandBuilder } = require('discord.js');

function list_games(guildId,games){
	var to_send = 'Games I listen to for new achievements :\n'
	games.forEach(g =>{
		if (g.guilds.includes(guildId)){
		  to_send+='\t'+g.name+', SteamID: '+g.id+'\n'
		}
	})
	return to_send
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list_games')
		.setDescription('Lists the games the bot listens to for new achievements'),
		
	async execute(interaction,globalVariables) {
		await interaction.reply(list_games(interaction.guildId,globalVariables.Games));
	},
};