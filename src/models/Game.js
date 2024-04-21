const fetch = require('node-fetch');
const { API_Steam_key, lang } = require('../../config.json')
const { Achievement } = require('./Achievement.js')
const { AttachmentBuilder, EmbedBuilder, ActionRowBuilder } = require('discord.js');
const { backButton, forwardButton } = require('../../assets/buttons')
const printAtWordWrap = require('../../assets/utils')
const Canvas = require('canvas');
require('chartjs-adapter-moment')
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
class Game {
    constructor(name, id, guilds) {
        this.id = id;
        this.name = name;
        this.realName = ''
        this.guilds = guilds;
        this.achievements = {} //Dictionnaire clé id achievements et valeur l'objet de l'achievement
        this.nbUnlocked = {} //Dictionnaire user steam id avec l'objet user
        this.nbTotal
    }
    async updateAchievements(user, t_0, start = false) {
        return await fetch(`http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${this.id}&key=${API_Steam_key}&steamid=${user.steam_id}&l=${lang}`)
            .then(res => {
                if (res.ok) {
                    return res.json();
                } else {
                    throw (`${user.nickname} : error on ${this.name}`);
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
                        this.getAchievementsIcon()
                    }

                    this.achievements[a.apiname].playersUnlockTime[user.steam_id] = a.unlocktime
                    if (a.unlocktime != 0) {
                        nb_unlocked++
                        if (a.unlocktime > t_0 && !user.displayedAchievements.includes(`${this.id}_${a.apiname}`)) {
                            //achievement is valid if it has been unlocked since bot is live and if it has not been displayed
                            if (!start) {
                                user.newAchievements.push(this.achievements[a.apiname]);
                                nb_new_achievements++
                                user.displayedAchievements.push(`${this.id}_${a.apiname}`)
                            }
                        }
                    }
                }
                this.nbUnlocked[user.steam_id] = { nbUnlocked: nb_unlocked, user: user }
                if (!start) {
                    console.log(`[${now}] Found ${nb_new_achievements} new achievements for ${user.nickname} on ${this.name}`)
                }
            })
            .catch(function (err) {
                if (!start) {
                    console.log(err);
                }

            });
    }

    updateGlobalPercentage() {
        const id = this.id
        return fetch(`http://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=${this.id}&format=json`) //get total players unlocked rate
            .then(res => {
                if (res.ok) {
                    return res.json();
                } else throw Error;
            })
            .then(value => {
                for (const a of value.achievementpercentages.achievements) {
                    if (this.achievements[a.name]) {
                        this.achievements[a.name].globalPercentage = parseFloat(a.percent).toFixed(1);
                    }
                }
            })
            .catch(function (err) {
                console.log(`http://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=${id}&format=json`)
                console.error(`updateGlobalPercentage error for ${id} : ${err}`);
            });
    }

    getAchievementsIcon() {
        const id = this.id
        const name = this.name
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
                console.log(`http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?appid=${id}&key=${API_Steam_key}`)
                console.error(`getAchievementIcon error for ${id}, ${name} : ${err} `);
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

    listLockedAchievements(userAuthor, interaction, globalVariables, other_users) {
        var validAchievements = Object.entries(this.achievements).map(([a_id, a]) => {
            if (a.playersUnlockTime[userAuthor.steam_id] === 0 || other_users.filter(u => a.playersUnlockTime[u.steam_id] === 0).length > 0) {
                const playersWhoUnlocked = Object.entries(a.playersUnlockTime).map(([u, unlocked_time]) => {
                    const userObject = globalVariables.Users.find(_u => _u.steam_id === u)
                    if (unlocked_time != 0 && userObject.guilds.includes(interaction.guildId)) {
                        return globalVariables.Users.find(_u => _u.steam_id === u)
                    }
                }).filter(notUndefined => notUndefined !== undefined);
                return { object: a, playersWhoUnlocked: playersWhoUnlocked }
            }

        }).filter(notUndefined => notUndefined !== undefined);

        const canvas_title = `Locked for ${userAuthor.nickname} ${other_users.length > 0 ? `or ${other_users.map(user => user.nickname)}` : ``}`
        const canvas_title2 = `locked`
        this.displayAchievementsList(validAchievements, interaction, [canvas_title, canvas_title2], userAuthor)
    }

    listAllAchievements(interaction, globalVariables) {
        var validAchievements = Object.entries(this.achievements).map(([a_id, a]) => {
            const playersWhoUnlocked = Object.entries(a.playersUnlockTime).map(([u, unlocked_time]) => {
                const userObject = globalVariables.Users.find(_u => _u.steam_id === u)
                if (unlocked_time != 0 && userObject.guilds.includes(interaction.guildId)) {
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
        var background
        var black_bar
        var blue_bar
        var grey_bar
        [background, blue_bar, black_bar, grey_bar] = await Promise.all([Canvas.loadImage('./assets/background.jpg'), Canvas.loadImage('./assets/blue_progress_bar.png'),
        Canvas.loadImage('./assets/black_progress_bar.png'), Canvas.loadImage('./assets/grey_progress_bar.png')])

        var users_nb_unlocked_not_null = Object.entries(this.nbUnlocked).filter(([k, v]) => v.nbUnlocked !== 0 && v.user.guilds.includes(interaction.guildId))
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

        const name_display = this.realName === '' ? this.name : this.realName

        await interaction.deferReply();
        if (users_nb_unlocked_not_null.length > 0) {
            var n = 0;

            context.font = '25px "Open Sans Regular"';
            context.fillStyle = '#ffffff';
            context.fillText("Progress on " + name_display, 25, 35);

            const tps_max = Math.max(...users_nb_unlocked_not_null.map(u => { return u[0].timePlayedByGame[this.id] }))

            const barLength = 480

            users_nb_unlocked_not_null.forEach((v) => {
                context.drawImage(v[0].avatar, 25, 48 + n * 70, 50, 50);
                context.font = '15px "Open Sans Regular"';
                context.fillStyle = '#bfbfbf';
                context.fillText(`${v[1]}/${this.nbTotal} (${parseInt(100 * v[1] / this.nbTotal)}%)`, 100 + barLength + 10, 71 + n * 70);
                context.drawImage(black_bar, 100, 58 + n * 70, barLength, 15);
                context.drawImage(blue_bar, 100, 58 + n * 70, barLength * v[1] / this.nbTotal, 15);
                context.fillText(`${v[0].timePlayedByGame[this.id]} h`, 100 + barLength + 10, 91 + n * 70);
                context.drawImage(black_bar, 100, 78 + n * 70, barLength, 15);
                context.drawImage(grey_bar, 100, 78 + n * 70, barLength * v[0].timePlayedByGame[this.id] / tps_max, 15)
                n += 1;
            })
            attachment = new AttachmentBuilder(canvas.toBuffer())
            await interaction.editReply({ files: [attachment] });
            return
        }
        await interaction.editReply(`Nobody has achievement on ${name_display}`);


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

        async function get_embedded_img(achievements_fraction, startAnb, endAnb) {
            const SPACE_BETWEEN = 90
            const canvas = Canvas.createCanvas(700, 135 + (achievements_fraction.length - 1) * SPACE_BETWEEN);
            const context = canvas.getContext('2d');
            context.drawImage(background, 0, 0);
            context.font = '22px "Open Sans Regular"';
            context.fillStyle = '#ffffff';

            context.fillText(`${canvas_title[0]} ${startAnb}-${endAnb} out of ${achievements_locked.length} `, 20, 35);
            // var n = 0;

            await Promise.all(achievements_fraction.map(async (a, n) => {
                const icon = await Canvas.loadImage(a.object.icon)
                context.drawImage(icon, 20, 53 + n * SPACE_BETWEEN, 60, 60);

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
            }))
            return new AttachmentBuilder(canvas.toBuffer(), 'img_part2.png')
        }

        const canFitOnOnePage = achievements_locked.length <= MAX_PAGE
        const slice_achievements = achievements_locked.slice(0, 0 + 5)
        const img_first = await get_embedded_img(slice_achievements, 1, slice_achievements.length)
        const embedMessage = await interaction.channel.send({
            embeds: [new EmbedBuilder().setTitle(`Showing ${canvas_title[1]} achievements ${1} -${slice_achievements.length} out of ${achievements_locked.length}`)],
            files: [img_first],
            components: canFitOnOnePage
                ? []
                : [new ActionRowBuilder({ components: [forwardButton] })]
        })
        // Exit if there is only one page of guilds (no need for all of this)
        if (canFitOnOnePage) return

        // Collect button interactions (when a user clicks a button)
        const collector = embedMessage.createMessageComponentCollector({ time: 172800000 })

        let currentIndex = 0
        collector.on('collect', async interaction => {
            // Increase/decrease index
            interaction.customId === backButton.data.custom_id ? (currentIndex = currentIndex - MAX_PAGE) : (currentIndex = currentIndex + MAX_PAGE)
            // Respond to interaction by updating message with new embed
            const slice_achievements = achievements_locked.slice(currentIndex, currentIndex + 5)
            const img = await get_embedded_img(slice_achievements, currentIndex + 1, currentIndex + slice_achievements.length)

            await interaction.update({
                embeds: [new EmbedBuilder().setTitle(`Showing ${canvas_title[1]} achievements ${currentIndex + 1}-${currentIndex + slice_achievements.length} out of ${achievements_locked.length}`)],
                files: [img],
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

    async displayAchievementsHistory(interaction) {
        delete require.cache[require.resolve('chartjs-adapter-moment')]
        require('chartjs-adapter-moment')
        let timestamp_history = {} //Dict with list of timestamps of achievements unlock time for each player(key)
        let all_timestamps = []
        const guild_users = []

        let nbAchievementsList = {}
        Object.keys(this.nbUnlocked).forEach(userSteamID => {
            if (this.nbUnlocked[userSteamID].user.guilds.includes(interaction.guildId)) {
                timestamp_history[userSteamID] = []
                nbAchievementsList[userSteamID] = []
                guild_users.push(userSteamID)
            }


        });

        for (const achievement of Object.values(this.achievements)) {
            for (const [userSteamID, userUnlockTime] of Object.entries(achievement.playersUnlockTime)) {
                if (userUnlockTime != 0 && guild_users.includes(userSteamID)) {
                    timestamp_history[userSteamID].push(userUnlockTime)
                    if (!all_timestamps.includes(userUnlockTime)) {
                        all_timestamps.push(userUnlockTime)
                    }
                }

            }
        }

        all_timestamps.sort(function (a, b) {
            return a - b;
        });

        let all_timestamps_temp = []
        all_timestamps.forEach(timestamp => {
            all_timestamps_temp.push(timestamp - 1)
            all_timestamps_temp.push(timestamp)
            for (const [userSteamID, timestampsUser] of Object.entries(timestamp_history)) {
                const last_nb = nbAchievementsList[userSteamID].length == 0 ? 0 : nbAchievementsList[userSteamID].at(-1)
                nbAchievementsList[userSteamID].push(last_nb)
                const new_nb = last_nb + timestampsUser.filter((x) => x == timestamp).length
                nbAchievementsList[userSteamID].push(new_nb)
            }
        });

        all_timestamps = all_timestamps_temp.map((timestamp) => new Date(timestamp * 1000))


        for (const [userSteamID, timestampsUser] of Object.entries(timestamp_history)) {
            const last_nb = nbAchievementsList[userSteamID].length == 0 ? 0 : nbAchievementsList[userSteamID].at(-1)
            nbAchievementsList[userSteamID].push(last_nb)
        }

        all_timestamps.push(Date.now())

        let datasets = []

        for (const [userSteamID, userObject] of Object.entries(this.nbUnlocked)) {
            if (guild_users.includes(userSteamID)) {
                datasets.push({
                    data: nbAchievementsList[userSteamID],
                    borderColor: userObject.user.color,
                    label: userObject.user.nickname
                })
            }

        }

        const width = 700; //px
        const height = 500; //px
        const backgroundColour = '#11181f';
        const chart = new ChartJSNodeCanvas({ width, height, backgroundColour });

        const configuration = {
            type: "line",
            data: {
                labels: all_timestamps,
                datasets: datasets
            },
            options: {
                layout: {
                    padding: {
                        right: 20
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        title: {
                            display: true,
                            text: 'Date',
                            color: '#FFFFFF',
                            font: {
                                size: 16
                            }
                        },
                        ticks: {
                            color: '#afb0b7'
                        },
                        grid: {
                            display: true,
                            drawOnChartArea: true,
                            drawTicks: true,
                            color: "#303131"
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Number of achievements unlocked',
                            color: '#FFFFFF',
                            font: {
                                size: 16
                            }
                        },
                        ticks: {
                            color: '#afb0b7'
                        },
                        grid: {
                            display: true,
                            drawOnChartArea: true,
                            drawTicks: true,
                            color: "#303131"
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 0
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: `History on ${this.realName}`,
                        color: "#FFFFFF",
                        font: {
                            size: 20
                        }
                    },
                    legend: {
                        labels: {
                            color: "#FFFFFF",
                            font: {
                                size: 16
                            },
                            usePointStyle: true,
                            pointStyle: 'line',

                            padding: 20
                        }
                    }
                }

            }
        };
        const image = await chart.renderToBuffer(configuration);
        const dataUrl = await chart.renderToDataURL(configuration);
        const stream = chart.renderToStream(configuration);

        const attachment = new AttachmentBuilder(image)
        await interaction.deferReply()
        await interaction.editReply({ files: [attachment] })

    }
}
module.exports = { Game }