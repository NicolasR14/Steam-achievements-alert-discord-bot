const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list_locked_achievements')
		.setDescription('Lists achievements locked for you')
		.addStringOption(option =>
			option.setName('game_name')
				.setDescription('name of the game as you specified it (do /list_games)')
				.setRequired(true))
		.addUserOption(option =>
			option.setName('player_mention1')
				.setDescription('mention a player if you want to includes its locked achievements')
				.setRequired(false))
		.addUserOption(option =>
			option.setName('player_mention2')
				.setDescription('mention a player if you want to includes its locked achievements')
				.setRequired(false))
		.addUserOption(option =>
			option.setName('player_mention3')
				.setDescription('mention a player if you want to includes its locked achievements')
				.setRequired(false)),
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

		var other_users = [];

		for (const player_mention of ['player_mention1', 'player_mention2', 'player_mention3']) {
			const mention = interaction.options.getUser(player_mention)
			if (mention != null) {
				if (mention.id === interaction.user.id) {
					break;
				}
				const user = globalVariables.Users.find(user => user.discord_id === mention.id && user.guilds.includes(interaction.guildId))
				if (typeof user === 'undefined') {
					break;
				}
				other_users.push(user)

			}
		}

		await gameObject.updateGlobalPercentage()
		gameObject.displayProgressionBar(interaction)
		gameObject.listLockedAchievements(userAuthor, interaction, globalVariables, other_users)
	}
};