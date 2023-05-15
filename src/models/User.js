class User {
    constructor(steam_id,discord_id,nickname,guilds){
      this.steam_id = steam_id;
      this.discord_id= discord_id;
      this.nickname = nickname;
      this.a_dis = [];
      this.guilds = guilds;
      this.avatar;
    }
}

module.exports = {User}