import { string } from "mathjs";
import Canvas from "canvas";
import fetch from "node-fetch";
import { print_compare, neverPlayed } from "./discord_interface.js";
//load steam profile pictures
async function get_avatars(API_Steam_key, users) {
  var ids = ""; //list
  users.forEach(user => ids += user.steam_id + ",")
  fetch(
    "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=" +
      API_Steam_key +
      "&steamids=" +
      ids
  ) //get player summaries
    .then(function (res) {
      if (res.ok) {
        return res.json();
      } else throw Error;
    })
    .then(async function (value) {
      await Promise.all(
        value.response.players.map(async (_user) => {
          Canvas.loadImage(_user.avatar) //load image
            .then(function (img) {
              users.find(user => user.steam_id === _user.steamid).avatar = img
              // user_dict[user.steamid]["avatar"] = img; //stock the loaded image in user_dict
            });
        })
      );
    })
    .catch(function (err) {
      console.error(err);
    });
}

//check if this achievement 'a' is unlocked for other users in the discord server (user_dict)
async function is_unlocked_for_others(a, API_Steam_key, users) {
  a["u_by"] = []; //users list who unlocked
  const o_users = users.filter(f => f!=a.user); //list of users without the one who unlocked the achievement

  await Promise.all(
    o_users.map(async (user) => {
      const contents = await fetch(
        "http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=" +
          a.ID_game +
          "&key=" +
          API_Steam_key +
          "&steamid=" +
          user.steam_id +
          "&l=en"
      ) //list of achievements for this game and user
        .then(function (res) {
          return res.json();
        })
        .then(function (value) {
          if (value.playerstats.success) {
            if (value.playerstats.achievements[a.a_n]["achieved"] == 1) {
              a["u_by"].push(user.steam_id);
            }
          }
        })
        .catch(function (err) {
          console.error("is_unlocked_for_others: ", err);
        });
    })
  );
}

//get the list of recently played games (for Steam, 'recently played game' is a game played in the last 2 weeks)
async function get_recently_played_games(ID_Steam, API_Steam_key) {
  const games = await fetch(
    "http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=" +
      API_Steam_key +
      "&steamid=" +
      ID_Steam +
      "&format=json"
  )
    .then(function (res) {
      if (res.ok) {
        return res.json();
      } else throw Error;
    })
    .then(function (value) {
      return value.response.games;
    })
    .catch(function (err) {
      console.error("get_recently_played_games", err);
    });
  return games;
}

//get game achievements for an user
async function get_achievements_to_print(
  user,
  API_Steam_key,
  game,
  t_0
) {
  const now = parseInt(Date.now());

  const achievements_to_print = await fetch(
    "http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=" +
      game.appid +
      "&key=" +
      API_Steam_key +
      "&steamid=" +
      user.steam_id +
      "&l=en"
  )
    .then(function (res) {
      if (res.ok) {
        return res.json();
      } else throw Error("GameID="+game.appid);
    })
    .then(async function (value) {
      var achievements_list = []; //list to display
      if (!value.playerstats.success) {
        console.log(user.nickname + " profile is not public");
        return achievements_list;
      }
      if (!value.playerstats.hasOwnProperty("achievements")) {
        console.log(game.name + " doesn't have achievements");
        return achievements_list;
      }

      var nb_unlocked = 0; //number of unlocked achievements for this game
      const nb_tot = value.playerstats.achievements.length; //total achievements for this game
      var n = 0;
      value.playerstats.achievements.forEach(function (a) {
        //check each achievement
        if (a.unlocktime != 0) {
          nb_unlocked++;
          if (
            a.unlocktime != 0 &&
            a.unlocktime > t_0 &&
            !user.a_dis.includes(a.apiname + user.steam_id)
          ) {
            //achievement is valid if it has been unlocked since bot is live and if it has not been displayed
            var a_valid = {
              ID_game: game.appid,
              Name_game: value.playerstats.gameName,
              a_n: n,
              a_id: a.apiname,
              a_name: a.name,
              a_descri: a.description,
              user: user,
            };
            achievements_list.push(a_valid); //add to achievements list to display
            user.a_dis.push(a.apiname + user.steam_id); //add to achievements list displayed (by user)
          }
        }
        n++;
      });
      console.log(
        "["+now+"] Found ",
        achievements_list.length,
        " new achievements for " +
          user.nickname +
          " on " +
          game.name
      );
      if (achievements_list.length != 0) {
        await Promise.all(
          achievements_list.map(async (achievement) => {
            await Promise.all([
              get_schema_for_game(achievement, API_Steam_key),
              getPercentage(achievement, nb_unlocked, nb_tot),
            ]);
          })
        );
        return achievements_list;
      } else return [];
    })
    .catch(function (err) {
      
    });
  return achievements_to_print;
}

async function get_schema_for_game(achievement_unlocked, API_Steam_key) {
  await fetch(
    "http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?appid=" +
      achievement_unlocked.ID_game +
      "&key=" +
      API_Steam_key
  ) //get infos on game achievements
    .then(function (res) {
      if (res.ok) {
        return res.json();
      } else {
        console.log(res);
        throw Error;
      }
    })
    .then(function (value) {
      const achievements = value.game.availableGameStats.achievements;
      achievements.forEach(function (a) {
        if (a.name == achievement_unlocked.a_id) {
          //select the right achievement just unlocked
          achievement_unlocked["icon"] = a.icon; //get the achievement icon
        }
      });
    })
    .catch(function (err) {
      console.error("get achievement infos error : ", err);
    });
}

async function getPercentage(achievement_unlocked, nb_unlocked, nb_tot) {
  await fetch(
    "http://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=" +
      achievement_unlocked.ID_game +
      "&format=json"
  ) //get gamers unlocked rate
    .then(function (res) {
      if (res.ok) {
        return res.json();
      } else throw Error;
    })
    .then(function (value) {
      const achievements = value.achievementpercentages.achievements;
      achievements.forEach(function (a) {
        if (a.name == achievement_unlocked.a_id) {
          //select the right achievement
          achievement_unlocked["percent"] = parseFloat(a.percent).toFixed(1);
        }
      });
    })
    .then(function () {
      achievement_unlocked["rate_unlocked"] =
        string(nb_unlocked) + "/" + string(nb_tot);
    })
    .catch(function (err) {
      console.error("get achievement infos error : ", err);
    });
}

async function compare(
  game_id,
  users,
  API_Steam_key,
  message,
  author,
  vs1
) {
  const author_id = author.steam_id
  var comp_dict = {};
  var nb_tot = 0;
  var game_name;
  var checked = [];
  //get all achievements for each player for this game
  const result_comparaison = await Promise.all(
    users.map(async (user) => {
      var ach_dict = await fetch(
        "http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=" +
          game_id +
          "&key=" +
          API_Steam_key +
          "&steamid=" +
          user.steam_id +
          "&l=en"
      )
        .then(function (res) {
          return res.json();
        })
        .then(function (value) {
          var _ach_dict = { a_unlocked: [] };
          var nb_unlocked = 0; //number of unlocked achievements for this game
          if (value.playerstats.success) {
            nb_tot = value.playerstats.achievements.length; //total achievements for this game
            game_name = value.playerstats.gameName;
            value.playerstats.achievements.forEach(function (a) {
              //check each achievement
              if (a.unlocktime != 0) {
                nb_unlocked++;
                if (user.steam_id === author_id) {
                  checked.push(a.apiname);
                }
                _ach_dict["a_unlocked"].push([a.apiname, a.description]);
              }
            });
          }
          _ach_dict["nb_unlocked"] = nb_unlocked;
          return _ach_dict;
        })
        .catch(function (err) {
          console.log(err);
        });
      comp_dict[user.steam_id] = ach_dict;
    })
  );

  if (comp_dict[author_id]["nb_unlocked"] == 0) {
    neverPlayed(author, message.channel);
    return;
  }

  var to_print_nb = {};
  to_print_nb["nb_tot"] = nb_tot;
  Object.keys(comp_dict).forEach(function (user) {
    to_print_nb[user] = comp_dict[user]["nb_unlocked"];
  });

  var to_print_achievements = [];

  //Get infos for achievements not unlocked by user
  const o_users = users.filter(f => f.steam_id!=author_id); //list of users without the one who wants to compare
  for (const user of o_users) {
    for (const a of comp_dict[user.steam_id]["a_unlocked"]) {
      //list of achievements unlocked by user
      if (!checked.includes(a[0])) {
        //if not in the unlocked achievements by author list
        var users_who_unlocked = [user.steam_id]; //list of users who unlocked this achievement
        for (const other_other_u of o_users) {
          if (other_other_u.steam_id != user.steam_id) {
            for (const achievement of comp_dict[other_other_u.steam_id]["a_unlocked"]) {
              if (achievement[0] === a[0]) {
                users_who_unlocked.push(other_other_u.steam_id);
                break;
              }
            }
          }
        }
        to_print_achievements.push([users_who_unlocked, a]);
        checked.push(a[0]);
      }
    }
  }

  await Promise.all(
    to_print_achievements.map(async (achievement) => {
      var dict_a = { ID_game: game_id, a_id: achievement[1][0] };
      await get_schema_for_game(dict_a, API_Steam_key);
      achievement.push(dict_a.icon);
    })
  );

  print_compare(
    to_print_nb,
    to_print_achievements,
    users,
    message,
    game_name,
    author,
    vs1
  );
}

export {
  get_avatars,
  is_unlocked_for_others,
  get_recently_played_games,
  get_achievements_to_print,
  compare,
};
