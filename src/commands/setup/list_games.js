const { SlashCommandBuilder } = require('discord.js');

function list_games(guildId, games) {
	var header = 'Games I listen to for new achievements :\n'
	let data = games.filter(g => g.guilds.includes(guildId)).map(g => [g.realName, g.id, [g.name, ...g.aliases].join(',')])
	data = [['Name', 'Steam ID', 'Reference & Aliases'], ['', '', ''], ...data]
	let colWidths = data[0].map((_, colIndex) => {
		return Math.max(...data.map(row => row[colIndex].length));
	});

	let formattedLines = data.map(row => {
		return row.map((item, colIndex) => {
			return item.padEnd(colWidths[colIndex], ' ');
		}).join('    ');
	}).join('\n');

	return `${header}\`\`\`\n${formattedLines}\n\`\`\``
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list_games')
		.setDescription('Lists the games the bot listens to for new achievements'),

	async execute(interaction, globalVariables) {
		await interaction.reply(list_games(interaction.guildId, globalVariables.Games));
	},
};