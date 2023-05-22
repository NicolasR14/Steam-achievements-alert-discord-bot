# Steam achievements alert discord bot
This is a discord bot showing Steam achievements when unlocked and has other features to see the achievements not yet unlocked.
It uses Azure SQL server, Discord API and Steam API and you'll need keys for both. Refer to https://discord.com/developers/docs/intro to know how to add a bot in a discord server.
It can work on multiple servers.

## Features
### New Steam achievement unlocked message alert

![image](https://github.com/NicolasR14/Steam-achievements-alert-discord-bot/assets/101961437/25dfc808-7689-4629-96b6-772a79a97f6a)

Send text and image messages in a specified channel when a new achievement is detected for one of the players on one of the games in a specific server list. It updates every 60 seconds.

It shows also who already unlocked this achievement among the other players registered and the global percentage. It also displays the player's current progress for the game.

### List of locked achievements for a specific game

![image](https://github.com/NicolasR14/Steam-achievements-alert-discord-bot/assets/101961437/6d271fdf-99b3-4db4-8e0e-9b6f2daa5e24)

Shows the progress of each player for a specified game and the time played.

Shows achievements that are still locked for the user writing the command, the global unlock percentage and the avatar icons of other players who unlocked each achievement. It displays the list on multiple pages.

There is a variant of this command to display achievements that are locked for the player writing the command AND that are unlocked for at least one of other players in the list. There is another variant to display all game achievements.

## Config
To use this bot you will need a SQL Azure Server, an API key for Steam DB, and an API Key for your bot on discord. An example config.json file is provided.
Do /help to see the commands to setup the games and users lists.
