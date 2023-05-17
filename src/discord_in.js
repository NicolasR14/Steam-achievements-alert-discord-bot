import {compare} from './steam_in.js'

function compare_message(message,games,users,API_Steam_key){
  const compare_string = message.content.split(" ");
  if(compare_string.length < 2 || compare_string.length > 3){
    message.channel.send("Wrong format. Use *!compare [game_name] [players_comparaison]*")
    return
  }
  const game_to_check = games.find(game => game.name === compare_string[1])
  if(typeof game_to_check != 'undefined'){
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
export {compare_message,help};