import { Client, Intents} from 'discord.js';
import { get_avatars,listen_achievements} from './src/steam_in.js'
import {compare_message, list_games, list_players,help} from './src/discord_in.js'
// import { print_compare, neverPlayed } from "./discord_out.js";
// import {get_games_users_dict,add_game,add_user,remove_user,remove_game} from './src/dict_in-out.js'
import {getGamesAndUsers,addGame,addUser,removeGame,removeUser} from './src/database/connectAndQuery.js'
import {config} from './config/config.js'

const client = new Client({ intents: [Intents.FLAGS.GUILDS,Intents.FLAGS.DIRECT_MESSAGES,Intents.FLAGS.GUILD_MESSAGES,Intents.FLAGS.GUILDS] });
//const t_0 = parseInt(Date.now()/1000);
const t_0 = parseInt(1683142271000/1000);
const token = config.discord_token //Discord bot token

const API_Steam_key = config.API_Steam_key //Steam API key

const path_games_dict = './config/games.csv'
const path_users_dict = './config/users.csv'

class Guild {
  constructor(guild_id,channel_id){
    this.id = guild_id;
    this.channel_id = channel_id;
    this.channel;
  }
}

var Guilds;
var Users;
var Games;
client.once('ready', () => {
  console.log('up as ',`${client.user.tag}`);
  Guilds = client.guilds.cache.map(guild => new Guild(guild.id));
  init()
});
client.login(token);

async function init() {
  [Users,Games] = await getGamesAndUsers(path_users_dict,path_games_dict);
  console.table(Users)
  console.table(Games)
  await get_avatars(API_Steam_key,Users) //to get avatars for each players
  listen_achievements(Guilds,Users,Games,API_Steam_key,t_0);
}

//App reaction to posts in a discord channel
client.on("messageCreate", message => {
  if(message.content === "!ton"){
    Guilds.forEach(guild =>{
      if(guild.id === message.guildId){
        guild.channel_id = message.channelId;
        guild.channel = message.channel;
      }
    })
    console.table(Guilds)
    
    return
  }
  if(message.content.startsWith('!tcompare ')){
    compare_message(message,Games,Users,API_Steam_key)
    return
  }
  if(message.content.startsWith('!taddgame ')){
    addGame(message,Games)
    return
  }
  if(message.content.startsWith('!taddplayer ')){
    async function _add_user(){
      await addUser(message,Users);
      // [users, games] = await get_games_users_dict(path_users_dict,path_games_dict);
      get_avatars(API_Steam_key,Users);

    }
    _add_user()
    console.table(Users)
    return
  }
  if(message.content.startsWith('!tremovegame ')){
    removeGame(message,Games)
    return
  }
  if(message.content.startsWith('!tremoveplayer ')){
    removeUser(message,Users)
    return
  }
  if(message.content==='!tlistplayers'){
    list_players(Users,message)
    return
  }
  if(message.content==='!tlistgames'){
    list_games(Games,message)
    return
  }
  if(message.content==='!thelp'){
    help(message.channel)
    return
  }

})


