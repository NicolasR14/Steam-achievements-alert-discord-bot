// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Client,Collection, Events, GatewayIntentBits } = require('discord.js');
const { discord_token,API_Steam_key } = require('./config/config.json');
const {getGamesAndUsers} = require('./src/connectAndQuery.js')

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

class Guild {
  constructor(guild_id,channel_id){
    this.id = guild_id;
    this.channel_id = channel_id;
    this.channel;
  }
}

var globalVariables = {
	'Guilds':[],
	'Users':[],
	'Games':[]
}

// var Guilds;
// var Users;
// var Games;

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, async c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
	globalVariables.Guilds = client.guilds.cache.map(guild => new Guild(guild.id));
  	[globalVariables.Users,globalVariables.Games] = await getGamesAndUsers();
  // console.table(Users)
  // console.table(Games)
  // await get_avatars(API_Steam_key,Users) //to get avatars for each players
  // listen_achievements(Guilds,Users,Games,API_Steam_key,t_0);
});

// Log in to Discord with your client's token
client.login(discord_token);

// import pkg from 'discord.js';
// const { Client, Intents, Collection, Events, GatewayIntentBits, Partials } = pkg;
// import { get_avatars,listen_achievements} from './src/steam_in.js'
// import {compare_message, list_games, list_players,help} from './src/discord_in.js'
// // import { print_compare, neverPlayed } from "./discord_out.js";
// // import {get_games_users_dict,add_game,add_user,remove_user,remove_game} from './src/dict_in-out.js'
// import {getGamesAndUsers,addGame,addUser,removeGame,removeUser} from './src/database/connectAndQuery.js'
// import {config} from './config/config.js'
// import fs from 'node:fs';
// import path from 'node:path';

// const client = new Client({ intents: [GatewayIntentBits.Guilds], partials: [Partials.Channel] });
//const t_0 = parseInt(Date.now()/1000);
const t_0 = parseInt(1683142271000/1000);
// const token = config.discord_token //Discord bot token

// const API_Steam_key = config.API_Steam_key //Steam API key

// const path_games_dict = './config/games.csv'
// const path_users_dict = './config/users.csv'


// client.once('ready', () => {
//   console.log('up as ',`${client.user.tag}`);
//   Guilds = client.guilds.cache.map(guild => new Guild(guild.id));
//   init()
// });
// // client.login(token);

// async function init() {
//   [Users,Games] = await getGamesAndUsers(path_users_dict,path_games_dict);
//   console.table(Users)
//   console.table(Games)
//   await get_avatars(API_Steam_key,Users) //to get avatars for each players
//   listen_achievements(Guilds,Users,Games,API_Steam_key,t_0);
// }

//////////TEST
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


//////////TEST

// //App reaction to posts in a discord channel
// client.rest.on("messageCreate", message => {
//   if(message.content === "!ton"){
//     Guilds.forEach(guild =>{
//       if(guild.id === message.guildId){
//         guild.channel_id = message.channelId;
//         guild.channel = message.channel;
//       }
//     })
//     console.table(Guilds)
    
//     return
//   }
//   if(message.content.startsWith('!tcompare ')){
//     compare_message(message,Games,Users,API_Steam_key)
//     return
//   }
//   if(message.content.startsWith('!taddgame ')){
//     addGame(message,Games)
//     return
//   }
//   if(message.content.startsWith('!taddplayer ')){
//     async function _add_user(){
//       await addUser(message,Users);
//       // [users, games] = await get_games_users_dict(path_users_dict,path_games_dict);
//       get_avatars(API_Steam_key,Users);

//     }
//     _add_user()
//     console.table(Users)
//     return
//   }
//   if(message.content.startsWith('!tremovegame ')){
//     removeGame(message,Games)
//     return
//   }
//   if(message.content.startsWith('!tremoveplayer ')){
//     removeUser(message,Users)
//     return
//   }
//   if(message.content==='!tlistplayers'){
//     list_players(Users,message)
//     return
//   }
//   if(message.content==='!tlistgames'){
//     list_games(Games,message)
//     return
//   }
//   if(message.content==='!thelp'){
//     help(message.channel)
//     return
//   }

// })


