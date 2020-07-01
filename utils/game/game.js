import uuidv1 from 'uuid/v1'
import avalonRule from '../../Avalon'
import mathUtil from '../mathUtil'

export default class game {
    constructor(roomName, numOfPlayers) {
        console.log('[game][constructor]', roomName, numOfPlayers)

        // condiguration
        this.configuration = avalonRule.configuration[this.numOfPlayers]
        this.haveLadyOfLake = this.configuration.haveLadyOfLake
        // basic
        this.roomData = {
            name: roomName,
            id: uuidv1(),
            status: "pending",
            numOfPlayers: numOfPlayers,
            nowPlayerAmount: 0
        }
        this.gameData = {
            stage: null, // questing, voting, action, assassinating
            winner: null,
            successCounter: 0,
            failCounter: 0
        }
        this.voteHistory = [[],[],[],[],[]]
        this.players = []
        this.roundInfo = null
        this.actionResult = {
            failCounter: 0,
            actoinCounter: 0
        }
        this.playersInfo = [] 
        this.missions = []
        
        this.timer = null // sent from gameController
        this.createdTime = Date.now()
        // this.startTime = null
        // this.mostRecentModifiedTime = this.createdTime
        
    }
    get roomData() {
        return this.roomData
    }
    get gameData() {
        return this.gameData
    }
    get voteHistory() {
        return this.voteHistory
    }
    get roundInfo() {
        return this.roundInfo
    }
    get publicData() {
        return {
            roomData: this.roomData,
            gameData: this.gameData,
            missions: this.missions,
            voteHistory: this.voteHistory,
            roundInfo: this.roundInfo,
            players: this.players,
        }
    }
    getPlayerDataByUserId(userId) {
        let playerData = null
        this.players.forEach(player => {
            if (player.userId === userId) {
                playerData = player
            }
        })
        return playerData
    }

    isFull() {
        return this.numOfPlayers == this.roomData.nowPlayerAmount
    }
    getPlayerInfoById(id) {
        console.log('[game][getPlayerInfoById]', id)
        return this.playersInfo[id]
    }
    addPlayer(playerData) {
        console.log('[game][addPlayer]', playerData)
        if (this.roomData.status !== 'pending') {
            return
        }
        const player = {
            userId: playerData.userId,
            name: playerData.name,
            id: playerData.id,
            status: playerData.status,
            onMission: false,
            voted: false
        }
        this.players.push(player)
        this.roomData.nowPlayerAmount++
    }
    isPlayerInGame(userId) {
        console.log('[game][isPlayerInGame]')
        let status = false
        this.players.forEach(player => {
            console.log('[game][isPlayerInGame] ', player.userId, userId)
            if (player.userId === userId) {
                status = true
            }
        })
        return status
    }
    
    updatePlayerData(userId,key,value) {
        let playerData = null
        this.players.forEach(player => {
            if (player.userId === userId) {
                player[key] = value;
                playerData = player
            }
        })
        return playerData
    }
    removePlayer(userId) {
        console.log('[game][removePlayer]', userId)
        if (this.roomData.status == "pending") {
            this.players = this.players.filter(player => player.userId !== userId) // es6 array remove寫法
            this.roomData.nowPlayerAmount--
        }
    }
    // --- game process ---
    start() {
        console.log('[game][start]')
         if (!this.configuration) {
            return -1
        }
        this.roomData.status = 'start'
        this.gameData.status = 'questing'
        this.initialPlayersInfo()
        this.resetPlayerActionStatus()
        this.updateMissions()
        this.updateRoundInfo()
        
    }
    over() {
        console.log('[game][over]')
        this.roomData.status = 'over'
        this.gameData.stage = 'end'

        // same game data to db
    }

    // assign charactor to each players
    initialPlayersInfo() {
        console.log('[game][initialPlayersInfo]')
        // assign charactors
        const charactors = mathUtil.shuffle(this.configuration.charactors)
        const view = {
            Merlin: [],
            Traitor: [],
            Percival: []
        }
        let i = 0
        this.players.forEach(player => {
            if (charactors[i] == 'Merlin') {
                view.Percival.push(i)
            } else if (charactors[i] == 'Morgana') {
                view.Merlin.push(i)
                view.Traitor.push(i)
                view.Percival.push(i)
            } else if (charactors[i] == 'Mordred') {
                view.Traitor.push(i)
            } else if (charactors[i] == 'Oberon') {
                view.Merlin.push(i)
            } else if (charactors[i] == 'Assassin') {
                view.Merlin.push(i)
                view.Traitor.push(i)
            } else if (charactors[i] == 'Traitor') {
                view.Merlin.push(i)
                view.Traitor.push(i)
            }
            const playerInfo = {
                charactor: charactors[i],
                camp: avalonRule.charactors[charactors[i]].camp
            }
            this.playersInfo.push(playerInfo)
            i++
        })
        // saw others' identity
        this.playersInfo.forEach(playerInfo => {
            if (playerInfo.charactor == 'Merlin') {
                playerInfo.saw = view.Merlin
            } else if (playerInfo.charactor == 'Percival') {
                playerInfo.saw = view.Percival
            } else if (playerInfo.charactor !== 'Loyalty') {
                if (playerInfo.charactor !== 'Oberon') {
                    playerInfo.saw = view.Traitor
                }
            }
        })
        // reset all parameters
      
    }
    
    // reset vote and mission status for each players in the begining of each round
    resetPlayerActionStatus() {
        this.players.forEach(player => {
            player.onMission = false
            player.voted = false
        })
    }

    updateMissions() {
        console.log('[game][updateMissions]')
        const mid = this.missions.length-1
        if(mid >=4) {
            return
        }
        const mission = {
            NumOnMission: this.configuration.requiredNum[mid+1],
            badTolerance: this.configuration.badTolerance[mid+1],
            ladyOfLake: null,
            result: null,
            failCounter: 0
        }
        this.mission.push(mission)
    }
    updateRoundInfo() {
        console.log('[game][updateRoundInfo]')
        const defaultVoteResults = []
        for(var i = 0; i < this.room.numOfPlayers; i++) {
            defaultVoteResults.push('T');
        }
        if(this.roundInfo) {
            this.roundInfo.leader = (this.roundInfo.leader+1)/this.room.numOfPlayers
            this.roundInfo.onMission = []
            this.roundInfo.voteResults =defaultVoteResults
        } else {
            this.roundInfo = {
                leader: Math.round(Math.random() * (this.room.numOfPlayers - 1)),
                onMission: [],
                voteResults: defaultVoteResults
            }
        }
    }
    updateVoteHistory() {
        console.log('[game][updateVoteHistory]')
        
        const missionId = this.missions.length -1
        if (!this.roundInfo) {
            return -1
        }
        if (missionId<0) {
            return -1
        }
        const round = {
            leader: this.roundInfo.leader,
            onMission: this.roundInfo.onMission.slice(),
            voteResults: this.roundInfo.voteResults.slice()
        }
        this.voteHistory[missionId].push(round)
    }
    resetActionResult() {
        console.log('[game][resetActionResult]')
        this.actionResult = {
            failCounter: 0,
            actoinCounter: 0
        }
    }

    // --- player actions ---
    quest(leaderId, id) {
        console.log('[game][quest]', id)
        const mId = this.missions.length -1
        if (mId<0) {
            return -1
        }
        if (this.gameData.stage !== 'questing') {
            return -1
        }
        if (leaderId !== this.roundInfo.leader) {
            return -1
        }
        if (this.roundInfo.onMission.length >= this.missions[mId].NumOnMission) {
            return -1
        }
        this.players[id].onMission = true
        this.roundInfo.onMission.push(id)
        return true
    }
    unQuest(leaderId, id) {
        console.log('[game][unQuest]', id)
      
        if (this.gameData.stage !== 'questing') {
            return -1
        }
        if (leaderId !== this.roundInfo.leader) {
            return -1
        }
        if (this.roundInfo.onMission.length == 0) {
            return -1
        }
        this.roundInfo.onMission =  this.roundInfo.onMission.filter(onMissionId => onMissionId !== id)
        this.players[id].onMission = false
    }
    completeQuesting() {
        console.log('[game][completeQuesting]')
        const mid = this.missions.length -1
        if (mid<0) {
            return -1
        }
        if (this.roundInfo.onMission.length !== this.missions[mid].NumOnMission) {
            return -1
        } 
        this.gameData.stage = 'voting'
        return 1
    }
    vote(id, vote) {
        console.log('[game][vote]')
        console.log('[game][vote]  id, vote = ', id, vote)
        if (this.gameData.stage !== 'voting') {
            return -1
        }
        if (this.players[id].voted) {
            return -1
        }
        if (vote === 'N' || vote === 'n') {
            this.round.voteHistory[id] = 'N'
        }
        this.players[id].voted = true
        return true
    }
    completeVoting() {
        console.log('[game][completeVoting]')
        const mid = this.missions.length -1
        // validation
        if (mid<0) {
            return -1
        }
        if (this.roundInfo.onMission.length !== this.missions[mid].NumOnMission) {
            return -1
        } 

        // count vote result
        let voteAgreeCounter = 0
        for(var i = 0; i < length; i++) {
            data.push(createSomeObject());
        }
        this.roundInfo.voteResults.forEach(result => {
            if (result === 'T') {
                voteAgreeCounter++
            }
        })

        // update VoteHistory and RoundInfo
        this.updateVoteHistory()
        this.updateRoundInfo

        if(voteAgreeCounter > this.roomData.numOfPlayers/2) {
            this.gameData.stage = 'action'
        } else {
            if(this.voteHistory[mid].length>=5) {
                this.missions[mid].result = 'fail'
                this.gameData.failCounter++
                this.updateMissions()
               
            }
            if(this.gameData.failCounter>=3) {
                this.gamesData.winner = 'R'
                this.over()

            } else {
                this.gameData.stage = 'questing'

            }
        }
       

        return 1
    }
    action(id, decision) {
        console.log('[game][action]', id, decision)

        // validation
        if (this.gameData.stage !== 'action') {
            return -1
        }
        if (decision !== 's' && decision !== 'f') {
            return -1
        }

        // count 
        this.actionResult.actoinCounter++
        if (decision == 'f') {
            this.actionResult.failCounter++
        } 
        this.players[id].onMission = false
        return true
    }

    CompleteAction() {
        console.log('[game][action]', id, decision)
        // validation
        if (this.gameData.stage !== 'action') {
            return -1
        }
        const mid = this.missions.length -1
        if (mid<0) {
            return -1
        }
        if(this.actionResult.actoinCounter != this.missions[mid].requiredNum) {
            return -1
        }

        // get mission result
        if ( this.actionResult.failCounter >= this.missions[mid].badTolerance) {
            this.missions[mid].result = 'fail'
            this.gameData.failCounter++
        } else {
            this.missions[mid].result = 'success'
            this.gameData.successCounter++
        }
        this.missions[mid]['failCounter'] = this.actionResult.failCounter
        this.updateMissions()
        this.resetActionResult()

        if(this.gameData.failCounter>=3) {
            this.gamesData.winner = 'R'
            this.over()
        } else if (this.gameData.successCounter>=3) {
            this.gameData.stage = 'assassinating'
        } else {
            this.gameData.stage = 'questing'
        }
        
    }
    
    assassinate(userId, target) {
        console.log('[game][assassinate]', userId, target)
        
        // validation
        if (this.roomData.status !== 'start') {
            return -1
        }
        if (this.gameStatus.status !== 'assassinating') {
            return -1
        }

        let assassin = null
        this.players.forEach(player => {
            if (player.userId === userId) {
                assassin = player
            }
        })
       
        if (!assassin) {
            return -1
        }

        if (this.playersInfo[assassin.id].charactor !== 'Assassin') {
            return -1
        }
        
        // assassinate Merlin
        if (this.playersInfo[target].charactor === 'Merlin') {
            this.gamesData.winner = 'R'
        } else {
            this.gamesData.winner = 'B'
        }
        this.over()
        
        return 1
    }
    // timeout
    // froceQuest() {
    //     this.round.NumOnMission = this.configuration.requiredNum[
    //         this.round.id
    //     ]
    // }
    // froceVote() {

    // }
    // froceAction() {

    // }
}
