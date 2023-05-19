const fetch = require('node-fetch');
const { API_Steam_key } = require('../../config/config.json')
const { Achievement } = require('./Achievement.js')
const { AttachmentBuilder, EmbedBuilder, ActionRowBuilder } = require('discord.js');
const printAtWordWrap = require('../../assets/utils')
const Canvas = require('canvas')

class Game {
    constructor(name, id, guilds) {
        this.id = id;
        this.name = name;
        this.realName = ''
        this.guilds = guilds;
        this.achievements = {} //Double dictionnaire avec en première couche l'id des achievements et en seconde les joueurs
        this.globalPercentages = {} //Dictionnaire achievements
        this.nbUnlocked = {} //Dictionnaire user steam id
        this.nbTotal
        this.achievementsIcon = {}
    }
    updateAchievements(user, t_0, start = false) {
        return fetch(`http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${this.id}&key=${API_Steam_key}&steamid=${user.steam_id}&l=french`)
            .then(res => {
                if (res.ok) {
                    return res.json();
                } else {
                    throw (`${this.name} : ${user.nickname} error`);
                }
            })
            .then(async value => {
                const now = parseInt(Date.now());
                if (!value.playerstats.success) {
                    throw Error(`${this.nickname} profile is not public`)
                }
                if (!value.playerstats.hasOwnProperty("achievements")) {
                    throw Error(`${value.playerstats.gameName}` + " doesn't have achievements");
                }
                var nb_unlocked = 0
                this.nbTotal = value.playerstats.achievements.length
                this.realName = value.playerstats.gameName
                for (const a of value.playerstats.achievements) {
                    //check each achievement
                    if (a.unlocktime != 0) {
                        nb_unlocked++
                        if (a.unlocktime > t_0 && !user.displayedAchievements.includes(`${this.id}_${a.apiname}`) && ((typeof this.achievements[user.steam_id] === 'undefined') | this.achievements[user.steam_id] === 0)) {
                            //achievement is valid if it has been unlocked since bot is live and if it has not been displayed
                            if (!start) {
                                user.newAchievements.push(new Achievement(this, value.playerstats.gameName, a.apiname, a.name, a.description, user));
                            }
                            user.displayedAchievements.push(`${this.id}_${a.apiname}`)
                        }
                    }
                    this.nbUnlocked[user] = nb_unlocked
                    if (typeof this.achievements[a.apiname] === 'undefined') {
                        this.achievements[a.apiname] = {}
                    }
                    this.achievements[a.apiname][user.steam_id] = a.unlocktime
                }
                console.log(`[${now}] Found ${user.newAchievements.length} new achievements for ${user.nickname} on ${this.name}`)
            })
            .catch(function (err) {
                console.log(err);
            });
    }

    updateGlobalPercentage() {
        return fetch(`http://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=${this.id}&format=json`) //get total players unlocked rate
            .then(res => {
                if (res.ok) {
                    return res.json();
                } else throw Error;
            })
            .then(value => {
                for (const a of value.achievementpercentages.achievements) {
                    this.globalPercentages[a.name] = parseFloat(a.percent).toFixed(1);
                }
            })
            .catch(function (err) {
                console.error("updateGlobalPercentage error : ", err);
            });
    }

    getAchievementsIcon() {
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
                for (const a of value.game.availableGameStats.achievements) {
                    this.achievementsIcon[a.name] = a.icon;
                }
            })
            .catch(function (err) {
                console.error("getAchievementIcon error : ", err);
            });
    }
    compareAchievements(globalVariables, userAuthor, users_vs, interaction) {
        const validAchievements = Object.entries(this.achievements).map(([a_id, u]) => {
            if (u[userAuthor.steam_id] === 0) {
                const playersWhoUnlocked = Object.entries(u).filter(([_u, unlocked_time]) => {
                    // console.log(unlocked_time, users_vs, _u)
                    if (unlocked_time != 0 && users_vs.map(__u => __u.steam_id).includes(_u)) {
                        return true
                    }
                }).map(([_u, unlocked_time]) => globalVariables.Users.find(__u => __u.steam_id === _u))
                // console.log(`playersWhoUnlocked : ${playersWhoUnlocked}`)
                if (playersWhoUnlocked.length > 0) {
                    return { id: a_id, playersWhoUnlocked: playersWhoUnlocked, icon: this.achievementsIcon[a_id], globalPercentages: this.globalPercentages[a_id] }
                }
            }

        }).filter(notUndefined => notUndefined !== undefined);
        console.log(validAchievements)

        // displayProgressionBar(interaction)
        //Si validAchievment.length == 0 priunt you are alone noob
    }

    async displayProgressionBar(interaction) {
        const background = await Canvas.loadImage('./assets/background.jpg')
        const blue_bar = await Canvas.loadImage('./assets/blue_progress_bar.png')
        const black_bar = await Canvas.loadImage('./assets/black_progress_bar.png')

        var users_nb_unlocked_not_null = Object.entries(this.nbUnlocked).filter(([u, nb]) => nb !== 0)
        Canvas.registerFont('./assets/OpenSans-VariableFont_wdth,wght.ttf', { family: 'Open Sans Regular' })
        const canvas = Canvas.createCanvas(700, 115 + (users_nb_unlocked_not_null.length - 1) * 70);
        const context = canvas.getContext('2d');
        var attachment;
        context.drawImage(background, 0, 0);

        var sorted = [];
        for (var [u, nb_unlocked] of users_nb_unlocked_not_null) {
            sorted.push([u, nb_unlocked]);
        }
        sorted.sort(function (a, b) {
            return b[1] - a[1]
        })

        users_nb_unlocked_not_null = sorted

        var n = 0;

        context.font = '25px "Open Sans Regular"';
        context.fillStyle = '#ffffff';
        context.fillText("Progress on " + this.realName, 25, 35);

        users_nb_unlocked_not_null.forEach(([user, nb_unlocked]) => {
            context.drawImage(user.avatar, 25, 50 + n * 70, 50, 50);
            context.font = '20px "Open Sans Regular"';
            context.fillStyle = '#bfbfbf';
            context.fillText(nb_unlocked + "/" + this.nbTotal + " unlocked achievements (" + (parseInt(100 * nb_unlocked / this.nbTotal)) + "%)", 100, 65 + n * 70);
            context.drawImage(black_bar, 100, 80 + n * 70, 575, 20);
            context.drawImage(blue_bar, 100, 80 + n * 70, 575 * nb_unlocked / this.nbTotal, 20);
            n += 1;
        })

        attachment = new AttachmentBuilder(canvas.toBuffer())
        message.channel.send({ files: [attachment] })
    }
}

// displayLockedAchievements(achievements) {

// }

module.exports = { Game }