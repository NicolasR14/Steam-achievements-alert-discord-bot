const { SlashCommandBuilder } = require('discord.js');
const { addGameDB } = require('../../connectAndQuery')
const { Game } = require('../../models/Game.js')


module.exports = {
	data: new SlashCommandBuilder()
		.setName('add_game')
		.setDescription('Add a new game to the list')
		.addStringOption(option =>
			option.setName('game_id')
				.setDescription('the steam game id')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('name')
				.setDescription('the name you want to set for this game')
				.setRequired(true)),
	async execute(interaction, globalVariables) {
		const game_id = interaction.options.getString('game_id')
		const game_name = interaction.options.getString('name')
		//Check if the game id is good
		//...
		//TO DO
		//////
		var find = false;
		for (var game of globalVariables.Games) {
			if (game.id === game_id) {
				find = true
				if (game.name != game_name) {
					await interaction.reply('Game already in the list on another name. Please check the games list and remove it before adding it again with another name.')
					return
				}
				if (game.guilds.includes(interaction.guildId)) {
					await interaction.reply('Game already in the list.')
					return
				}
				game.guilds.push(interaction.guildId)
				break;
			}
		}
		if (!find) {
			globalVariables.Games.push(new Game(game_name, game_id, [interaction.guildId]))
		}
		addGameDB(interaction, game_id, game_name, find)
		var gameObject = globalVariables.Games.find(game => game.id === game_id)
		globalVariables.Users.map(async user => {
			user.getPlaytime(globalVariables.Games)
			gameObject.updateAchievements(user, t_0)
		})
	}
}