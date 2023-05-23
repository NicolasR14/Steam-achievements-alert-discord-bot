const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list_locked_achievements')
		.setDescription('Lists achievements locked for you')
		.addStringOption(option =>
			option.setName('game_name')
				.setDescription('name of the game as you specified it (do /list_games)')
				.setRequired(true)),
	async execute(interaction, globalVariables) {
		const game_name = interaction.options.getString('game_name')
		const gameObject = globalVariables.Games.find(game => game.name === game_name)
		if (typeof gameObject === 'undefined') {
			await interaction.reply('Game not found!');
			return
		}
		if (!gameObject.guilds.includes(interaction.guildId)) {
			await interaction.reply('Game not in the guild list!');
			return
		}
		const userAuthor = globalVariables.Users.find(user => user.discord_id === interaction.user.id);
		if (typeof userAuthor === 'undefined') {
			await interaction.reply("You are not in players list. Use */addplayer* command")
			return
		}
		await gameObject.updateGlobalPercentage()
		gameObject.displayProgressionBar(interaction)
		gameObject.listLockedAchievements(userAuthor, interaction, globalVariables)
	}
};