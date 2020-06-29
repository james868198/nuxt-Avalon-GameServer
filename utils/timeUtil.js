export default {
    clock: () => {
        sec = sec + 1
        if (sec >= 60) {
            min = min + 1
            sec = 0
        }
        if (min >= 60) {
            hr = hr + 1
            min = 0
        }
        console.log(hr, min, sec)
    },
    clockStart: () => {
        setInterval(this.clock, 1000)
    }
}
