const sql = require('mssql');
const config = require('../config.json')
const { User } = require('../src/models/User')
const { Game } = require('../src/models/Game')

const configDB = {
    user: config.userDB,
    password: config.passwordDB,
    server: config.serverDB,
    port: config.portDB,
    database: config.database,
    authentication: {
        type: 'default'
    },
    options: {
        encrypt: true
    }
}

async function getGamesAndUsers() {
    var users = [];
    var games = [];
    await sql.connect(configDB)
        .then(async function (poolConnection) {
            await Promise.all([
                //get users
                new Promise(async function (resolve) {
                    const usersRecordSet = await poolConnection.request().query(`SELECT * FROM Users;`).then(result => result.recordset);
                    await Promise.all(usersRecordSet.map(async (user) => {
                        const guildsRecordSet = await poolConnection.request().query(`SELECT GuildID FROM [Guilds.Users] WHERE UserID='${user.DiscordID}';`).then(result => result.recordset);
                        const guilds = guildsRecordSet.map(g => g.GuildID)
                        users.push(new User(user.SteamID, user.DiscordID, user.DiscordNickname, guilds))
                    }))
                    resolve()
                })
                ,
                new Promise(async function (resolve) {
                    const gamesRecordSet = await poolConnection.request().query(`SELECT * FROM Games;`).then(result => result.recordset);
                    await Promise.all(gamesRecordSet.map(async (game) => {
                        const guildsRecordSet = await poolConnection.request().query(`SELECT GuildID FROM [Guilds.Games] WHERE GameID='${game.AppID}';`).then(result => result.recordset);
                        const guilds = guildsRecordSet.map(g => g.GuildID)
                        games.push(new Game(game.Name, game.AppID, guilds))
                    }))
                    resolve()
                })
            ])
            poolConnection.close();
        }).catch(err => {
            console.error(err.message);
        })
    return [users, games]
}

async function addGameDB(interaction, game_id, game_name, find) {
    await sql.connect(configDB)
        .then(async function (poolConnection) {
            if (!find) {
                await poolConnection.request().query(`INSERT INTO [Games] VALUES ('${game_id}','${game_name}');`)
            }
            await poolConnection.request().query(`INSERT INTO [Guilds.Games] VALUES ('${interaction.guildId}','${game_id}');`)
            poolConnection.close();
            await interaction.reply('Game added');
        }).catch(err => {
            console.error(err.message);
        })
}

async function addUserDB(DiscordID, SteamID, DiscordNickname, interaction, is_new_player) {
    await sql.connect(configDB)
        .then(async function (poolConnection) {
            if (is_new_player) {
                await poolConnection.request().query(`INSERT INTO [Users] VALUES ('${SteamID}','${DiscordNickname}','${DiscordID}');`)
            }
            await poolConnection.request().query(`INSERT INTO [Guilds.Users] VALUES ('${interaction.guildId}','${DiscordID}');`)
            poolConnection.close();
            await interaction.reply('Player added');
        }).catch(err => {
            console.error(err.message);
        })
}

async function removeGameDB(gameID, guildId, nbGuildsGame, interaction) {

    //Delete in database
    await sql.connect(configDB)
        .then(async function (poolConnection) {
            await poolConnection.request().query(`DELETE FROM [Guilds.Games] WHERE GuildID='${guildId}' AND GameID='${gameID}';`)
            if (nbGuildsGame === 1) {
                await poolConnection.request().query(`DELETE FROM [Games] WHERE AppID='${gameID}';`)
            }
            poolConnection.close();
            await interaction.reply(`Game removed from the games list!`);
        }).catch(err => {
            console.error(err.message);
        })
}

async function removePlayerDB(userDiscordId, guildId, nbGuildsUser, interaction) {

    //Delete in database
    await sql.connect(configDB)
        .then(async function (poolConnection) {
            await poolConnection.request().query(`DELETE FROM [Guilds.Users] WHERE GuildID='${guildId}' AND UserID='${userDiscordId}';`)
            if (nbGuildsUser === 1) {
                await poolConnection.request().query(`DELETE FROM [Users] WHERE DiscordID='${userDiscordId}';`)
            }
            poolConnection.close();
            await interaction.reply(`Player removed from the users list!`);
        }).catch(err => {
            console.error(err.message);
        })
}

module.exports = { getGamesAndUsers, addGameDB, addUserDB, removeGameDB, removePlayerDB };