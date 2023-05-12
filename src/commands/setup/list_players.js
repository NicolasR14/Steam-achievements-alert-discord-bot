const { SlashCommandBuilder } = require('discord.js');

function list_players(guildId,users){
	var to_send = `List of players in this server:\n`
	users.forEach(u =>{
	  if (u.guilds.includes(guildId)){
		to_send+='\t'+u.discord_id+', SteamID: '+u.steam_id+', Nickname: '+u.nickname+'\n'
	  }
	})
	return to_send
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list_players')
		.setDescription('List the games where the new achievements are listened and available for compare commands'),
		
	async execute(interaction,globalVariables) {
		await interaction.reply(list_players(interaction.guildId,globalVariables.Users));
	},
};