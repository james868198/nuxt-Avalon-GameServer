import gameController from '../socketControllers/gameController'

export default (socket, db) => {
    socket.userName = ''
    socket.room = null
    socket.player = {
        name: 'gamer'
    }
    console.log('game socket start, id:%s', socket.id)
    socket.emit('message', {
        userName: 'System',
        message: `Welcome!`
    })
    // on
    socket.on('chat', data => {
        if (!socket.room) {
            return
        }
        console.log('socket chat', data)
        socket.to(socket.room).emit('message', data)
        socket.emit('message', data)
    })
    socket.on('joinGame', data => gameController.joinGame(socket, db, data))

    socket.on('getGameById', id => gameController.getGameById(socket, db, id))

    socket.on('getIdentity', () => gameController.getPlayerInfo(socket, db))

    socket.on('quest', data => gameController.quest(socket, db, data))

    socket.on('unQuest', data => gameController.unQuest(socket, db, data))

    socket.on('vote', data => gameController.vote(socket, db, data))

    socket.on('action', data => gameController.action(socket, db, data))

    socket.on('assassinate', data =>
        gameController.assassinate(socket, db, data)
    )

    socket.on('disconnect', () => gameController.leaveGame(socket, db))

    // socket.on('startGame', () => gameController.startGame(socket, db, data))
}
