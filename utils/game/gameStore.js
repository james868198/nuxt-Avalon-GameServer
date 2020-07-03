import Game from './game'

export default class gameStore {
    constructor() {
        console.log('gamestore')
        this.games = {}
        this.publicGames = []
    }

    getGames() {
        // const publicGames = []
        // Object.values(this.games).forEach(game => {
        //     publicGames.push(game.roomData)
        // })
        return this.publicGames
    }

    getGameById(id) {
        console.log('[gameStore][getGameById]', id)
        return this.games[id]
    }
    createGame(name, numOfPlayers) {
        console.log('[gameStore][createGame]')
        const game = new Game(name, numOfPlayers)
        console.log('[gameStore][createGame] gameId:', game.id)
        this.games[game.id] = game
        console.log('[gameStore][createGame] games:',this.games)
        this.publicGames.push(game.roomData)
        return game.id
    }
}
