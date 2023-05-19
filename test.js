const achievements = { '1': { 'a': 9999, 'b': 0 }, '2': { 'a': 0, 'b': 0 }, '3': { 'a': 0, 'b': 9999 }, '4': { 'a': 0, 'b': 9999 } }
const validAchievements = Object.entries(achievements).map(([a, u]) => {
    if (u['a'] === 0) {
        const playersWhoUnlocked = Object.entries(u).filter(([_u, unlocked_time]) => unlocked_time != 0).map(([_u, unlocked_time]) => _u)
        if (playersWhoUnlocked.length > 0) {
            return [a, playersWhoUnlocked]
        }
    }

}).filter(notUndefined => notUndefined !== undefined);
console.log(validAchievements)


    // if (v['a'] == 0 && (Object.values(v).filter(unlocked_time => unlocked_time != 0).length > 0) ? true : false) {
    //     return [k, [Object.values(v).filter(unlocked_time => unlocked_time != 0)]]
    // }
    // return (v['a'] == 0 && (Object.values(v).filter(unlocked_time => unlocked_time != 0).length > 0) ? true : false)