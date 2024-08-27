const fetch = require('node-fetch');
const Canvas = require("canvas");
const { API_Steam_key } = require('../config.json')

async function isPublicProfile(steamUserId) {
  try {
    result = await fetch(`http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=440&key=${API_Steam_key}&steamid=${steamUserId}`).then(async res => await res.json())
    if (result.playerstats.success === false) {
      return 0 //Profile not public
    }
    return 1
  }
  catch (error) {
    console.log(`API error : ${error}`) //API Error or no such steam id
    return -1
  }

}

function getAvatars(users) {
  var ids = ""; //list
  users.forEach(user => ids += user.steam_id + ",")
  fetch(
    "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=" +
    API_Steam_key +
    "&steamids=" +
    ids
  ) //get player summaries
    .then(function (res) {
      if (res.ok) {
        return res.json();
      } else throw Error;
    })
    .then(async function (value) {
      value.response.players.map(async (_user) => {
        Canvas.loadImage(_user.avatarfull) //load image
          .then(function (img) {
            users.find(user => user.steam_id === _user.steamid).avatar = img
            console.log(`Avatar updated for ${users.find(user => user.steam_id === _user.steamid).nickname}`)
          });
      })
    })
    .catch(function (err) {
      console.error(err);
    });
}

function listenForNewAchievements(globalVariables) {
  console.log('listening to new achievements...')

  setInterval(async function () {
    console.log(`//////////////////////////////\nGames list : ${globalVariables.Games.map(game => game.name)}`)
    globalVariables.t_lookback = globalVariables.t_lookback + 60
    console.log(`lookback :${globalVariables.t_lookback}`)
    await Promise.all(globalVariables.Users.map(async user => {
      await user.getRecentlyPlayedGames(globalVariables.Games)
      await Promise.all(user.recentlyPlayedGames.map(async game => {
        await game.updateAchievements(user, globalVariables.t_lookback, start = false)
      }))
    }))

    const new_achievements = globalVariables.Users.map(user => user.newAchievements.map(a => [user, a])).flat(1);
    console.log(`Nb new achievements to display : ${new_achievements.length}`)
    if (new_achievements.length > 0) {
      await Promise.all(globalVariables.Games.map(async game => {
        await game.updateGlobalPercentage()
        // await game.getAchievementsIcon()
      }))
    }

    var guild;

    for (const newA of new_achievements) {
      for (const guild_id of newA[0].guilds) {
        guild = globalVariables.Guilds.find(g => g.id === guild_id)
        if (typeof guild === 'undefined') {
          continue;
        }
        if (typeof guild.channel === 'undefined' | typeof guild.channel_id === 'undefined') {
          continue;
        }

        if (newA[1].game.guilds.includes(guild_id)) {
          await newA[1].displayDiscordNewAchievement(globalVariables.Users, guild, newA[0])
        }
      }
    }
    //reset newAchievements array for all users
    for (const user of globalVariables.Users) {
      user.newAchievements = []
    }


  }, 60000)
}
async function isGameIdValid(game_id) {
  return await fetch(`http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?appid=${game_id}&key=${API_Steam_key}`)
    .then(res => {
      if (res.ok) {
        return res.json().then((value) => {
          if (!value.game.availableGameStats || !value.game.availableGameStats.achievements || Object.keys(value.game.availableGameStats.achievements).length == 0) {
            return 0
          }
          return 1
        })
      } else return -1
    })
}
async function checkForNewUpdates(globalVariables) {
  setInterval(async function () {
    globalVariables.Games.forEach(async game => {
      game.isUpToDate(globalVariables.Guilds)
    })
  }, 21600000)

}
module.exports = { getAvatars, listenForNewAchievements, isPublicProfile, isGameIdValid, checkForNewUpdates };