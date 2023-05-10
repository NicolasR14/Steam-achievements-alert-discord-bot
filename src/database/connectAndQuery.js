import sql from 'mssql';
import {config} from '../../config/config.js'
import {new_game,new_player,del_player,del_game} from '../discord_in.js'

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

class User {
    constructor(steam_id,discord_id,nickname,guilds){
      this.steam_id = steam_id;
      this.discord_id= discord_id;
      this.nickname = nickname;
      this.a_dis = [];
      this.guilds = guilds;
      this.avatar;
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

async function addUser(message,users){
    await sql.connect(configDB)
    .then(async function(poolConnection) {
        const user_string = message.content.split(" ");
        const [DiscordID,SteamID,DiscordNickname] = [user_string[1],user_string[2],user_string[3]]
        try{
            await poolConnection.request().query(`INSERT INTO [Users] VALUES ('${SteamID}','${DiscordID}','${DiscordNickname}');`)
        }
        catch{
            console.log(`'${DiscordNickname}' already known in DB`)
        }
        await poolConnection.request().query(`INSERT INTO [Guilds.Users] VALUES ('${message.guildId}','${DiscordID}');`)
        users.push(new User(SteamID,DiscordID,DiscordNickname,[message.guildId]))
        poolConnection.close();
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
                del_game(2,message.channel)
                return
            }
            const index = game.guilds.indexOf(message.guildId);
            game.guilds.splice(index,1)
            del_game(1,message.channel)
            return
        }
    })
    if(!gameID){
        del_game(2,message.channel)
    }
    
    //Delete in database
    await sql.connect(configDB)
    .then(async function(poolConnection) {
        await poolConnection.request().query(`DELETE FROM [Guilds.Games] WHERE GuildID='${message.guildId}' AND GameID='${gameID}';`)
        poolConnection.close();
    }).catch (err => {
        console.error(err.message);
    })
}

async function removeUser(message,users){
    const user_string = message.content.split(" ");
    var userID = false
    //Delete from games dictionnary
    users.forEach(user =>{
        if(user.discord_id === user_string[1]){
            userID = user.discord_id
            if(!user.guilds.includes(message.guildId)){
                del_player(2,message.channel)
                return
            }
            const index = user.guilds.indexOf(message.guildId);
            user.guilds.splice(index,1)
            del_player(1,message.channel)
            return
        }
    })
    if(!userID){
        del_player(2,message.channel)
    }
    
    //Delete in database
    await sql.connect(configDB)
    .then(async function(poolConnection) {
        await poolConnection.request().query(`DELETE FROM [Guilds.Users] WHERE GuildID='${message.guildId}' AND UserID='${userID}';`)
        poolConnection.close();
    }).catch (err => {
        console.error(err.message);
    })
}

export {getGamesAndUsers,addGame,addUser,removeGame,removeUser};