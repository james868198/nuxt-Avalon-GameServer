import gameController from '../socketControllers/gameController'
import userController from '../socketControllers/userController'

const curRoomName = 'hall'

export default (socket, redis, db) => {
    socket.userName = ''
    socket.join(curRoomName)
    console.log('socket start, id:%s', socket.id)

    socket.emit('message', {
        userName: 'System',
        message: `Welcome to join us.`
    })
   
    socket.on('createUser',(data) => userController.createUser(socket,redis,data))
    socket.on('getUser',(data) => userController.getUser(socket,redis,data))

    socket.on('chat', data => {
        console.log('socket chat', data)
        socket.to(curRoomName).emit('message', data)
        socket.emit('message', data)
    })

    socket.on('createGame', data => gameController.createGame(socket, db, data))

    socket.on('getGames', () => gameController.getGames(socket, db))

    socket.on('disconnect', () => {
        console.log('socket disconnect')
    })
}
