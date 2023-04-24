import {new_game,new_player,del_player,del_game} from './discord_interface.js'
import {csvAppend} from "csv-append";
import fs from 'fs';


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


//Get infos from games.csv & users.csv
async function get_games_users_dict(path_users,path_games){
var users = [];
var games = [];
await Promise.all([
    new Promise((resolve) => {
        //Parsing
        const csv = fs.readFileSync(path_users)
        var array = csv.toString().replace(/(?:\\[r]|[\r]+)+/g, "");
        array = array.split("\n");
        for (let i = 1; i < array.length - 1; i++) {
            const row = array[i].split(",")
            if (!row[1] | !row[2] | !row[3]){
                throw 'Missing arguments for '+row[0]+' in users.csv'
            }
            else {
                //Write dictionnary
                console.log(row[0])
                users.push(new User(row[0],row[1],row[2],row[3].split(";")))
                // user_dict[row[0]] = {'id':row[1],'name':row[2]}
            }
        }
        resolve()
    })
    
    ,
    new Promise((resolve) => {
        //Parsing
        const csv = fs.readFileSync(path_games)
        var array = csv.toString().replace(/(?:\\[r]|[\r]+)+/g, "");
        array = array.split("\n");
        for (let i = 1; i < array.length - 1; i++) {
            const row = array[i].split(",")
            if (!row[1]){
                console.error('Missing argument for '+row[0]+' in games.csv')
            }
            else{
                //Write dictionnary
                games.push(new Game(row[0],parseInt(row[1]),row[2].split(";")))
            // games_dict[row[0]] = parseInt(row[1])
            }
        }
        resolve()
    })
    ])
.catch(function(err){
    console.log('Wrong games.csv or users.csv format !')
    console.log(err)
})
// console.log(users)
return [users,games]
}

//Add a game to games list
async function add_game(message,path_games,games){
    const game_string = message.content.split(" ");
    const [name,id] = [game_string[1],parseInt(game_string[2])]
    if(!game_string[1] || !game_string[2] || game_string[3]){
        new_game(0,message.channel)
        return
    }
    if(isNaN(game_string[2])){
        new_game(0,message.channel)
        return
    }
    var find = false;
    games.forEach(game => {
        if(game.name === name && game.id != id){
            find = true
            new_game(3,message.channel)
            return
        }
        if(game.id === id){
            find = true
            if(game.guilds.includes(message.guildId)){
                new_game(2,message.channel)
                return
            }
            game.guilds.push(message.guildId)
            new_game(1,message.channel)
            return
        }
    })
        
    if(!find){
        games.push(new Game(name,id,[message.guildId]))
        new_game(1,message.channel)
    }
    write_games_dict(games,path_games)
    
}

function write_games_dict(games,path_games){
    var csvString = "name,id,guilds\n";
    games.forEach(game => {
        console.log(game)
        csvString += game.name + ',' + game.id + ',' + game.guilds.join(';') + "\n"
    })
    fs.writeFile(path_games,csvString,{
        encoding: 'utf8',
        flag: 'w'
    }, (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
    console.log('Games list :',games);
}

function write_users_dict(users,path_users){
    var csvString = "steam_id,discord_id,nickname,guilds\n";
    users.forEach(user => {
        csvString += user.steam_id + ',' + user.discord_id + ',' + user.nickname + ',' + user.guilds.join(';') + "\n"
    })
    console.log(csvString)
    fs.writeFile(path_users,csvString,{
        encoding: 'utf8',
        flag: 'w'
    }, (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
    console.log('Users list:',users)
}

//Add a player to users list
async function add_user(message,path_users,users){
    const user_string = message.content.split(" ");
    const [discord_id,steam_id,nickname] = [user_string[1],user_string[2],user_string[3]]
    if(!user_string[1] || !user_string[2] || !user_string[3]){
        new_player(0,message.channel)
        return
    }
    if(isNaN(user_string[2]) | !user_string[1].startsWith('<@')){
        new_player(0,message.channel)
        return
    }

    var is_new_player = true;
    users.forEach(user => {
        if(user.discord_id === discord_id && ((user.steam_id != steam_id) || (user.nickname != nickname))){
            find = true
            new_player(3,message.channel)
            return
        }
        if(user.steam_id === steam_id){
            is_new_player = false
            if(user.guilds.includes(message.guildId)){
                new_player(2,message.channel)
                return
            }
            new_player(1,message.channel)
            user.guilds.push(message.guildId)
        }
    })
    if (is_new_player){
        new_player(1,message.channel)
        users.push(new User(steam_id,discord_id,nickname,[message.guildId]))
    }

    write_users_dict(users,path_users)
}

//Remove a player from users list
async function remove_user(message,path_users_dict,users){
    const user_string = message.content.split(" ");
    if(user_string.length != 2){
        del_player(0,message.channel)
        return
    } 
    if(!user_string[1].startsWith('<@')){
        del_player(0,message.channel)
        return
    }

    var find = false
    users.forEach(user =>{
        if(user.discord_id === user_string[1]){
            find = true
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
    if(!find){
        del_player(2,message.channel)
    }
    write_users_dict(users,path_users_dict)

}

//Remove a game from games list
async function remove_game(message,path_games_dict,games){
    const game_string = message.content.split(" ");
    if(game_string.length != 2){
        del_game(0,message.channel)
        return
    }
    var find = false;
    games.forEach(game =>{
        if(game.name === game_string[1]){
            find = true
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
    if(!find){
        del_game(2,message.channel)
    }
    write_users_dict(games,path_games_dict)

}

export {get_games_users_dict,add_game,add_user,remove_user,remove_game};