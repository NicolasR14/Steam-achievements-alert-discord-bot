// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { discord_token } = require('./config.json');
// const { getGamesAndUsers } = require('./src/connectAndQueryMSSQL.js')
const { getInfosDB } = require('./src/connectAndQueryJSON.js')
const { getAvatars, listenForNewAchievements } = require('./src/steam_interface.js')
const { Guild } = require('./src/models/Guild.js')


// Create a new client instance
const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages,
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.GuildMembers]
});

var globalVariables = {
	'Guilds': [],
	'Users': [],
	'Games': [],
	't_lookback': parseInt((Date.now() - 600000) / 1000)
	// 't_lookback': parseInt(1717037679)
}


client.once(Events.ClientReady, async c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
	globalVariables.Guilds = client.guilds.cache.map(guild => new Guild(guild.id));
	[globalVariables.Users, globalVariables.Games] = await getInfosDB(globalVariables.Guilds, client);
	getAvatars(globalVariables.Users) //to get avatars for each players

	await Promise.all([await Promise.all(globalVariables.Games.map(async game => {
		await Promise.all(globalVariables.Users.map(async user => {
			{
				await game.updateAchievements(user, globalVariables.t_lookback, start = true)
			}
		}))
		if (game.realName == '') {
			await game.getRealName()
		}
	})),

	await Promise.all(globalVariables.Users.map(async user => {
		await user.getPlaytime(globalVariables.Games)
	}))
	])

	console.table(globalVariables.Users)
	console.table(globalVariables.Games)
	console.table(globalVariables.Guilds)
	console.log("Games stats updated")

	listenForNewAchievements(globalVariables);
});

// Log in to Discord with your client's token
client.login(discord_token);

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'src/commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		console.log(`Commande executée : ${interaction.commandName}, ${Date.now()}`)
		await command.execute(interaction, globalVariables);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});
