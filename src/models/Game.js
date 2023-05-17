const fetch = require('node-fetch');
const {API_Steam_key} = require('../../config/config.json')
const {Achievement} = require('./Achievement.js')

class Game {
    constructor(name,id,guilds){
        this.id = id;
        this.name = name;
        this.guilds = guilds;
        this.achievements = {} //Double dictionnaire avec en première couche l'id des achievements et en seconde les joueurs
        this.globalPercentages = {} //Dictionnaire achievements
        this.nbUnlocked = {} //Dictionnaire user steam id
        this.nbTotal
        this.achievementsIcon = {}
    }
    updateAchievements(user,t_0){
        return fetch(`http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${this.id}&key=${API_Steam_key}&steamid=${user.steam_id}&l=french`)
        .then(res => {
        if (res.ok) {
            return res.json();
        } else throw Error;
        })
        .then(async value =>{
            const now = parseInt(Date.now());
            if (!value.playerstats.success) {
                throw Error(`${this.nickname} profile is not public`)
            }
            if (!value.playerstats.hasOwnProperty("achievements")) {
                throw Error(`${value.playerstats.gameName}` + " doesn't have achievements");
            }
            this.nbUnlocked = 0
            this.nbTotal = value.playerstats.achievements.length
            for (const a of value.playerstats.achievements){
            //check each achievement
            if (a.unlocktime != 0) {
                this.nbUnlocked++
                if (a.unlocktime > t_0 && ((typeof this.achievements[user.steam_id] === 'undefined')) | this.achievements[user.steam_id] === 0) {
                    //achievement is valid if it has been unlocked since bot is live and if it has not been displayed
                    user.newAchievements.push(new Achievement(this,value.playerstats.gameName,a.apiname,a.name,a.description,user)); 
                }
            }
            if(typeof this.achievements[a.apiname] === 'undefined'){
                this.achievements[a.apiname] = {}
            }
            this.achievements[a.apiname][user.steam_id] = a.unlocktime
            }
            console.log(`[${now}] Found ${user.newAchievements.length} new achievements for ${user.nickname} on ${this.name}`)
        })
        .catch(function (err) {
        console.error("getAchievementsToDisplay error : ", err);
        });
    }

    updateGlobalPercentage(){
        return fetch(`http://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=${this.id}&format=json`) //get total players unlocked rate
        .then(res => {
        if (res.ok) {
            return res.json();
        } else throw Error;
        })
        .then(value => {
        for (const a of value.achievementpercentages.achievements){
            this.globalPercentages[a.name] = parseFloat(a.percent).toFixed(1);
        }
        })
        .catch(function (err) {
        console.error("updateGlobalPercentage error : ", err);
        });
        }
    
    getAchievementsIcon(){
        return fetch(`http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?appid=${this.id}&key=${API_Steam_key}`) 
        //get infos on game achievements
            .then(res => {
              if (res.ok) {
                return res.json();
              } else {
                console.log(res);
                throw Error;
              }
            })
            .then(value => {
              for (const a of value.game.availableGameStats.achievements){
                this.achievementsIcon[a.name] = a.icon;
              }
            })
            .catch(function (err) {
              console.error("getAchievementIcon error : ", err);
            });
    }
}

module.exports = {Game}