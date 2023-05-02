import {is_unlocked_for_others, get_recently_played_games, get_achievements_to_print, compare} from './steam_in.js'
import { MessageAttachment , MessageEmbed,MessageActionRow, MessageButton} from 'discord.js';
import Canvas from 'canvas';
import {typeOf} from "mathjs";
import fs from 'fs';
import {backButton,forwardButton} from '../assets/Buttons.js';

function neverPlayed(author,channel){
    channel.send(author.nickname,'never played to this game');
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
  return currentLine;
}

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
    const background = await Canvas.loadImage('./assets/background.jpg')
    async function first_part(){
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
    }
    async function second_part(){
        const MAX_PAGE = 5
        if(achievements_locked.length === 0){
            return
        }
        await Promise.all(achievements_locked.map(async (achievement) => {
        achievement[2] = await Canvas.loadImage(achievement[2])
        }))
        function get_embedded_img(achievements,startAnb,endAnb){
            const SPACE_BETWEEN = 90
            const canvas = Canvas.createCanvas(700, 135+(achievements.length-1)*SPACE_BETWEEN);
            const context = canvas.getContext('2d');
            context.drawImage(background, 0, 0);
            context.font = '22px "Open Sans Regular"';
            context.fillStyle = '#ffffff';
            context.fillText(`Locked achievements for ${author.nickname} vs. ${typeof vs1 === 'undefined' ? 'all' : vs1.nickname} ${startAnb}-${endAnb} out of ${achievements_locked.length}`, 20, 35);
            var n = 0;
        
            achievements.forEach(function(a){
                context.drawImage(a[2], 20, 53+n*SPACE_BETWEEN, 60, 60);
                
                context.font = '20px "Open Sans Regular"';
                context.fillStyle = '#67d4f4';
                context.fillText("Unlocked by ", 100, 68+n*SPACE_BETWEEN);
                context.fillStyle = '#bfbfbf';
                a[0].map(async (user_a,i) => {
                context.drawImage(users.find(user=>user.steam_id===user_a).avatar, 225+40*i, 46+n*SPACE_BETWEEN, 30, 30);
                })
                printAtWordWrap(context, a[1][1], 100, 96+n*SPACE_BETWEEN, 20, 580)
                // context.fillText(, 100, 96+n*70);
        
                n += 1;
            })
            return new MessageAttachment(canvas.toBuffer(),'img_part2.png')
        }

        const {author_1, channel} = message
        const canFitOnOnePage = achievements_locked.length <= MAX_PAGE
        const slice_achievements = achievements_locked.slice(0,0+5)
        const embedMessage = await channel.send({
        embeds: [new MessageEmbed().setTitle(`Showing locked achievements ${1}-${slice_achievements.length} out of ${achievements_locked.length} for ${author.nickname}`)],
        files: [get_embedded_img(slice_achievements,1,slice_achievements.length)],
        components: canFitOnOnePage
            ? []
            : [new MessageActionRow({components: [forwardButton]})]
        })
        // Exit if there is only one page of guilds (no need for all of this)
        if (canFitOnOnePage) return
    
        // Collect button interactions (when a user clicks a button)
        const collector = embedMessage.createMessageComponentCollector()
    
        let currentIndex = 0
        collector.on('collect', async interaction => {
        // Increase/decrease index
        interaction.customId === backButton.customId ? (currentIndex -= MAX_PAGE) : (currentIndex += MAX_PAGE)
        // Respond to interaction by updating message with new embed
        const slice_achievements = achievements_locked.slice(currentIndex,currentIndex+5)
    
        await interaction.update({
            embeds: [new MessageEmbed().setTitle(`Showing locked achievements ${currentIndex+1}-${currentIndex+slice_achievements.length} out of ${achievements_locked.length} for ${author.nickname}`)],
            files: [get_embedded_img(slice_achievements,currentIndex+1,currentIndex+slice_achievements.length)],
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
    
    first_part().then(() => second_part())
  
  }

export {print_achievement,print_compare,neverPlayed};