const {isPublicProfile} = require('./steam_interface.js')
isPublicProfile('76561198293620189').then(res=> console.log(res))