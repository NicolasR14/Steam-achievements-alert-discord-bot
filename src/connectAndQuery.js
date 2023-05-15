const sql = require('mssql') ;
const config = require('../config/config.json')
const {User} = require('../src/models/User')
// const {new_game,new_player,del_player,del_game} = require('./discord_in.js')

const configDB = {
    user: config.userDB, // better stored in an app setting such as process.env.DB_USER
    password: config.passwordDB, // better stored in an app setting such as process.env.DB_PASSWORD
    server: config.serverDB, // better stored in an app setting such as process.env.DB_SERVER
    port: config.portDB, // optional, defaults to 1433, better stored in an app setting such as process.env.DB_PORT
    database: config.database, // better stored in an app setting such as process.env.DB_NAME
    authentication: {
        type: 'default'
    },
    options: {
        encrypt: true
    }
}



class Game {
    constructor(name,id,guilds){
        this.id = id;
        this.name = name;
        this.guilds = guilds;
    }
}

async function getGamesAndUsers(){
    var users = [];
    var games = [];
    await sql.connect(configDB)
        .then(async function(poolConnection) {
            await Promise.all([
                //get users
                new Promise(async function(resolve) {
                    const usersRecordSet = await poolConnection.request().query(`SELECT * FROM Users;`).then(result => result.recordset);
                    await Promise.all(usersRecordSet.map(async (user) => {
                        const guildsRecordSet = await poolConnection.request().query(`SELECT GuildID FROM [Guilds.Users] WHERE UserID='${user.DiscordID}';`).then(result => result.recordset);
                        const guilds = guildsRecordSet.map(g => g.GuildID)
                        users.push(new User(user.SteamID,user.DiscordID,user.DiscordNickname,guilds))
                    }))
                    resolve()
                })
                ,
                new Promise(async function(resolve) {
                    const gamesRecordSet = await poolConnection.request().query(`SELECT * FROM Games;`).then(result => result.recordset);
                    await Promise.all(gamesRecordSet.map(async (game) => {
                        const guildsRecordSet = await poolConnection.request().query(`SELECT GuildID FROM [Guilds.Games] WHERE GameID='${game.AppID}';`).then(result => result.recordset);
                        const guilds = guildsRecordSet.map(g => g.GuildID)
                        games.push(new Game(game.Name,game.AppID,guilds))
                    }))
                    resolve()
                })
            ])
            poolConnection.close();
        }).catch (err => {
            console.error(err.message);
        })
    // console.table(users)
    // console.table(games)
    return [users,games]
}

async function addGame(message,games){
    await sql.connect(configDB)
    .then(async function(poolConnection) {
        const game_string = message.content.split(" ");
        const [gameName,gameID] = [game_string[1],game_string[2]]
        try{
        await poolConnection.request().query(`INSERT INTO [Games] VALUES ('${gameID}','${gameName}');`)
        }
        catch{
            console.log(`'${gameName}' already known in DB`)
        }
        await poolConnection.request().query(`INSERT INTO [Guilds.Games] VALUES ('${message.guildId}','${gameID}');`)
        games.push(new Game(gameName,gameID,[message.guildId]))
        poolConnection.close();
    }).catch (err => {
        console.error(err.message);
    })
}

async function addUserDB(DiscordID,SteamID,DiscordNickname,interaction,is_new_player){
    await sql.connect(configDB)
    .then(async function(poolConnection) {
        if(is_new_player){
            await poolConnection.request().query(`INSERT INTO [Users] VALUES ('${SteamID}','${DiscordNickname}','${DiscordID}');`)
        }
        await poolConnection.request().query(`INSERT INTO [Guilds.Users] VALUES ('${interaction.guildId}','${DiscordID}');`)
        poolConnection.close();
        await interaction.reply('Player added');
    }).catch (err => {
        console.error(err.message);
    })
}

async function removeGame(message,games){
    const game_string = message.content.split(" ");
    var gameID = false
    //Delete from games dictionnary
    games.forEach(game =>{
        if(game.name === game_string[1]){
            gameID = game.id
            if(!game.guilds.includes(message.guildId)){
                // del_game(2,message.channel)
                return
            }
            const index = game.guilds.indexOf(message.guildId);
            game.guilds.splice(index,1)
            // del_game(1,message.channel)
            return
        }
    })
    if(!gameID){
        // del_game(2,message.channel)
    }
    
    ////////////////ADD CONDITION IF GUILDS == 0 il faut delete
    //Delete in database
    await sql.connect(configDB)
    .then(async function(poolConnection) {
        await poolConnection.request().query(`DELETE FROM [Guilds.Games] WHERE GuildID='${message.guildId}' AND GameID='${gameID}';`)
        poolConnection.close();
    }).catch (err => {
        console.error(err.message);
    })
}

async function removePlayerDB(userDiscordId,guildId,nbGuildsUser){

    //Delete in database
    await sql.connect(configDB)
    .then(async function(poolConnection) {
        await poolConnection.request().query(`DELETE FROM [Guilds.Users] WHERE GuildID='${guildId}' AND UserID='${userDiscordId}';`)
        if(nbGuildsUser===1){
            await poolConnection.request().query(`DELETE FROM [Users] WHERE DiscordID='${userDiscordId}';`)
        }
        poolConnection.close();
    }).catch (err => {
        console.error(err.message);
    })
}

module.exports = {getGamesAndUsers,addGame,addUserDB,removeGame,removePlayerDB};