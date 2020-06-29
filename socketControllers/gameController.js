// 資料驗證
// 邏輯處理
// 資料回傳
import avalonRule from '../Avalon'
const QUESI_SEC = avalonRule.turnInterval
const VOTE_SEC = avalonRule.decisionInterval
const ACTION_SEC = avalonRule.decisionInterval
const ASSAINATION_SEC = avalonRule.assassinationInterval

const controller = {
    createGame: (socket, db, data) => {
        console.log('[gameController][createGame]', data)
        try {
            const gameId = db.createGame(data.roomName, data.numOfPlayers)
            if (!gameId) {
                const respData = {
                    status: 'fail',
                    error: {
                        code: 10001,
                        description: 'create game fail'
                    }
                }
                socket.emit('response', respData)
                return
            }
            const respData = {
                status: 'success',
                data: {
                    gameId: gameId
                }
            }
            socket.emit('response', respData)
        } catch (error) {
            console.log('error:', error)
            const respData = {
                status: 'fail',
                error: {
                    code: 11111,
                    description: `unexpected error:${error}`
                }
            }
            socket.emit('response', respData)
        }
    },
    joinGame: (socket, db, data) => {
        console.log('[gameController][joinGame]')
        console.log('[gameController][joinGame] input data:', data)
        const respData = {
            status: 'fail',
            error: {
                code: 10000,
                description: null
            }
        }
        try {
            const game = db.getGameById(data.gameId)
            // check game existed
            if (!game) {
                respData['error']['description'] = 'found no game'
                socket.emit('response', respData)
                return
            }
            // check game status
            if (game.status === 'over') {
                respData['error']['description'] = 'game was already over.'
                socket.emit('response', respData)
                return
            } else if (game.status === 'pending') {
                if (game.full) {
                    socket.emit('response', respData)
                    return
                }
               
                socket.userId = data.userId
                socket.userName = data.userName
                socket.room = data.gameId
                socket.join(data.gameId)
                const playerData = {
                    userId: data.userId,
                    name: data.userName,
                    id: game.nowPlayerAmount,
                    status: 'on'
                }
                socket.player = playerData
                if (!game.isPlayerInGame(data.userId)) {
                    game.addPlayer(playerData)
                }
                
                socket.to(socket.room).emit('message', {
                    userName: 'system',
                    message: `Welcome ${socket.userName}.`
                })
            } else {
                if (game.isPlayerInGame(data.userId)) {
                    const playerData = game.updatePlayerData(data.userId,"status","on")
                    socket.player = playerData
                    socket.userId = data.userId
                    socket.userName = data.userName
                    socket.room = data.gameId
                    socket.join(data.gameId)
                    socket.to(socket.room).emit('message', {
                        userName: 'system',
                        message: `${socket.userName} is back.`
                    })
                } else {
                    respData['error']['description'] = 'you are not in game'
                    socket.emit('response', respData)
                    return
                }
            }           
            
            respData['status'] = 'success'
            respData['data'] =  {
                game: game.gameData
            }
        
            socket.to(socket.room).emit('response', respData)
            socket.emit('response', respData)
            // check game full again
            if (game.full && game.status === "pending") {
                // console.log(this)
                controller.startGame(socket, db)
            }
        } catch (error) {
            console.log('error:', error)
            const respData = {
                status: 'fail',
                error: {
                    code: 11111,
                    description: `unexpected error:${error}`
                }
            }
            socket.emit('response', respData)
        }
    },
    startGame: (socket, db) => {
        console.log('[gameController][startGame]')
        const game = db.getGameById(socket.room)
        game.start()
        // set paramters
        let result = null
        let time = 0

        const roundTimer = setInterval(() => {
            const respData = {
                status: 'success',
                data: {
                    time: time,
                    game: game.gameData
                }
            }
            socket.emit('response', respData)
            socket.to(socket.room).emit('response', respData)
            result = game.missionResult
            const status = game.status
            const roundStage = game.round.stage
            if (status == 'start') {
                if (roundStage === 'questing') {
                    if (time >= QUESI_SEC) {
                        time = 0
                    }
                } else if (roundStage === 'voting') {
                    if (time >= VOTE_SEC) {
                        time = 0
                    }
                } else if (roundStage === 'action') {
                    if (time >= ACTION_SEC) {
                        time = 0
                    }
                } else {
                    this.round.time = 0
                    this.resetRound()
                    clearInterval(roundTimer)
                }
            } else if (status == 'assassination') {
                if (time >= ASSAINATION_SEC) {
                    time = 0
                }
            } else if (status == 'over') {
                clearInterval(roundTimer)
            }
            time++
        }, 1000)
    },
    leaveGame: (socket, db) => {
        console.log('[gameController][leaveGame]')
        // if (!socket.room) {
        //     return
        // }

        try {
            const game = db.getGameById(socket.room)
            if (!game) {
                console.log('[gameController][leaveGame] found no game')
                const respData = {
                    status: 'fail',
                    error: {
                        code: 10000,
                        description: 'found no game'
                    }
                }
                socket.emit('response', respData)
                return
            }
            if (game.status == 'pending') {
                console.log('[gameController][leaveGame] leave pending game')
                game.removePlayer(socket.player)
                const respData = {
                    status: 'success',
                    data: {
                        game: game.gameData
                    }
                }
                socket.to(socket.room).emit('response', respData)
            } else {
                console.log('[gameController][leaveGame] player afk')
                const playerData = game.updatePlayerData(socket.player.userId,'status','off')
                if (playerData) {
                    socket.player = playerData
                }
            }
            socket.to(socket.room).emit('message', {
                userName: 'system',
                message: `${socket.userName} left the room.`
            })
        } catch (error) {
            console.log('error:', error)
            const respData = {
                status: 'fail',
                error: {
                    code: 11111,
                    description: `unexpected error:${error}`
                }
            }
            socket.emit('response', respData)
        }
    },
    getGames: (socket, db) => {
        console.log('[gameController] getGames')
        const games = db.getGames
        socket.emit('games', games)
    },
    getGameById: (socket, db, id) => {
        console.log('[gameController] getGameById')
        try {
            const game = db.getGameById(id)
            const respData = {
                status: 'success',
                data: {
                    room: game.roomData,
                    game: game.gameData
                }
            }
            socket.emit('response', respData)
            socket.to(socket.room).emit('response', respData)
        } catch (error) {
            console.log('error:', error)
            const respData = {
                status: 'fail',
                error: {
                    code: 11111,
                    description: `unexpected error:${error}`
                }
            }
            socket.emit('response', respData)
        }
    },
    getPlayerInfo: (socket, db) => {
        console.log('[gameController] getPlayerInfo', socket.player)
        if (!socket.player) {
            const respData = {
                status: 'fail',
                error: {
                    code: 11110,
                    description: `input not qualified`
                }
            }
            socket.emit('response', respData)
            return
        }
        try {
            const game = db.getGameById(socket.room)
            const playerInfo = game.getPlayerInfoById(socket.player.id)
            socket.player.identity = playerInfo
            const respData = {
                status: 'success',
                data: {
                    player: socket.player
                }
            }
            socket.emit('response', respData)
        } catch (error) {
            console.log('error:', error)
            const respData = {
                status: 'fail',
                error: {
                    code: 11111,
                    description: `unexpected error:${error}`
                }
            }
            socket.emit('response', respData)
        }
    },
    // in game
    quest: (socket, db, data) => {
        console.log('[gameController]quest')
        try {
            const game = db.getGameById(socket.room)
            if (game.round.leader !== socket.player.id) {
                return
            }
            const questId = parseInt(data.playerId)
            game.quest(socket.player.id, questId)
            const respData = {
                status: 'success',
                data: {
                    game: game.gameData
                }
            }
            socket.emit('response', respData)
            socket.to(socket.room).emit('response', respData)
        } catch (error) {
            console.log('error:', error)
            const respData = {
                status: 'fail',
                error: {
                    code: 11111,
                    description: `unexpected error:${error}`
                }
            }
            socket.emit('response', respData)
        }
    },
    unQuest: (socket, db, data) => {
        try {
            const game = db.getGameById(socket.room)
            if (game.round.leader !== socket.player.id) {
                return
            }
            game.unQuest(data.playerId)
            const respData = {
                status: 'success',
                data: {
                    game: game.gameData
                }
            }
            socket.emit('response', respData)
            socket.to(socket.room).emit('response', respData)
        } catch (error) {
            console.log('error:', error)
            const respData = {
                status: 'fail',
                error: {
                    code: 11111,
                    description: `unexpected error:${error}`
                }
            }
            socket.emit('response', respData)
        }
    },
    vote: (socket, db, data) => {
        console.log('[gameController]vote')
        try {
            const game = db.getGameById(socket.room)
            game.vote(socket.player.id, data.vote)
            const respData = {
                status: 'success',
                data: {
                    game: game.gameData
                }
            }
            socket.emit('response', respData)
            socket.to(socket.room).emit('response', respData)
        } catch (error) {
            console.log('error:', error)
            const respData = {
                status: 'fail',
                error: {
                    code: 11111,
                    description: `unexpected error:${error}`
                }
            }
            socket.emit('response', respData)
        }
    },
    action: (socket, db, data) => {
        console.log('[gameController]action')
        try {
            const game = db.getGameById(socket.room)
            const result = game.action(socket.player.id, data.action)
            const respData = {
                status: 'success',
                data: {
                    game: game.gameData
                }
            }
            if (!result) {
                respData.status = 'fail'
            }
            socket.emit('response', respData)
            socket.to(socket.room).emit('response', respData)
        } catch (error) {
            console.log('error:', error)
            const respData = {
                status: 'fail',
                error: {
                    code: 11111,
                    description: `unexpected error:${error}`
                }
            }
            socket.emit('response', respData)
        }
    },
    assassinate: (socket, db, data) => {
        console.log('[gameController]assassinate')
        if (!socket || !db || !data) {
            return
        }
        if (!data.target) {
            return
        }
        try {
            const game = db.getGameById(socket.room)
            const result = game.assassinate(socket.player.id, data.target)
            const respData = {
                status: 'success',
                data: {
                    game: game.gameData
                }
            }
            if (!result) {
                respData.status = 'fail'
            }
            socket.emit('response', respData)
            socket.to(socket.room).emit('response', respData)
        } catch (error) {
            console.log('error:', error)
            const respData = {
                status: 'fail',
                error: {
                    code: 11111,
                    description: `unexpected error:${error}`
                }
            }
            socket.emit('response', respData)
        }
    }
}

export default controller
