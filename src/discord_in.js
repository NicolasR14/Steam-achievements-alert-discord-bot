import {is_unlocked_for_others, get_recently_played_games, get_achievements_to_print, compare} from './steam_in.js'
import { MessageAttachment , MessageEmbed,MessageActionRow, MessageButton} from 'discord.js';
import Canvas from 'canvas';
import {typeOf} from "mathjs";
import fs from 'fs';

function new_game(correct,channel_id){
  if (correct === 1){
    channel_id.send('Game added!');
  }
  else if(correct === 0){
    channel_id.send('Wrong format. Please use : !addgame [game_name] [game_id]');
  }
  else if(correct === 2){
    channel_id.send('Game was already added');
  }
  else if(correct === 3){
    channel_id.send('Wrong ID')
  }

}

function new_player(correct,channel_id){
  if (correct === 1){
    channel_id.send('Player added!');
  }
  else if(correct === 0){
    channel_id.send('Wrong format. Please use : *!addplayer @player [steam_user_id] [nickname]*');
  }
  else if(correct === 2){
    channel_id.send('Player was already added');
  }
  else if(correct === 3){
    channel_id.send('Wrong ID')
  }
}

function del_player(correct,channel_id){
  if (correct === 1){
    channel_id.send('Player removed!');
  }
  else if(correct === 0){
    channel_id.send('Wrong format. Please use : *!removeplayer @player*');
  }
  else if(correct === 2){
    channel_id.send('Player not found');
  }

}

function del_game(correct,channel_id){
  if (correct === 1){
    channel_id.send('Game removed!');
  }
  else if(correct === 0){
    channel_id.send('Wrong format. Please use : *!removegame game_name*');
  }
  else if(correct === 2){
    channel_id.send('Game not found');
  }

}

function compare_message(message,games,users,API_Steam_key){
  const compare_string = message.content.split(" ");
  
    // const games = Object.keys(games_dict)
    if(compare_string.length < 2 || compare_string.length > 3){
      message.channel.send("Wrong format. Use *!compare [game_name] [players_comparaison]*")
      return
    }
    const game_to_check = games.find(game => game.name === compare_string[1])
    if(typeof game_to_check != 'undefined'){
      console.log('Comparaison')
      const user_author = users.find(user => user.discord_id === '<@'+message.author.id+'>');
      if(typeof user_author === 'undefined'){
        message.channel.send("You are not in players list. Use *!addplayer @player [steam_user_id] [nickname]*")
        return
      }
      var users_vs = users.map(user => user)
      var vs1;
      if(compare_string.length == 3){
        vs1 = users.find(user => user.discord_id === compare_string[2])
        if(typeof vs1 != 'undefined'){
          users_vs = users.filter(f => [user_author.steam_id,vs1.steam_id].includes(f.steam_id));
        }
        
      }
      compare(game_to_check.id,users_vs,API_Steam_key,message,user_author,vs1)
    }
    else{
      message.channel.send("Please add "+compare_string[1]+" game using *!addgame [game_name] [game_id]*")
    }
}

function list_players(users,message){
  var to_send = 'Players list :\n'
  users.forEach(u =>{
    if (u.guilds.includes(message.guildId)){
      to_send+='\t'+u.discord_id+', SteamID: '+u.steam_id+', Nickname: '+u.nickname+'\n'
    }
  })
  message.channel.send(to_send)
}

function display_channel(channel){
  channel.send(channel.id)
}

function list_games(games,message){
  var to_send = 'Games list :\n'
  games.forEach(g =>{
    if (g.guilds.includes(message.guildId)){
      to_send+='\t'+g.name+', SteamID: '+g.id+'\n'
    }
  })
  message.channel.send(to_send)
}

function help(channel){
  var to_send ='Commands list :\n'
  to_send+='\t*!on*\n\tEnable the new achievements listener\n\n'
  to_send+='\t*!compare [game_name]*\n\tCompare achievements between players\n\n'
  to_send+='\t*!removegame game_name*\n\tRemove a game to comparaison list\n\n'
  to_send+='\t*!addgame [game_name] [game_id]*\n\tAdd a game to comparaison list (A game must be in this list to be compared)\n\n'
  to_send+='\t*!listgames*\n\tList the comparaison list\n\n'
  to_send+='\t*!addplayer @player [steam_user_id] [nickname]*\n\tAdd a new player to be listened\n\n'
  to_send+='\t*!removeplayer @player*\n\tRemove a player from listening list\n\n'
  to_send+='\t*!listplayers*\n\tList the players listened list\n\n'
  channel.send(to_send)
}
export { display_channel, compare_message, new_game,new_player,del_player, del_game,list_players,list_games,help};