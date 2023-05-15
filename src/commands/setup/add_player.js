const { SlashCommandBuilder } = require('discord.js');
const {addUserDB} = require('../../connectAndQuery')
const {User} = require('../../models/User.js')
const {getAvatars} = require('../../steam_interface')


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
	async execute(interaction,globalVariables) {
		const discord_id = interaction.options.getUser('player_mention').id
		const steam_id = interaction.options.getString('steam_user_id')
		const nickname = interaction.options.getString('nickname')
		var is_new_player = true;
		await new Promise(async (resolve) =>{
			for (var user of globalVariables.Users){
				if(user.discord_id === discord_id){
					is_new_player = false
					console.log(discord_id)
					if(user.guilds.includes(interaction.guildId)){
						await interaction.reply('Player is already in the list')
						// resolve()
						return
					}
					user.guilds.push(interaction.guildId)
					break
				}
			}


			if (is_new_player){
				globalVariables.Users.push(new User(steam_id,discord_id,nickname,[interaction.guildId]))
			}
			addUserDB(discord_id,steam_id,nickname,interaction,is_new_player)
				.then(()=>{
					getAvatars([globalVariables.Users.find(user => user.discord_id === discord_id)])
					// resolve()
					})
				})			
		}
}