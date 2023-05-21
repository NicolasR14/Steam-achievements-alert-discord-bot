const array = [1, 2, 3]
const test = array.map(a => {
    if (!array.includes(a))
        return a
}).filter(notUndefined => notUndefined !== undefined);
console.log(test)