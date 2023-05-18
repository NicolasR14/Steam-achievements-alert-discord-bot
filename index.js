// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Client,Collection, Events, GatewayIntentBits } = require('discord.js');
const { discord_token } = require('./config/config.json');
const {getGamesAndUsers} = require('./src/connectAndQuery.js')
const {getAvatars,listenForNewAchievements} = require('./src/steam_interface.js')

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.GuildMembers] });

class Guild {
  constructor(guild_id){
    this.id = guild_id;
    this.channel_id;
    this.channel;
  }
}

var globalVariables = {
	'Guilds':[],
	'Users':[],
	'Games':[]
}

client.once(Events.ClientReady, async c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
	globalVariables.Guilds = client.guilds.cache.map(guild => new Guild(guild.id));
  	[globalVariables.Users,globalVariables.Games] = await getGamesAndUsers();
	console.table(globalVariables.Users)
	console.table(globalVariables.Games)
  	getAvatars(globalVariables.Users) //to get avatars for each players
  	listenForNewAchievements(globalVariables,t_0);
});

// Log in to Discord with your client's token
client.login(discord_token);
// import {compare_message, list_games, list_players,help} from './src/discord_in.js'

//const t_0 = parseInt(Date.now()/1000);
const t_0 = parseInt(1683531420000/1000);

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
		await command.execute(interaction,globalVariables);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

	//TO DO
    //Quand on démarre faut que ça update pour tous les jeux et tous les joueurs
    //Quand on ajoute un joueur il faut que ça update pour lui pour tous les jeux enregistrés
    //Quand on ajoute un jeu on update sur tous les joueurs.
    //Quand on delete un joueur faut delete les valeurs d'achievements résiduelles dans tous les jeux (non prioritaire)

	//Update compare function
//   if(message.content.startsWith('!tcompare ')){
//     compare_message(message,Games,Users,API_Steam_key)
//     return
//   }
