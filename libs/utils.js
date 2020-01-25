/* string utils*/

//file & file path
//todo null/empty string check
export const getExtension = filename => filename.split('.').pop()
export const getFilename = path => path.toString().replace(/^.*[\\\/]/, '')


/* math utils */
export function constrain(n, low, high) {
    return Math.max(Math.min(n, high), low)
}

export function remap(n, start1, stop1, start2, stop2, withinBounds) {
    const newval = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2
    if (!withinBounds) {
        return newval
    }
    if (start2 < stop2) {
        return constrain(newval, start2, stop2)
    } else {
        return constrain(newval, stop2, start2)
    }
}


//todo redo below 2 fns
export function getDateTime() {
    let d = new Date()
    return ("00" + (d.getMonth() + 1)).slice(-2) + "-" +
        ("00" + d.getDate()).slice(-2) + "-" +
        ("00" + d.getHours()).slice(-2) + "h" +
        ("00" + d.getMinutes()).slice(-2) + "m" +
        ("00" + d.getSeconds()).slice(-2) + "s"
}

export function getDate() {
    let d = new Date()
    return ("00" + (d.getMonth() + 1)).slice(-2) + "-" + ("00" + d.getDate()).slice(-2)
}

export function toLocaleUTCDateString(date) {
    let formatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    })

    return formatter.formatToParts(date).map(({type, value}) => {
        switch (type) {
            case 'day': return date.getUTCDate()
            case 'hour': return date.getUTCHours()
            case 'minute': return date.getUTCMinutes()
            case 'month': return date.getUTCMonth() + 1
            case 'second': return date.getUTCSeconds()
            case 'timeZoneName': return "UTC"
            case 'year': return date.getUTCFullYear()
            default : return value
        }
    }).reduce((string, part) => string + part)
}


export function promisify(fn) {
    return function promisified(...params) {
        return new Promise((resolve, reject) =>
            fn(...params.concat([(err, ...args) => err ? reject(err) : resolve( args.length < 2 ? args[0] : args )])))
    }
}