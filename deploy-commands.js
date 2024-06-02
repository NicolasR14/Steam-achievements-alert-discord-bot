const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

function checkIfFileExists(filePath) {
	try {
		fs.accessSync(filePath, fs.constants.F_OK);
		return true;
	} catch (err) {
		return false;
	}
}

function createJsonFile(filePath, data) {
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

const defaultData = {
	users: {},
	games: {},
	guilds: {}
}

const defaultConfig = {
	API_Steam_key: "",
	clientId: "",
	guildId: "",
	discord_token: "",
	lang: "english"
}

filePath = 'src/data.json'
if (!checkIfFileExists(filePath)) {
	createJsonFile(filePath, defaultData);
	console.log(`${filePath} file created`);
}
else {
	console.log(`${filePath} already existing`);
}
filePath = 'config.json'
if (!checkIfFileExists(filePath)) {
	createJsonFile(filePath, defaultConfig);
	console.log(`${filePath} file created, please fill it`);
	return
}
else {
	console.log(`${filePath} already existing`);
}

const { clientId, guildId, discord_token } = require('./config.json');
if (clientId === "" || guildId === "" || discord_token === "") {
	console.log(`Please fill ./config.json`);
	return
}

const commands = [];
// Grab all the command files from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'src/commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	// Grab all the command files from the commands directory you created earlier
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			console.log(command.data)
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(discord_token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();