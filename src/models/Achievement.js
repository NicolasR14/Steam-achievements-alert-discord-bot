const Canvas = require('canvas')
const printAtWordWrap = require('../../assets/utils')
const { AttachmentBuilder } = require('discord.js');

const gifs = [
    "https://tenor.com/view/good-job-clapping-obama-gif-12414317449568226158",
    "https://tenor.com/view/leonardo-dicaprio-clapping-clap-applause-amazing-gif-16078907558888063471",
    "https://tenor.com/view/congrats-fireworks-gif-6260073604780267354",
    "https://tenor.com/view/toast-fireworks-celebration-leonardo-di-caprio-cheers-gif-15086880",
    "https://tenor.com/view/confetti-style-gif-19616552",
    "https://tenor.com/view/mrandmissjackson-ariana-grande-michael-jackson-gif-20951576"
];

class Achievement {
    constructor(game, achievementId, achievementName, achievementDescription) {
        this.game = game;
        this.achievementId = achievementId;
        this.achievementName = achievementName;
        this.achievementDescription = achievementDescription;
        this.playersUnlockTime = {}
        this.globalPercentage
        this.icon
    }

    async displayDiscordNewAchievement(Users, guild, author, position) {
        Canvas.registerFont('./assets/OpenSans-VariableFont_wdth,wght.ttf', { family: 'Open Sans Regular' })
        const canvas = Canvas.createCanvas(700, 190);
        const context = canvas.getContext('2d');
        var attachment;
        await Promise.all([
            Canvas.loadImage('./assets/background.jpg')
                .then(img => {
                    context.drawImage(img, 0, 0);
                }),
            Canvas.loadImage(this.icon)
                .then(img => {
                    context.drawImage(img, 25, 25, 100, 100);
                })
        ])
        const decal = 160
        context.drawImage(author.avatar, decal, 140, 32, 32);

        const players = Object.keys(this.playersUnlockTime);
        var playerObject;
        var index = 0;
        for (const player of players) {
            playerObject = Users.find(u => u.steam_id === player)
            //if it's not the user who triggered the achievement, if he unlocked it, and if he's in the guild user list
            if (player != author.steam_id && this.playersUnlockTime[player] != 0 && playerObject.guilds.includes(guild.id)) {
                context.drawImage(playerObject.avatar, decal + 40 * (index + 1), 140, 32, 32);
                index = index + 1;
            }
        }
        context.font = '30px "Open Sans Regular"';
        context.fillStyle = '#ffffff';
        context.fillText(this.achievementName, 150, 45);

        context.font = '20px "Open Sans Regular"';
        context.fillStyle = '#bfbfbf';
        const width_max = 100;
        printAtWordWrap(context, this.achievementDescription, 150, 72, 20, 525)

        context.font = '22px "Open Sans Regular"';
        context.fillStyle = '#ffffff';
        const txt2_1 = "Unlocked by ";
        const txt2_2 = "and by " + this.globalPercentage + "% of players.";
        context.fillText(txt2_1, 25, 165);
        context.fillText(txt2_2, decal + (index + 1) * 40, 165);

        attachment = new AttachmentBuilder(canvas.toBuffer())
        const unlock_order = this.game.nbUnlocked[author.steam_id].nbUnlocked - position
        const unlock_rate = unlock_order / this.game.nbTotal * 100;
        const game_finished = unlock_order === this.game.nbTotal
        await guild.channel.send({ content: `${game_finished ? '🎉' : ''} <@${author.discord_id}> unlocked an achievement on ${this.game.realName}. Progress : (${unlock_order}/${this.game.nbTotal}) [${unlock_rate.toFixed(2)}%] ${game_finished ? '🎉' : ''}`, files: [attachment] })
        if (game_finished) {
            guild.channel.send(gifs[Math.floor(Math.random() * gifs.length)])
        }
    }
}

module.exports = { Achievement }