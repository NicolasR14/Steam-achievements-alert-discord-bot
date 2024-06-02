const { SlashCommandBuilder } = require('discord.js');

function list_games(guildId, games) {
	let data = games.filter(g => g.guilds.includes(guildId)).map(g => [g.realName, g.id, ((([g.name, ...g.aliases]).join(',')).length > 90) ? ((([g.name, ...g.aliases]).join(',')).slice(0, 85)) : (([g.name, ...g.aliases]).join(','))])
	data = [['Name', 'Steam ID', 'Reference & Aliases'], ['', '', ''], ...data]
	let colWidths = data[0].map((_, colIndex) => {
		return Math.max(...data.map(row => row[colIndex].length));
	});
	let messages = [];
	let message = `\`\`\`\n`
	let row;

	for (let i = 0; i < data.length; i++) {
		const game = data[i]
		row = game.map((item, colIndex) => {
			return item.padEnd(colWidths[colIndex], ' ');
		}).join('\t');
		if ((message + row).length < 1980) {
			message += '\n' + row
		}
		else {
			messages.push(`${message}\n\`\`\``)
			message = `\`\`\`\n` + row
		}
		if (i === data.length - 1) {
			messages.push(`${message}\n\`\`\``)
		}
	}
	return messages
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list_games')
		.setDescription('Lists the games the bot listens to for new achievements'),

	async execute(interaction, globalVariables) {
		const messages = list_games(interaction.guildId, globalVariables.Games);
		for (let i = 0; i < messages.length; i++) {
			if (i == 0) {
				await interaction.reply(`Games I listen to for new achievements :${messages[i]}`);
			}
			else {
				interaction.channel.send(messages[i])
			}
		}
	},
};