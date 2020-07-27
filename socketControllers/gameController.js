/**
 * Updated by James on 7/1/2020
 * 
 * process request to game 
 * 
 * createGame
 * joinGame
 * leaveGame
 * getGames
 * getGameById
 * getPlayerInfo // get PlayerInfo and updated playerData 
 * quest
 * unQuest
 * vote
 * action
 * assassinate
 */

import resUtil from '../utils/resUtil'


const controller = {
    createGame: (socket, db, data) => {
        console.log('[gameController][createGame]', data)
        const respData = resUtil.getDefaultRes()
        try {
            const gameId = db.createGame(data.roomName, data.numOfPlayers)
            if (!gameId) {
                respData['status'] = 'fail'
                respData['error']['code'] = 10001
                respData['error']['description'] = 'create game fail'
                socket.emit('response', respData)               
                return
            }
            respData['data']['gameId'] = gameId
            socket.emit('response', respData)
            
        } catch (error) {
            console.log('error:', error)
            respData['status'] = 'fail'
            respData['error']['code'] = 11111
            respData['error']['description'] = `unexpected error:${error}`
            socket.emit('response', respData)
        }
    },
    joinGame: async (socket, db, redis, data) => {
        console.log('[gameController][joinGame]')
        console.log('[gameController][joinGame] input data:', data)
        const respData = resUtil.getDefaultRes()
        let playerData = {
            userId: data.userId,
            name: data.userName,
            status: 'on'
        }
        socket.userId = data.userId
        socket.room = data.gameId

        try {
            if (!data.userId) {
                console.log('fail: found no userId')
                respData['status'] = 'fail'
                respData['error']['code'] = 10003
                respData['error']['description'] = 'found no userId'
                socket.emit('response', respData)
                return
            }
            const res = await redis.hget(data.userId, "userName");
            console.log('[gameController][joinGame] redis userName',res)

            const game = db.getGameById(data.gameId)
            // check game existed
            if (!game) {
                console.log('fail: found no game')
                respData['status'] = 'fail'
                respData['error']['code'] = 10002
                respData['error']['description'] = 'found no game'
                socket.emit('response', respData)
                return
            }
            socket.join(data.gameId)
            // check game status
            if (game.room.status === 'over') {
                console.log('fail: game was already over.')
                respData['status'] = 'fail'
                respData['error']['code'] = 10001
                respData['error']['description'] = 'game was already over.'
                socket.emit('response', respData)
                return
            } else if (game.room.status === 'pending') {
                const full = game.isFull;
                if (full) {
                    console.log('fail: game is full')
                    respData['status'] = 'fail'
                    respData['error']['code'] = 10001
                    respData['error']['description'] = 'game is full.'
                    socket.emit('response', respData)
                    return
                }
               
                // get player id in game
                // playerData["id"] = game.room.nowPlayerAmount
                if (!game.isPlayerInGame(data.userId)) {
                    game.addPlayer(playerData)
                }
                
                socket.to(socket.room).emit('message', {
                    userName: 'System',
                    message: `Welcome ${playerData.name}.`
                })
            } else {
                if (game.isPlayerInGame(data.userId)) {
                    playerData = game.updatePlayerData(data.userId,"status","on")
                    socket.to(socket.room).emit('message', {
                        userName: 'System',
                        message: `${playerData.name} is back.`
                    })
                } else {
                    respData['status'] = 'fail'
                    respData['error']['code'] = 10001
                    respData['error']['description'] = 'you are not in game'
                    socket.emit('response', respData)
                    return
                }
            }           
            console.log("playerData:", playerData)
            socket.playerData = playerData
            respData['data']['game'] = game.publicData
            socket.to(socket.room).emit('response', respData)

            respData['data']['player'] =  playerData
            socket.emit('response', respData)
            // check game full again
            if (game.isFull && game.room.status === "pending") {
                // console.log(this)
                controller.startGame(socket, db)
            }
        } catch (error) {
            console.log('error:', error)
            respData['status'] = 'fail'
            respData['error']['code'] = 11111
            respData['error']['description'] = `unexpected error:${error}`
            socket.emit('response', respData)
        }
    },
    startGame: (socket, db) => {
        console.log('[gameController][startGame]')
        const room = socket.room
        console.log('[gameController][startGame] start room:', room)
        const game = db.getGameById(room)
        game.start()

        // return initilization game data
        const respData = resUtil.getDefaultRes()
        respData.data['game'] = game.publicData
        socket.emit('response', respData)
        socket.to(socket.room).emit('response', respData)
       
        const roundTimer = setInterval(() => {
            
            const status = game.room.status
            const stage = game.data.stage
            const time = game.time_counter
            respData.data['time'] = time
            socket.emit('response', respData)
            socket.to(socket.room).emit('response', respData)
            // console.log("roundTimer: status,stage=", status, game.data)
            if (status != 'start') {
                clearInterval(roundTimer)
            }
            switch (stage) {
                case 'questing':
                    if (time < 0) {
                        console.log('[gameController][roundTimer] timeout, complete questing')
                        game.completeQuesting()
                        console.log('[gameController][roundTimer] stage:', game.data.stage)
                        respData.data['game'] = game.publicData
                        socket.emit('response', respData)
                        socket.to(socket.room).emit('response', respData)
                    }
                    break
                case 'voting':
                    if (time < 0) {
                        console.log('[gameController][roundTimer] timeout, complete voting')
                        game.completeVoting()
                        respData.data['game'] = game.publicData
                        socket.emit('response', respData)
                        socket.to(socket.room).emit('response', respData)
                        console.log('[gameController][roundTimer] stage:', game.data.stage)
                    }
                    break
                case 'action':
                    if (time < 0) {
                        console.log('[gameController][roundTimer] timeout, complete action')
                        game.completeAction()
                        respData.data['game'] = game.publicData
                        socket.emit('response', respData)
                        socket.to(socket.room).emit('response', respData)
                        console.log('[gameController][roundTimer] stage:', game.data.stage)
                    }
                    break
                case 'assassinating':
                    if (time < 0) {
                        console.log('[gameController][roundTimer] timeout, complete assassinating')
                        game.completeAssassinate()
                        respData.data['game'] = game.publicData
                        socket.emit('response', respData)
                        socket.to(socket.room).emit('response', respData)
                        console.log('[gameController][roundTimer] stage:', game.data.stage)
                    }
                    break
                case 'end':
                    console.log('[gameController][roundTimer] stage: end, game over')
                    game.over()
                    respData.data['game'] = game.publicData
                    socket.emit('response', respData)
                    socket.to(socket.room).emit('response', respData)
                    console.log('[gameController][roundTimer] stage:', game.data.stage)
                    clearInterval(roundTimer)
                    break
                default:
                    console.log('[gameController][roundTimer] timeout, stage.error: ', stage)
                    clearInterval(roundTimer)
                    break
            }
            game.countTime()
        }, 1000)
    },
    leaveGame: (socket, db) => {
        console.log('[gameController][leaveGame]')
        // if (!socket.room) {
        //     console.log()
        //     return
        // }
        const respData = resUtil.getDefaultRes()
        try {
            const game = db.getGameById(socket.room)
            if (!game) {
                console.log('[gameController][leaveGame] found no game')
                respData['status'] = 'fail'
                respData['error']['code'] = 10002
                respData['error']['description'] = 'found no game'
                socket.emit('response', respData)
                return
            }
            if (game.room.status == 'pending') {
                console.log('[gameController][leaveGame] leave pending game')
                game.removePlayer(socket.userId)
            } else if (game.room.status == 'over'){
                console.log('[gameController][leaveGame] leave over game')
                game.removePlayer(socket.userId)
            } else {
                console.log('[gameController][leaveGame] player afk')
                game.updatePlayerData(socket.userId,'status','off')
            }
            
            if (socket.playerData && socket.playerData.name) {
                socket.to(socket.room).emit('message', {
                    userName: 'System',
                    message: `${socket.playerData.name} left the room.`
                })
            }
            respData.data = {
                game: game.publicData
            }
            socket.to(socket.room).emit('response', respData)
           
        } catch (error) {
            console.log('error:', error)
            respData['status'] = 'fail'
            respData['error']['code'] = 11111
            respData['error']['description'] = `unexpected error:${error}`
            socket.emit('response', respData)
        }
    },
    getGames: (socket, db) => {
        console.log('[gameController][getGames]')
        const games = db.getGames
        socket.emit('games', games)
    },
    getGameById: (socket, db, id) => {
        console.log('[gameController][getGameById]')
        const respData = resUtil.getDefaultRes()
        try {
            const game = db.getGameById(id)
            respData.data = {
                game: game.publicData
            }
            socket.emit('response', respData)
            socket.to(socket.room).emit('response', respData)
        } catch (error) {
            respData['status'] = 'fail'
            respData['error']['code'] = 11111
            respData['error']['description'] = `unexpected error:${error}`
            socket.emit('response', respData)
        }
    },
    getPlayerInfo: (socket, db) => {
        console.log('[gameController][getPlayerInfo]', socket.userId)
        const respData = resUtil.getDefaultRes()
        if (!socket.userId || !socket.room) {
            respData['status'] = 'fail'
            respData['error']['code'] = 11110
            respData['error']['description'] = 'not authorized connection'
            socket.emit('response', respData)
            return
        }

        try {
            const game = db.getGameById(socket.room)
            if (!game) {
                console.log('fail: found no game')
                respData['status'] = 'fail'
                respData['error']['code'] = 10002
                respData['error']['description'] = 'found no game'
                socket.emit('response', respData)
                return
            }
            // update playerData to get player id
            const playerData = game.getPlayerDataByUserId(socket.userId)
            socket.playerData = playerData
            console.log("[gameController][getPlayerInfo] getPlayerDataByUserId", socket.playerData)
            if (socket.playerData.id === undefined) {
                console.log('fail: found no game')
                respData['status'] = 'fail'
                respData['error']['code'] = 10002
                respData['error']['description'] = 'found no player id'
                socket.emit('response', respData)
                return
            }
            const Info = game.getPlayerInfoById(socket.playerData.id)
            respData.data = {
                playerInfo: Info,
                player: playerData
            } 
            socket.emit('response', respData)
        } catch (error) {
            console.log('error:', error)
            respData['status'] = 'fail'
            respData['error']['code'] = 11111
            respData['error']['description'] = `unexpected error:${error}`
            socket.emit('response', respData)
        }
    },
    // in game
    quest: (socket, db, data) => {
        console.log('[gameController][quest] data:', data)
        const respData = resUtil.getDefaultRes()

        try {
            
            if (data == null || data.memberList == null) {
                console.log('fail: empty data')
                respData['status'] = 'fail'
                respData['error']['code'] = 10000
                respData['error']['description'] = 'empty data'
                socket.emit('response', respData)
                return
            }
            const onmissions = data.memberList
            const game = db.getGameById(socket.room)
            if (!game) {
                console.log('fail: found no game')
                respData['status'] = 'fail'
                respData['error']['code'] = 10002
                respData['error']['description'] = 'found no game'
                socket.emit('response', respData)
                return
            }
            const res = game.quest(socket.playerData.id, onmissions)
            if (res>0) {
                respData.data = {
                    game: game.publicData
                } 
                socket.emit('response', respData)
                socket.to(socket.room).emit('response', respData)
            } else {
                console.log('[gameController][quest] fail: validation error')
                respData['status'] = 'fail'
                respData['error']['code'] = 10000
                respData['error']['description'] = 'validation error'
                socket.emit('response', respData)
            }
        } catch (error) {
            console.log('error:', error)
            respData['status'] = 'fail'
            respData['error']['code'] = 11111
            respData['error']['description'] = `unexpected error:${error}`
            socket.emit('response', respData)
        }
    },
    unQuest: (socket, db, data) => {
        console.log('[gameController][unQuest]')
        const respData = resUtil.getDefaultRes()
        try {
            const game = db.getGameById(socket.room)
            const unquestId = parseInt(data.playerId)
            console.log('[gameController][unQuest]',data, unquestId)
            const res = game.unQuest(socket.playerData.id, unquestId)
            if (res>0) {
                respData.data = {
                    game: game.publicData
                } 
                socket.emit('response', respData)
                socket.to(socket.room).emit('response', respData)
            } else {
                console.log('[gameController][unQuest] fail: validation error')
                respData['status'] = 'fail'
                respData['error']['code'] = 10000
                respData['error']['description'] = 'validation error'
                socket.emit('response', respData)
            }
        } catch (error) {
            console.log('error:', error)
            respData['status'] = 'fail'
            respData['error']['code'] = 11111
            respData['error']['description'] = `unexpected error:${error}`
            socket.emit('response', respData)
        }
    },
    vote: (socket, db, data) => {
        console.log('[gameController][vote]')
        try {
            const game = db.getGameById(socket.room)
            game.vote(socket.playerData.id, data.vote)
            const respData = {
                status: 'success',
                data: {
                    game: game.publicData
                }
            }
            socket.emit('response', respData)
            socket.to(socket.room).emit('response', respData)
        } catch (error) {
            console.log('error:', error)
            respData['status'] = 'fail'
            respData['error']['code'] = 11111
            respData['error']['description'] = `unexpected error:${error}`
            socket.emit('response', respData)
        }
    },
    action: (socket, db, data) => {
        console.log('[gameController][action]')
        try {
            const game = db.getGameById(socket.room)
            const result = game.action(socket.playerData.id, data.action)
            const respData = {
                status: 'success',
                data: {
                    game: game.publicData
                }
            }
            if (!result) {
                respData.status = 'fail'
            }
            socket.emit('response', respData)
            socket.to(socket.room).emit('response', respData)
        } catch (error) {
            console.log('error:', error)
            respData['status'] = 'fail'
            respData['error']['code'] = 11111
            respData['error']['description'] = `unexpected error:${error}`
            socket.emit('response', respData)
        }
    },
    assassinate: (socket, db, data) => {
        console.log('[gameController][assassinate]')
        if (!socket || !db || !data) {
            return
        }
        if (!data.target) {
            return
        }
        try {
            const game = db.getGameById(socket.room)
            const result = game.assassinate(socket.playerData.id, data.target)
            const respData = {
                status: 'success',
                data: {
                    game: game.publicData
                }
            }
            if (!result) {
                respData.status = 'fail'
            }
            socket.emit('response', respData)
            socket.to(socket.room).emit('response', respData)
        } catch (error) {
            console.log('error:', error)
            respData['status'] = 'fail'
            respData['error']['code'] = 11111
            respData['error']['description'] = `unexpected error:${error}`
            socket.emit('response', respData)
        }
    },
    // for testing
    moveStage: (socket, db) => {
        console.log('[gameController][moveStage]')
        try {
            const game = db.getGameById(socket.room)
            if(!game) {
                console.log('fail: found no game')
                respData['status'] = 'fail'
                respData['error']['code'] = 10002
                respData['error']['description'] = 'found no player id'
                socket.emit('response', respData)
                return
            }
            game.assignTime(10)
            const respData = {
                status: 'success',
                data: {
                    game: game.publicData
                }
            }
            socket.emit('response', respData)
            socket.to(socket.room).emit('response', respData)
        } catch (error) {
            console.log('error:', error)
            respData['status'] = 'fail'
            respData['error']['code'] = 11111
            respData['error']['description'] = `unexpected error:${error}`
            socket.emit('response', respData)
        }
    }
}   

export default controller
