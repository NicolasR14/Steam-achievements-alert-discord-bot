import {is_unlocked_for_others, get_recently_played_games, get_achievements_to_print, compare} from './steam_interface.js'
import { MessageAttachment , MessageEmbed,MessageActionRow, MessageButton} from 'discord.js';
import Canvas from 'canvas';
import {typeOf} from "mathjs";
import fs from 'fs';
const backId = 'back'
const forwardId = 'forward'
const backButton = new MessageButton({
  style: 'SECONDARY',
  label: 'Back',
  emoji: '⬅️',
  customId: backId
})
const forwardButton = new MessageButton({
  style: 'SECONDARY',
  label: 'Forward',
  emoji: '➡️',
  customId: forwardId
})

async function print_achievement(a,users,channel,API_Steam_key){
  const to_print = a.user.discord_id + " unlocked an achievement on " + a.Name_game +". Progress : ("+a['rate_unlocked']+")";
  Canvas.registerFont('./assets/OpenSans-VariableFont_wdth,wght.ttf', { family: 'Open Sans Regular' })
  const canvas = Canvas.createCanvas(700, 190);
  const context = canvas.getContext('2d');
  var attachment;
  await Promise.all([
    Canvas.loadImage('./assets/background.jpg')
    .then(function(img){
      context.drawImage(img, 0, 0);
    }),
    Canvas.loadImage(a.icon)
    .then(function(img){
      context.drawImage(img, 25, 25, 100, 100);
    }),
    
  ]).then(() => {
    const decal = 160
    context.drawImage(a.user.avatar, decal, 140, 32, 32);
    var i = 0
    a['u_by'].map(async (user) => {
      if(user.guilds.includes(channel.guild.id)){
        context.drawImage(user.avatar, decal+40*(i+1), 140, 32, 32);
        i = i + 1;
      }
    })
    
    context.font = '30px "Open Sans Regular"';
    context.fillStyle = '#ffffff';
    context.fillText(a.a_name, 150, 45);

    context.font = '20px "Open Sans Regular"';
    context.fillStyle = '#bfbfbf';
    const width_max = 100;
    printAtWordWrap(context, a.a_descri, 150, 72, 20, 525)

    context.font = '22px "Open Sans Regular"';
    context.fillStyle = '#ffffff';
    const txt2_1 = "Unlocked by ";
    const txt2_2 = "and by " + a.percent + " % of players.";
    context.fillText(txt2_1, 25, 165);
    context.fillText(txt2_2, decal+(i+1)*40, 165);

    attachment = new MessageAttachment(canvas.toBuffer())
  })
  .then(function(){
    channel.send(to_print);
    channel.send({ files: [attachment] })
  })
  .catch(function(err) {
    console.error(err);
  })
    
  }


async function print_compare(nb_unlocked,achievements_locked,users,message,game_name,author,vs1){

  //first part
  const background = await Canvas.loadImage('./assets/background.jpg')
  const blue_bar = await Canvas.loadImage('./assets/blue_progress_bar.png')
  const black_bar = await Canvas.loadImage('./assets/black_progress_bar.png')

  var real_players = Object.keys(nb_unlocked).filter(function(f) {return f !== 'nb_tot' && nb_unlocked[f] !== 0})
  Canvas.registerFont('./assets/OpenSans-VariableFont_wdth,wght.ttf', { family: 'Open Sans Regular' })
  const canvas = Canvas.createCanvas(700, 115+(real_players.length-1)*70);
  const context = canvas.getContext('2d');
  var attachment;
  context.drawImage(background, 0, 0);

  var real_players_sorted = [];
  for (var p of real_players) {
    real_players_sorted.push([p, nb_unlocked[p]]);
  }
  real_players_sorted.sort(function(a,b){
    return b[1] - a[1]
  })

  var n = 0;

  context.font = '25px "Open Sans Regular"';
  context.fillStyle = '#ffffff';
  context.fillText("Progress on "+game_name, 25, 35);

  real_players_sorted.forEach(function(p){
    context.drawImage(users.find(user=>user.steam_id===p[0]).avatar, 25, 50+n*70, 50, 50);
    context.font = '20px "Open Sans Regular"';
    context.fillStyle = '#bfbfbf';
    context.fillText(p[1]+"/"+nb_unlocked['nb_tot']+" unlocked achievements ("+(parseInt(100*p[1]/nb_unlocked['nb_tot']))+"%)", 100, 65+n*70);
    context.drawImage(black_bar, 100, 80+n*70, 575, 20);
    context.drawImage(blue_bar, 100, 80+n*70, 575*p[1]/nb_unlocked['nb_tot'], 20);
    n += 1;
  }) 

  attachment = new MessageAttachment(canvas.toBuffer())
  message.channel.send({ files: [attachment] })

  //second part
  if(achievements_locked.length === 0){
    return
  }
  await Promise.all(achievements_locked.map(async (achievement) => {
    achievement[2] = await Canvas.loadImage(achievement[2])
  }))


  function get_image(achievements,startAnb,endAnb){
    // const achievements = achievements_locked.slice(start,start+5)
    const canvas2 = Canvas.createCanvas(700, 115+(achievements.length-1)*70);
    const context2 = canvas2.getContext('2d');
    var attachment2;
    context2.drawImage(background, 0, 0);

    context2.font = '22px "Open Sans Regular"';
    context2.fillStyle = '#ffffff';
    context2.fillText(`Locked achievements for ${author.nickname} vs. ${typeof vs1 === 'undefined' ? 'all' : vs1.nickname} ${startAnb}-${endAnb} out of ${achievements_locked.length}`, 25, 35);
    var n = 0;

    achievements.forEach(function(a){
      context2.drawImage(a[2], 25, 50+n*70, 50, 50);

      context2.font = '20px "Open Sans Regular"';
      context2.fillStyle = '#bfbfbf';
      context2.fillText("Unlocked by ", 100, 68+n*70);
      a[0].map(async (user_a,i) => {
        context2.drawImage(users.find(user=>user.steam_id===user_a).avatar, 225+40*i, 46+n*70, 30, 30);
      })
      context2.fillText(a[1][1], 100, 96+n*70);

      n += 1;
    })
    // fs.writeFileSync('./testdemort.png',canvas2.toBuffer())
    return new MessageAttachment(canvas2.toBuffer(),'img_part2.png')
  }
  
  // message.channel.send({ files: [attachment2] })


/////////////////////////////////////////////////////
const {author_1, channel} = message
// const guilds = [...client.guilds.cache.values()]


  // Send the embed with the first 10 first achievements
  const MAX_PAGE = 5
  const canFitOnOnePage = achievements_locked.length <= MAX_PAGE
  const slice_achievements = achievements_locked.slice(0,0+5)
  const embedMessage = await channel.send({
    embeds: [new MessageEmbed().setTitle(`Showing locked achievements ${1}-${slice_achievements.length} out of ${achievements_locked.length} for ${author.nickname}`)],
    files: [get_image(slice_achievements,1,slice_achievements.length)],
    components: canFitOnOnePage
      ? []
      : [new MessageActionRow({components: [forwardButton]})]
  })
  // Exit if there is only one page of guilds (no need for all of this)
  if (canFitOnOnePage) return

  // Collect button interactions (when a user clicks a button),
  // but only when the button as clicked by the original message author
  const collector = embedMessage.createMessageComponentCollector()

  let currentIndex = 0
  collector.on('collect', async interaction => {
    // Increase/decrease index
    interaction.customId === backId ? (currentIndex -= MAX_PAGE) : (currentIndex += MAX_PAGE)
    // Respond to interaction by updating message with new embed
    const slice_achievements = achievements_locked.slice(currentIndex,currentIndex+5)

    await interaction.update({
      embeds: [new MessageEmbed().setTitle(`Showing locked achievements ${currentIndex+1}-${currentIndex+slice_achievements.length} out of ${achievements_locked.length} for ${author.nickname}`)],
      files: [get_image(slice_achievements,currentIndex+1,currentIndex+slice_achievements.length)],
      components: [
        new MessageActionRow({
          components: [
            // back button if it isn't the start
            ...(currentIndex ? [backButton] : []),
            // forward button if it isn't the end
            ...(currentIndex + MAX_PAGE < achievements_locked.length ? [forwardButton] : [])
          ]
        })
      ]
    })
  })

}

//print on several lines
function printAtWordWrap(context, text, x, y, lineHeight, fitWidth) {
  fitWidth = fitWidth || 0;
  lineHeight = lineHeight || 20;

  var currentLine = 0;

  var lines = text.split(/\r\n|\r|\n/);
  for (var line = 0; line < lines.length; line++) {


      if (fitWidth <= 0) {
          context.fillText(lines[line], x, y + (lineHeight * currentLine));
      } else {
          var words = lines[line].split(' ');
          var idx = 1;
          while (words.length > 0 && idx <= words.length) {
              var str = words.slice(0, idx).join(' ');
              var w = context.measureText(str).width;
              if (w > fitWidth) {
                  if (idx == 1) {
                      idx = 2;
                  }
                  context.fillText(words.slice(0, idx - 1).join(' '), x, y + (lineHeight * currentLine));
                  currentLine++;
                  words = words.splice(idx - 1);
                  idx = 1;
              }
              else
              { idx++; }
          }
          if (idx > 0)
              context.fillText(words.join(' '), x, y + (lineHeight * currentLine));
      }
      currentLine++;
  }
}

function neverPlayed(author,channel){
  channel.send(author.nickname,'never played to this game');
}

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

function listen_achievements(guilds,users,games,API_Steam_key,t_0){
  console.log('listening to new achievements...')

  setInterval(async function() {
    console.log('//////////////////////////////')
    //Games list
    var games_list = games.map(function(game){
      return parseInt(game.id);
    });
    console.log("Games list : "+games.map(game => game.name))
    
    //Users list
    // const users = Object.keys(user_dict)
    users.forEach(function(user){
      get_recently_played_games(user.steam_id,API_Steam_key)
    .then(function(games_user){
      if (games_user){
        console.log("Recently played games for "+user.nickname+" : "+ Object.keys(games_user).map(function(key){return games_user[key].name}))
        games_user.forEach(function(g_u){
          if(games_list.includes(g_u.appid)){
            get_achievements_to_print(user,API_Steam_key,g_u,t_0,users)
              .then(async function(achievements){
                if(achievements.length != 0){
                  const eligible_guilds = guilds.filter(g=> user.guilds.includes(g.id) && games.find(game => game.id === g_u.appid).guilds.includes(g.id) && typeof g.channel_id != 'undefined')
                  if (eligible_guilds.length != 0){
                      await Promise.all(achievements.map(a => is_unlocked_for_others(a,API_Steam_key,users)))
                      const channels_ids = eligible_guilds.map(g => g.channel)
                      channels_ids.forEach(function(channel){
                        achievements.forEach(a =>print_achievement(a,users,channel,API_Steam_key))
                    })
                }}});
                  }
                })
              }
      else {
        console.log("No recently played games for "+user)
      }
            })
    .catch(function(err) {
      console.error(err);
    })
    })
  },10000);
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
export { display_channel,print_achievement, print_compare, neverPlayed, listen_achievements, compare_message, new_game,new_player,del_player, del_game,list_players,list_games,help};