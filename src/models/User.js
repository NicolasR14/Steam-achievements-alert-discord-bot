const {API_Steam_key} = require('../../config/config.json')
const fetch = require('node-fetch');

class User {
    constructor(steam_id,discord_id,nickname,guilds){
      this.steam_id = steam_id;
      this.discord_id= discord_id;
      this.nickname = nickname;
      this.guilds = guilds;
      this.avatar;
      this.recentlyPlayedGames = [];
      this.newAchievements = [] //pour l'affichage
      this.displayedAchievements = []
    }
    async getRecentlyPlayedGames(Games){
      this.recentlyPlayedGames = await fetch(`http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${API_Steam_key}&steamid=${this.steam_id}&format=json`)
        .then(function (res) {
          if (res.ok) {
            return res.json();
          } else throw Error;
        })
        .then(function (value) {
          
          var test = value.response.games.map(game => {
            var matchGame = Games.find(g => g.id === String(game.appid))
            if(matchGame){
              return matchGame
            }
          })
          return test
        })
        .catch(function (err) {
          console.error("API error getRecentlyPlayedGames", err);
        });
    }
    
}



module.exports = {User}