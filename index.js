import { Client, Intents} from 'discord.js';
import { get_avatars} from './src/steam_interface.js'
import { listen_achievements, compare_message, list_games, list_players,help} from './src/discord_interface.js'
import {get_games_users_dict,add_game,add_user,remove_user,remove_game} from './src/dict_interface.js'
import {config} from './config/config.js'

const client = new Client({ intents: [Intents.FLAGS.GUILDS,Intents.FLAGS.DIRECT_MESSAGES,Intents.FLAGS.GUILD_MESSAGES,Intents.FLAGS.GUILDS] });
const t_0 = parseInt(Date.now()/1000);
// const t_0 = parseInt(1682453160000/1000);
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
  [Users,Games] = await get_games_users_dict(path_users_dict,path_games_dict);
  await get_avatars(API_Steam_key,Users) //to get avatars for each players
  listen_achievements(Guilds,Users,Games,API_Steam_key,t_0);
}

//App reaction to posts in a discord channel
client.on("messageCreate", message => {
  if(message.content === "!on"){
    Guilds.forEach(guild =>{
      if(guild.id === message.guildId){
        guild.channel_id = message.channelId;
        guild.channel = message.channel;
      }
    })
    console.table(Guilds)
    return
  }
  if(message.content.startsWith('!compare ')){
    compare_message(message,Games,Users,API_Steam_key)
    return
  }
  if(message.content.startsWith('!addgame ')){
    add_game(message,path_games_dict,Games)
    return
  }
  if(message.content.startsWith('!addplayer ')){
    async function _add_user(){
      await add_user(message,path_users_dict,Users);
      // [users, games] = await get_games_users_dict(path_users_dict,path_games_dict);
      get_avatars(API_Steam_key,Users);

    }
    _add_user()
    console.table(Users)
    return
  }
  if(message.content.startsWith('!removegame ')){
    remove_game(message,path_games_dict,Games)
    return
  }
  if(message.content.startsWith('!removeplayer ')){
    remove_user(message,path_users_dict,Users)
    return
  }
  if(message.content==='!listplayers'){
    list_players(Users,message)
    return
  }
  if(message.content==='!listgames'){
    list_games(Games,message)
    return
  }
  if(message.content==='!help'){
    help(message.channel)
    return
  }

})


