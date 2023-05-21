const array = []
const test = array.map(a => {
    return a
}).filter(notUndefined => notUndefined !== undefined);
console.log(test)