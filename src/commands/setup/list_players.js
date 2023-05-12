const { SlashCommandBuilder } = require('discord.js');

function list_players(guildId,users){
	var to_send = `Players I listen to for new achievements\n`
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
		.setDescription('Lists the players the bot listens to for new achievements'),
		
	async execute(interaction,globalVariables) {
		await interaction.reply(list_players(interaction.guildId,globalVariables.Users));
	},
};