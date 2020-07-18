import gameRoute from './game'
import hallRoute from './hall'

export default (io, redis, db) => {
    // console.log('socket begin')
    let game = io.of('/game')
    let room = io.of('/')
    game.on('connection', socket => gameRoute(socket, redis, db))
    room.on('connection', socket => hallRoute(socket, redis, db))
}
