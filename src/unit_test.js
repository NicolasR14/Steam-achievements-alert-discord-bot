const {User} = require('./models/User.js')
const {Game} = require('./models/Game.js')

const t_0 = parseInt(1683531420000/1000);
var Games = []
Games.push(new Game('sot','1172620',['1090689983305756672']))
Games.push(new Game('northgard','466560',['1090689983305756672']))
async function test(){
    var Users = [new User('76561198141070801','222007745035894784','SuperLambda',['1090689983305756672'])]

    await Promise.all(Users.map(async user => {
        await user.getRecentlyPlayedGames(Games)
        await Promise.all(user.recentlyPlayedGames.map(game => game.updateAchievements(user,t_0)))
        console.log(user.newAchievements.length)
    }))

    const nb_new_achievements = Users.reduce((accumulator, user) => accumulator + user.newAchievements.length,0)

    if(nb_new_achievements>0){
        await Promise.all(Games.map(async game => {
            await game.updateGlobalPercentage()
            await game.getAchievementsIcon()
        }))
        nb_new_achievements.forEach(achievement => {
            //GET MESSAGE
            //GET CANVAS
            //foreach guild => display
        });


    
    }



    console.log(Users)
    
    
    
    //Get percentage achievements for the games
}

test()