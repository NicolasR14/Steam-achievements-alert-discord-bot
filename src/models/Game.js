const fetch = require('node-fetch');
const { API_Steam_key } = require('../../config.json')
const { Achievement } = require('./Achievement.js')
const { AttachmentBuilder, EmbedBuilder, ActionRowBuilder } = require('discord.js');
const { backButton, forwardButton } = require('../../assets/buttons')
const printAtWordWrap = require('../../assets/utils')
const Canvas = require('canvas')

class Game {
    constructor(name, id, guilds) {
        this.id = id;
        this.name = name;
        this.realName = ''
        this.guilds = guilds;
        this.achievements = {} //Dictionnaire clé id achievements et valeur l'objets de l'achievement
        this.nbUnlocked = {} //Dictionnaire user steam id
        this.nbTotal
    }
    async updateAchievements(user, t_0, start = false) {
        return await fetch(`http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${this.id}&key=${API_Steam_key}&steamid=${user.steam_id}&l=french`)
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
                var nb_new_achievements = 0
                this.nbTotal = value.playerstats.achievements.length
                this.realName = value.playerstats.gameName
                for (const a of value.playerstats.achievements) {
                    //check each achievement
                    if (typeof this.achievements[a.apiname] === 'undefined') {
                        this.achievements[a.apiname] = new Achievement(this, a.apiname, a.name, a.description)
                    }

                    this.achievements[a.apiname].playersUnlockTime[user.steam_id] = a.unlocktime
                    if (a.unlocktime != 0) {
                        nb_unlocked++
                        if (a.unlocktime > t_0 && !user.displayedAchievements.includes(`${this.id}_${a.apiname}`)) {
                            //achievement is valid if it has been unlocked since bot is live and if it has not been displayed
                            if (!start) {
                                user.newAchievements.push(this.achievements[a.apiname]);
                                nb_new_achievements++
                            }
                            user.displayedAchievements.push(`${this.id}_${a.apiname}`)
                        }
                    }
                }
                this.nbUnlocked[user.steam_id] = { nbUnlocked: nb_unlocked, user: user }
                console.log(`[${now}] Found ${nb_new_achievements} new achievements for ${user.nickname} on ${this.name}`)
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
                    this.achievements[a.name].globalPercentage = parseFloat(a.percent).toFixed(1);
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
                    this.achievements[a.name].icon = a.icon;
                }
            })
            .catch(function (err) {
                console.error("getAchievementIcon error : ", err);
            });
    }

    listCompareAchievements(userAuthor, users_vs, interaction) {
        var validAchievements = Object.entries(this.achievements).map(([a_id, a]) => {
            if (a.playersUnlockTime[userAuthor.steam_id] === 0) {
                const playersWhoUnlocked = Object.entries(a.playersUnlockTime).map(([u, unlocked_time]) => {
                    if (unlocked_time != 0 && users_vs.map(_u => _u.steam_id).includes(u)) {
                        return users_vs.find(_u => _u.steam_id === u)
                    }
                }).filter(notUndefined => notUndefined !== undefined);
                if (playersWhoUnlocked.length > 0) {
                    return { object: a, playersWhoUnlocked: playersWhoUnlocked }
                }
            }

        }).filter(notUndefined => notUndefined !== undefined);
        var vs1;
        if (users_vs.length === 1) {
            vs1 = users_vs[0]
        }
        const canvas_title = `Locked achievements for ${userAuthor.nickname} vs. ${typeof vs1 === 'undefined' ? 'all' : vs1.nickname}`
        const canvas_title2 = `locked`
        this.displayAchievementsList(validAchievements, interaction, [canvas_title, canvas_title2])
    }

    listLockedAchievements(userAuthor, interaction, globalVariables) {
        var validAchievements = Object.entries(this.achievements).map(([a_id, a]) => {
            if (a.playersUnlockTime[userAuthor.steam_id] === 0) {
                const playersWhoUnlocked = Object.entries(a.playersUnlockTime).map(([u, unlocked_time]) => {
                    if (unlocked_time != 0) {
                        return globalVariables.Users.find(_u => _u.steam_id === u)
                    }
                }).filter(notUndefined => notUndefined !== undefined);
                return { object: a, playersWhoUnlocked: playersWhoUnlocked }
            }

        }).filter(notUndefined => notUndefined !== undefined);

        const canvas_title = `Locked achievements for ${userAuthor.nickname}`
        const canvas_title2 = `locked`
        this.displayAchievementsList(validAchievements, interaction, [canvas_title, canvas_title2], userAuthor)
    }

    listAllAchievements(interaction, globalVariables) {
        var validAchievements = Object.entries(this.achievements).map(([a_id, a]) => {
            const playersWhoUnlocked = Object.entries(a.playersUnlockTime).map(([u, unlocked_time]) => {
                if (unlocked_time != 0) {
                    return globalVariables.Users.find(_u => _u.steam_id === u)
                }
            }).filter(notUndefined => notUndefined !== undefined);
            return { object: a, playersWhoUnlocked: playersWhoUnlocked }

        }).filter(notUndefined => notUndefined !== undefined);

        const canvas_title = `All achievements`
        const canvas_title2 = `all`
        this.displayAchievementsList(validAchievements, interaction, [canvas_title, canvas_title2])
    }

    async displayProgressionBar(interaction) {
        const background = await Canvas.loadImage('./assets/background.jpg')
        const blue_bar = await Canvas.loadImage('./assets/blue_progress_bar.png')
        const black_bar = await Canvas.loadImage('./assets/black_progress_bar.png')

        var users_nb_unlocked_not_null = Object.entries(this.nbUnlocked).filter(([k, v]) => v.nbUnlocked !== 0)
        Canvas.registerFont('./assets/OpenSans-VariableFont_wdth,wght.ttf', { family: 'Open Sans Regular' })
        const canvas = Canvas.createCanvas(700, 115 + (users_nb_unlocked_not_null.length - 1) * 70);
        const context = canvas.getContext('2d');
        var attachment;
        context.drawImage(background, 0, 0);

        var sorted = [];
        for (var [k, v] of users_nb_unlocked_not_null) {
            sorted.push([v.user, v.nbUnlocked]);
        }
        sorted.sort(function (a, b) {
            return b[1] - a[1]
        })

        users_nb_unlocked_not_null = sorted

        var n = 0;

        context.font = '25px "Open Sans Regular"';
        context.fillStyle = '#ffffff';
        context.fillText("Progress on " + this.realName, 25, 35);

        users_nb_unlocked_not_null.forEach((v) => {

            context.drawImage(v[0].avatar, 25, 50 + n * 70, 50, 50);
            context.font = '20px "Open Sans Regular"';
            context.fillStyle = '#bfbfbf';
            context.fillText(v[1] + "/" + this.nbTotal + " unlocked achievements (" + (parseInt(100 * v[1] / this.nbTotal)) + "%)", 100, 65 + n * 70);
            context.drawImage(black_bar, 100, 80 + n * 70, 575, 20);
            context.drawImage(blue_bar, 100, 80 + n * 70, 575 * v[1] / this.nbTotal, 20);
            n += 1;
        })

        attachment = new AttachmentBuilder(canvas.toBuffer())
        await interaction.reply({ files: [attachment] });
    }

    async displayAchievementsList(achievements_locked, interaction, canvas_title) {
        const MAX_PAGE = 5
        const background = await Canvas.loadImage('./assets/background.jpg')
        if (achievements_locked.length === 0) {
            return
        }

        achievements_locked.sort(function (a, b) {
            return parseFloat(b.object.globalPercentage) - parseFloat(a.object.globalPercentage)
        })


        await Promise.all(achievements_locked.map(async (achievement) => {
            achievement.object.icon = await Canvas.loadImage(achievement.object.icon)
        }))
        function get_embedded_img(achievements_fraction, startAnb, endAnb) {
            const SPACE_BETWEEN = 90
            const canvas = Canvas.createCanvas(700, 135 + (achievements_fraction.length - 1) * SPACE_BETWEEN);
            const context = canvas.getContext('2d');
            context.drawImage(background, 0, 0);
            context.font = '22px "Open Sans Regular"';
            context.fillStyle = '#ffffff';

            context.fillText(`${canvas_title[0]} ${startAnb}-${endAnb} out of ${achievements_locked.length} `, 20, 35);
            var n = 0;

            achievements_fraction.forEach(function (a) {
                context.drawImage(a.object.icon, 20, 53 + n * SPACE_BETWEEN, 60, 60);

                context.font = '20px "Open Sans Regular"';
                context.fillStyle = '#67d4f4';
                context.fillText(a.object.achievementName, 100, 68 + n * SPACE_BETWEEN) //TITRE
                // context.fillText("Unlocked by ", 100+context.measureText(a[1][2]).width+10, 68+n*SPACE_BETWEEN);
                context.fillStyle = '#bfbfbf';

                const title_width = context.measureText(a.object.achievementName).width
                context.fillText(`(${a.object.globalPercentage}%)`, 100 + title_width + 10, 68 + n * SPACE_BETWEEN)
                const globalPercentage_width = context.measureText(`(${a.object.globalPercentage}%)`).width

                a.playersWhoUnlocked.map(async (user_a, index) => {
                    context.drawImage(user_a.avatar, 100 + title_width + globalPercentage_width + 20 + 40 * index, 46 + n * SPACE_BETWEEN, 30, 30);
                })
                // context.fillText(txt, 100 + title_width + 10 + 40 * index, 68 + n * SPACE_BETWEEN);


                printAtWordWrap(context, a.object.achievementDescription, 100, 96 + n * SPACE_BETWEEN, 20, 580)
                // context.fillText(, 100, 96+n*70);

                n += 1;
            })
            return new AttachmentBuilder(canvas.toBuffer(), 'img_part2.png')
        }

        const canFitOnOnePage = achievements_locked.length <= MAX_PAGE
        const slice_achievements = achievements_locked.slice(0, 0 + 5)
        const embedMessage = await interaction.channel.send({
            embeds: [new EmbedBuilder().setTitle(`Showing ${canvas_title[1]} achievements ${1} -${slice_achievements.length} out of ${achievements_locked.length}`)],
            files: [get_embedded_img(slice_achievements, 1, slice_achievements.length)],
            components: canFitOnOnePage
                ? []
                : [new ActionRowBuilder({ components: [forwardButton] })]
        })
        // Exit if there is only one page of guilds (no need for all of this)
        if (canFitOnOnePage) return

        // Collect button interactions (when a user clicks a button)
        const collector = embedMessage.createMessageComponentCollector()

        let currentIndex = 0
        collector.on('collect', async interaction => {
            // Increase/decrease index
            interaction.customId === backButton.data.custom_id ? (currentIndex = currentIndex - MAX_PAGE) : (currentIndex = currentIndex + MAX_PAGE)
            // Respond to interaction by updating message with new embed
            const slice_achievements = achievements_locked.slice(currentIndex, currentIndex + 5)

            await interaction.update({
                embeds: [new EmbedBuilder().setTitle(`Showing ${canvas_title[1]} achievements ${currentIndex + 1}-${currentIndex + slice_achievements.length} out of ${achievements_locked.length}`)],
                files: [get_embedded_img(slice_achievements, currentIndex + 1, currentIndex + slice_achievements.length)],
                components: [
                    new ActionRowBuilder({
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
}
module.exports = { Game }