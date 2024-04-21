const { API_Steam_key } = require('../../config.json')
const fetch = require('node-fetch');

class User {
  constructor(steam_id, discord_id, nickname, guilds, color) {
    this.steam_id = steam_id;
    this.discord_id = discord_id;
    this.nickname = nickname;
    this.guilds = guilds;
    this.color = color;
    this.avatar;
    this.recentlyPlayedGames = [];
    this.newAchievements = [] //pour l'affichage
    this.displayedAchievements = []
    this.timePlayedByGame = {}
  }
  async getPlaytime(Games) {
    const steam_id = this.steam_id
    const nickname = this.nickname
    return await fetch(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${API_Steam_key}&steamid=${this.steam_id}&format=json`)
      .then(function (res) {
        if (res.ok) {
          return res.json();
        } else throw Error;
      })
      .then((value) => {
        if (value.response.games !== undefined) {
          value.response.games.forEach(game => {
            var matchGame = Games.find(g => g.id === String(game.appid))
            if (matchGame) {
              this.timePlayedByGame[game.appid] = parseInt(parseInt(game.playtime_forever) / 60)
            }
          })
          console.log(`Games playtime updated for ${nickname}`)
        }
        else {
          throw Error("response empty")
        }

      })
      .catch(function (err) {
        console.error(`API error getPlaytime for ${steam_id}, ${nickname} : ${err}`);
      });
  }

  async getRecentlyPlayedGames(Games) {
    return await fetch(`http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${API_Steam_key}&steamid=${this.steam_id}&format=json`)
      .then(function (res) {
        if (res.ok) {
          return res.json();
        } else throw Error;
      })
      .then((value) => {
        this.recentlyPlayedGames = []
        if (value.response.total_count != 0) {
          this.recentlyPlayedGames = value.response.games.map(game => {
            var matchGame = Games.find(g => g.id === String(game.appid))
            if (matchGame) {
              this.timePlayedByGame[game.appid] = parseInt(parseInt(game.playtime_forever) / 60)
              return matchGame
            }
          }).filter(notUndefined => notUndefined !== undefined);
        }
        console.log(`Recently played games [${this.nickname}] : ${this.recentlyPlayedGames.map(g => g.name)}`)
        return this.recentlyPlayedGames
      })
      .catch(function (err) {
        console.error("API error getRecentlyPlayedGames", err);
      });
  }

}



module.exports = { User }