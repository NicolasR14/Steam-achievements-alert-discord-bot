class Achievement {
    constructor(game,gameName,achievementId,achievementName,achievementDescription,achievementUser){
        this.game = game;
        this.gameName = gameName;
        this.achievementId = achievementId;
        this.achievementName = achievementName;
        this.achievementDescription = achievementDescription;
        this.achievementUser = achievementUser
    }

    getDiscordMessage(){
        const unlock_rate = `${this.game.nbUnlocked[this.achievementUser.steam_id]}/${this.game.nbTotal}`;
        return `<@${this.achievementUser.discord_id}> unlocked an achievement on ${this.gameName}. Progress : (${unlock_rate}`;
    }

    getDiscordCanvas(){
        //TODO
    }
}

module.exports = {Game}