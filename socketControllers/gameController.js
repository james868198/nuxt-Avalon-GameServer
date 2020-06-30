// 資料驗證
// 邏輯處理
// 資料回傳
import avalonRule from '../Avalon'
import resUtil from '../utils/resUtil'

const QUESI_SEC = avalonRule.turnInterval
const VOTE_SEC = avalonRule.decisionInterval
const ACTION_SEC = avalonRule.decisionInterval
const ASSAINATION_SEC = avalonRule.assassinationInterval

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
    joinGame: (socket, db, data) => {
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
            const game = db.getGameById(data.gameId)
            // check game existed
            if (!game) {
                respData['status'] = 'fail'
                respData['error']['code'] = 10002
                respData['error']['description'] = 'found no game'
                socket.emit('response', respData)
                return
            }
            // check game status
            if (game.status === 'over') {
                respData['status'] = 'fail'
                respData['error']['code'] = 10001
                respData['error']['description'] = 'game was already over.'
                socket.emit('response', respData)
                return
            } else if (game.status === 'pending') {
                if (game.full) {
                    respData['status'] = 'fail'
                    respData['error']['code'] = 10001
                    respData['error']['description'] = 'game is full.'
                    socket.emit('response', respData)
                    return
                }
               
                
                // get player id in game
                playerData["id"] = game.nowPlayerAmount
                socket.join(data.gameId)
                if (!game.isPlayerInGame(data.userId)) {
                    game.addPlayer(playerData)
                }
               
                
                socket.to(socket.room).emit('message', {
                    userName: 'system',
                    message: `Welcome ${socket.userName}.`
                })
            } else {
                if (game.isPlayerInGame(data.userId)) {
                    playerData = game.updatePlayerData(data.userId,"status","on")
                    socket.join(data.gameId)
                    socket.to(socket.room).emit('message', {
                        userName: 'system',
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
            respData['data']['game'] = game.gameData
            socket.to(socket.room).emit('response', respData)

            respData['data']['player'] =  playerData
            socket.emit('response', respData)
            // check game full again
            if (game.full && game.status === "pending") {
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
        const game = db.getGameById(socket.room)
        game.start()
        // set paramters
        let result = null
        let time = 0
       
        const roundTimer = setInterval(() => {
            const respData = resUtil.getDefaultRes()
            respData.data = {
                time: time,
                game: game.gameData
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
    leaveGame: (socket, db, userId) => {
        console.log('[gameController][leaveGame]')
        // if (!socket.room) {
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
            if (game.status == 'pending') {
                console.log('[gameController][leaveGame] leave pending game')
                game.removePlayer(socket.userId)
                respData.data = {
                    game: game.gameData
                }
                socket.to(socket.room).emit('response', respData)
            } else {
                console.log('[gameController][leaveGame] player afk')
                game.updatePlayerData(socket.userId,'status','off')
            }
            socket.to(socket.room).emit('message', {
                userName: 'system',
                message: `${socket.playerData.name} left the room.`
            })
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
                room: game.roomData,
                game: game.gameData
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
        console.log('[gameController][getPlayerInfo]', socket.playerData)
        const respData = resUtil.getDefaultRes()
        if (!socket.playerData) {
            respData['status'] = 'fail'
            respData['error']['code'] = 11110
            respData['error']['description'] = 'not authorized connection'
            socket.emit('response', respData)
            return
        }
        try {
            const game = db.getGameById(socket.room)
            const Info = game.getPlayerInfoById(socket.playerData.id)
            respData.data = {
                playerInfo: Info
            } 
            console.log('[gameController][getPlayerInfo] res:', respData)
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
        console.log('[gameController][quest]')
        try {
            const game = db.getGameById(socket.room)
            if (game.round.leader !== socket.playerData.id) {
                return
            }
            const questId = parseInt(data.playerId)
            game.quest(socket.playerData.id, questId)
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
            respData['status'] = 'fail'
            respData['error']['code'] = 11111
            respData['error']['description'] = `unexpected error:${error}`
            socket.emit('response', respData)
        }
    },
    unQuest: (socket, db, data) => {
        console.log('[gameController][unQuest]')
        try {
            const game = db.getGameById(socket.room)
            if (game.round.leader !== socket.playerData.id) {
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
                    game: game.gameData
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
            respData['status'] = 'fail'
            respData['error']['code'] = 11111
            respData['error']['description'] = `unexpected error:${error}`
            socket.emit('response', respData)
        }
    }
}

export default controller
