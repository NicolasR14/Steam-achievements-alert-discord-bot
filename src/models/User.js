const { API_Steam_key } = require('../../config.json')
const fetch = require('node-fetch');

class User {
  constructor(steam_id, discord_id, nickname, guilds) {
    this.steam_id = steam_id;
    this.discord_id = discord_id;
    this.nickname = nickname;
    this.guilds = guilds;
    this.avatar;
    this.recentlyPlayedGames = [];
    this.newAchievements = [] //pour l'affichage
    this.displayedAchievements = []
    this.timePlayedByGame = {}
  }
  async getPlaytime(Games) {
    await fetch(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${API_Steam_key}&steamid=${this.steam_id}&format=json`)
      .then(function (res) {
        if (res.ok) {
          return res.json();
        } else throw Error;
      })
      .then((value) => {
        value.response.games.forEach(game => {
          var matchGame = Games.find(g => g.id === String(game.appid))
          if (matchGame) {
            this.timePlayedByGame[game.appid] = parseInt(parseInt(game.playtime_forever) / 60)
          }
        })
      })
      .catch(function (err) {
        console.error("API error getPlaytime", err);
      });
  }

  async getRecentlyPlayedGames(Games) {
    this.recentlyPlayedGames = await fetch(`http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${API_Steam_key}&steamid=${this.steam_id}&format=json`)
      .then(function (res) {
        if (res.ok) {
          return res.json();
        } else throw Error;
      })
      .then((value) => {
        return value.response.games.map(game => {
          var matchGame = Games.find(g => g.id === String(game.appid))
          if (matchGame) {
            this.timePlayedByGame[game.appid] = parseInt(parseInt(game.playtime_forever) / 60)
            return matchGame
          }
        }).filter(notUndefined => notUndefined !== undefined);
      })
      .catch(function (err) {
        console.error("API error getRecentlyPlayedGames", err);
      });
  }

}



module.exports = { User }