import sql from 'mssql';
import {config} from '../../config/config.js'

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

console.log("Starting...");
// connectAndQuery();

async function connect() {
    try {
        return poolConnection = await sql.connect(configDB);
        // console.log("Reading rows from the Table...");
        // var resultSet = await poolConnection.request().query(`SELECT TOP 20 pc.Name as CategoryName,
        //     p.name as ProductName 
        //     FROM [SalesLT].[ProductCategory] pc
        //     JOIN [SalesLT].[Product] p ON pc.productcategoryid = p.productcategoryid`);

        // console.log(`${resultSet.recordset.length} rows returned.`);

        // // output column headers
        // var columns = "";
        // for (var column in resultSet.recordset.columns) {
        //     columns += column + ", ";
        // }
        // console.log("%s\t", columns.substring(0, columns.length - 2));

        // // ouput row contents from default record set
        // resultSet.recordset.forEach(row => {
        //     console.log("%s\t%s", row.CategoryName, row.ProductName);
        // });
        // close connection only when we're certain application is finished
        // poolConnection.close();
    } catch (err) {
        console.error(err.message);
    }
}

async function getGamesAndUsers(){
    sql.connect(configDB)
    .then(async function(poolConnection) {
        var users = [];
        var games = [];
        await Promise.all([
            //get users
            new Promise(async function(resolve) {
                const usersRecordSet = await poolConnection.request().query(`SELECT * FROM [Users]`).recordset;
                console.log(usersRecordSet)
                // await Promise.all(usersRecordSet.map(async (user) => {
                //     const guilds = poolConnection.request().query(`SELECT GuildID FROM Guilds WHERE UserID='${user.DiscordID}'`).recordset
                //     console.log(guilds)
                //     // users.push(new User(user.SteamID,user.DiscordID,user.DiscordNickname))
                // }))
                resolve()
        })
        // ,
        // new Promise(async function(resolve) {
        //     var resultSet = await poolConnection.request().query(`SELECT *
        //     //     FROM [Games]`);
        //     console.log(resultSet)
        
        // })
    ])
        poolConnection.close();
        return users,games
    })
}

async function addGame(){
    await sql.connect(configDB)
    .then(poolConnection => {

        poolConnection.close();
    })
}

async function addUser(){
    await sql.connect(configDB)
    .then(poolConnection => {

        poolConnection.close();
    })
}

async function removeGame(){
    await sql.connect(configDB)
    .then(poolConnection => {

        poolConnection.close();
    })
}

async function removeUser(){
    await sql.connect(configDB)
    .then(poolConnection => {

        poolConnection.close();
    })
}

getGamesAndUsers()