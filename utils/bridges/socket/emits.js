const joinGame = (socket, data) => {
    socket.emit('joinGame', data)
}
const setName = (socket, data) => {
    socket.emit('setName', data)
}
const chat = (socket, data) => {
    socket.emit('chat', data)
}
const getGames = socket => {
    socket.emit('getGames')
}
const createGame = (socket, data) => {
    socket.emit('createGame', data)
}
const getGameById = (socket, id) => {
    socket.emit('getGameById', id)
}
const getIdentity = socket => {
    socket.emit('getIdentity')
}

const quest = (socket, data) => {
    socket.emit('quest', data)
}

const unQuest = (socket, data) => {
    socket.emit('unQuest', data)
}

const vote = (socket, data) => {
    socket.emit('vote', data)
}

const action = (socket, data) => {
    socket.emit('action', data)
}

const assassinate = (socket, data) => {
    socket.emit('assassinate', data)
}

export default {
    // all
    chat,
    setName,
    getGameById,
    // hall
    getGames,
    createGame,
    // game
    joinGame,
    getIdentity,
    quest,
    unQuest,
    vote,
    action,
    assassinate
}
