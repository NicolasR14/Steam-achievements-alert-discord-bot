const { SlashCommandBuilder } = require('discord.js');
const { addUserDB } = require('../../connectAndQueryJSON')
const { User } = require('../../models/User.js')
const { getAvatars, isPublicProfile } = require('../../steam_interface')


module.exports = {
	data: new SlashCommandBuilder()
		.setName('add_player')
		.setDescription('Add a new player to be listened to for new achievements')
		.addUserOption(option =>
			option.setName('player_mention')
				.setDescription('player mention')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('steam_user_id')
				.setDescription('the steam user id')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('nickname')
				.setDescription('the nickname you want to set for this player')
				.setRequired(true)),
	async execute(interaction, globalVariables) {
		const discord_id = interaction.options.getUser('player_mention').id
		const steam_id = interaction.options.getString('steam_user_id')
		const nickname = interaction.options.getString('nickname')
		var is_new_player = true;
		const statusProfile = await isPublicProfile(steam_id)
		if (statusProfile !== 1) {
			if (statusProfile === 0) {
				await interaction.reply(`${steam_id} is not public. Can't read infos.`)
			}
			else {
				await interaction.reply(`API Steam error. Please retry later.`)
			}
			return
		}
		for (var user of globalVariables.Users) {
			if (user.discord_id === discord_id) {
				is_new_player = false
				if (user.steam_id != steam_id) {
					await interaction.reply('User already in the DB but with another steam Id.')
					return
				}
				if (user.nickname != nickname) {
					await interaction.reply('User already in the DB but with another nickname.')
					return
				}
				if (user.guilds.includes(interaction.guildId)) {
					await interaction.reply('Player is already in the list')
					// resolve()
					return
				}
				user.guilds.push(interaction.guildId)
				break
			}
		}

		if (is_new_player) {
			globalVariables.Users.push(new User(steam_id, discord_id, nickname, [interaction.guildId]))
		}
		addUserDB(discord_id, steam_id, nickname, interaction, is_new_player)
			.then(() => {
				var userObject = globalVariables.Users.find(user => user.discord_id === discord_id)
				getAvatars([userObject])
				userObject.getPlaytime(globalVariables.Games)
				globalVariables.Games.map(game => game.updateAchievements(userObject, globalVariables.t_0))
			})
	}
}