const sql = require('mssql');
const fs = require('node:fs');
const data_path = 'src/data.json'
const { User } = require('./models/User')
const { Game } = require('./models/Game')

async function getGamesAndUsers() {
    var users = [];
    var games = [];
    const jsonData = fs.readFileSync(data_path);
    const data = JSON.parse(jsonData);
    try {
        Object.entries(data.users).forEach(([DiscordID, user]) => {
            users.push(new User(user.SteamID, DiscordID, user.DiscordNickname, user.Guilds))
        })
        Object.entries(data.games).forEach(([AppID, game]) => {
            games.push(new Game(game.Name, AppID, game.Guilds))
        })
    } catch {
        console.error("Error while reading data.json")
    }
    return [users, games]
}


async function addGameDB(interaction, game_id, game_name, find) {

    try {
        const jsonData = fs.readFileSync(data_path);
        const data = JSON.parse(jsonData);
        let guilds = []
        if (Object.keys(data.games).includes(game_id)) {
            guilds = data.games[game_id].Guilds
        }
        guilds.push(interaction.guildId)
        data.games[game_id] = {
            "Name": game_name,
            "Guilds": guilds
        }
        fs.writeFileSync(data_path, JSON.stringify(data));
        await interaction.reply('Game added');
    } catch (error) {
        console.error(error.message);
        await interaction.reply('Error');
    }
}

async function addUserDB(DiscordID, SteamID, DiscordNickname, interaction, is_new_player) {

    try {
        const jsonData = fs.readFileSync(data_path);
        const data = JSON.parse(jsonData);
        let guilds = []
        if (Object.keys(data.users).includes(DiscordID)) {
            guilds = data.users[DiscordID].Guilds
        }
        guilds.push(interaction.guildId)
        data.users[DiscordID] = {
            "SteamID": SteamID,
            "DiscordNickname": DiscordNickname,
            "Guilds": guilds
        }
        fs.writeFileSync(data_path, JSON.stringify(data));
        await interaction.reply('User added');
    } catch (error) {
        console.error(error.message);
        await interaction.reply('Error');
    }
}

async function removeGameDB(gameID, guildId, nbGuildsGame, interaction) {

    try {
        const jsonData = fs.readFileSync(data_path);
        const data = JSON.parse(jsonData);
        if (nbGuildsGame === 1) {
            delete data.games[gameID]
        }
        else {
            data.games[gameID].Guilds = data.games[gameID].Guilds.filter(function (guild) { return guild != guildId })
        }
        fs.writeFileSync(data_path, JSON.stringify(data));
        await interaction.reply('Game removed');
    } catch (error) {
        console.error(error.message);
        await interaction.reply('Error');
    }
}

async function removePlayerDB(userDiscordId, guildId, nbGuildsUser, interaction) {

    try {
        const jsonData = fs.readFileSync(data_path);
        const data = JSON.parse(jsonData);
        if (nbGuildsUser === 1) {
            delete data.users[userDiscordId]
        }
        else {
            data.users[userDiscordId].Guilds = data.users[userDiscordId].Guilds.filter(function (guild) { return guild != guildId })
        }
        fs.writeFileSync(data_path, JSON.stringify(data));
        await interaction.reply('User removed');
    } catch (error) {
        console.error(error.message);
        await interaction.reply('Error');
    }
}

module.exports = { getGamesAndUsers, addGameDB, addUserDB, removeGameDB, removePlayerDB };