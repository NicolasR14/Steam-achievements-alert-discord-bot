const Canvas = require('canvas')
const printAtWordWrap = require('../../assets/utils')
const {AttachmentBuilder} = require('discord.js');

class Achievement {
    constructor(game,gameName,achievementId,achievementName,achievementDescription,achievementUser){
        this.game = game;
        this.gameName = gameName;
        this.achievementId = achievementId;
        this.achievementName = achievementName;
        this.achievementDescription = achievementDescription;
        this.achievementUser = achievementUser
    }

    async displayDiscordNewAchievement(Users,guild){
        Canvas.registerFont('./assets/OpenSans-VariableFont_wdth,wght.ttf', { family: 'Open Sans Regular' })
        const canvas = Canvas.createCanvas(700, 190);
        const context = canvas.getContext('2d');
        var attachment;
        await Promise.all([
            Canvas.loadImage('./assets/background.jpg')
            .then(img => {
                context.drawImage(img, 0, 0);
                }),
            Canvas.loadImage(this.game.achievementsIcon[this.achievementId])
            .then(img => {
                context.drawImage(img, 25, 25, 100, 100);
                })
            ])
        const decal = 160
        context.drawImage(this.achievementUser.avatar, decal, 140, 32, 32);
        
        const usersWhoAlreadyPlayed = Object.keys(this.game.achievements[this.achievementId]);
        var userObject;
        var index = 0;
        for (const user of usersWhoAlreadyPlayed){
            userObject = Users.find(u => u.steam_id === user)
            //if it's not the user who triggered the achievement, if he unlocked it, and if he's in the guild user list
            if(user != this.achievementUser.steam_id && this.game.achievements[this.achievementId][user]!=0 && userObject.guilds.includes(guild.id)){
                context.drawImage(userObject.avatar, decal+40*(index+1), 140, 32, 32);
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
        const txt2_2 = "and by " + this.game.globalPercentages[this.achievementId] + " % of players.";
        context.fillText(txt2_1, 25, 165);
        context.fillText(txt2_2, decal+(index+1)*40, 165);

        attachment = new AttachmentBuilder(canvas.toBuffer())
        const unlock_rate = `${this.game.nbUnlocked[this.achievementUser.steam_id]}/${this.game.nbTotal}`;
        await guild.channel.send(`<@${this.achievementUser.discord_id}> unlocked an achievement on ${this.gameName}. Progress : (${unlock_rate})`);
        await guild.channel.send({ files: [attachment] })
        }
}

module.exports = {Achievement}