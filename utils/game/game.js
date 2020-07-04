import uuidv1 from 'uuid/v1'
import avalonRule from '../../Avalon'
import mathUtil from '../mathUtil'

export default class game {
    constructor(roomName, numOfPlayers) {
        console.log('[game][constructor]', roomName, numOfPlayers)

        // condiguration
        this.configuration = avalonRule.configuration[numOfPlayers]
        this.haveLadyOfLake = avalonRule.configuration[numOfPlayers].haveLadyOfLake
        // public
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
        this.missions = []
        // private
        this.playersInfo = [] 
        this.voteResult = []
        this.actionResult = {
            failCounter: 0
        }
        // time
        this.timer = null // sent from gameController
        this.createdTime = Date.now()
        // this.startTime = null
        // this.mostRecentModifiedTime = this.createdTime
        
    }
    get id() {
        return this.roomData.id
    }
    get room() {
        return this.roomData
    }
    get data() {
        return this.gameData
    }
    get votingHistory() {
        return this.voteHistory
    }
    get round() {
        return this.roundInfo
    }
    get publicData() {
        return {
            room: this.roomData,
            data: this.gameData,
            missions: this.missions,
            voteHistory: this.voteHistory,
            roundInfo: this.roundInfo,
            players: this.players,
        }
    }
    getPlayerDataByUserId(userId) {
        console.log('[game][getPlayerDataByUserId] userId:', userId)
        let playerData = null
        this.players.forEach(player => {
            if (player.userId === userId) {
                playerData = player
            }
        })
        return playerData
    }

    get isFull() {
        console.log('[game][isFull]',this.roomData.numOfPlayers, this.roomData.nowPlayerAmount)
        if (this.roomData.numOfPlayers > this.roomData.nowPlayerAmount) {
            return false
        } else {
            return true
        }
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
            onMission: false
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
        this.gameData.stage = 'questing'
        this.initialPlayersInfo()
        this.resetPlayerActionStatus()
        this.resetVoteResult()
        this.updateMissions()
        this.resetRoundInfo(0)
        
    }
    over() {
        console.log('[game][over]')
        if (this.gameData.stage !== 'end') {
            return -1
        }
        if (this.gameData.winner === null || this.gameData.winner === undefined) {
            return -1
        }
        console.log('[game][over] Game over. Winner is', this.gameData.winner)
        this.roomData.status = 'over'
        return 1

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
        for (let i =0;i<this.players.length;i++) {
            this.players[i]['id'] = i
        }
    }
    
    // reset vote and mission status for each players in the begining of each round
    resetPlayerActionStatus() {
        this.players.forEach(player => {
            player.onMission = false
        })
    }

    updateMissions() {
        console.log('[game][updateMissions]')
        const mid = this.missions.length-1
        if(mid >=4 || this.gameData.stage === "end" || this.gameData.stage === "assassinating" ) {
            console.log('[game][updateMissions] stop pushing new mission')
            return -1
        }
       
        const mission = {
            NumOnMission: this.configuration.requiredNum[mid+1],
            badTolerance: this.configuration.badTolerance[mid+1],
            ladyOfLake: null
        }
        this.missions.push(mission)
    }
    resetVoteResult() {
        this.voteResult = []
        for(var i = 0; i < this.room.numOfPlayers; i++) {
            this.voteResult.push('T');
        }
    }
    resetRoundInfo(id) {
        console.log('[game][resetRoundInfo] id:', id)        
        this.roundInfo = {
            roundId: id % 5,
            leader: Math.round(Math.random() * (this.room.numOfPlayers - 1)),
            onMission: []
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
            roundId: this.roundInfo.roundId,
            leader: this.roundInfo.leader,
            onMission: this.roundInfo.onMission.slice(),
            voteResult: this.voteResult
        }
        this.voteHistory[missionId].push(round)
    }
    resetActionResult() {
        console.log('[game][resetActionResult]')
        this.actionResult = {
            failCounter: 0,
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
        if (this.roomData.numOfPlayers<=id || id<0) {
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
        if (this.roomData.numOfPlayers<=id || id<0) {
            return -1
        }
        this.roundInfo.onMission =  this.roundInfo.onMission.filter(onMissionId => onMissionId !== id)
        this.players[id].onMission = false
    }
    
    vote(id, vote) {
        console.log('[game][vote]')
        console.log('[game][vote]  id, vote = ', id, vote)
        if (this.gameData.stage !== 'voting') {
            return -1
        }
        if (vote === 'N' || vote === 'n') {
            this.voteResult[id] = 'N'
        } else if (vote === 'T' || vote === 't') {
            this.voteResult[id] = 'T'
        }
        return true
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
        if (decision == 'f') {
            this.actionResult.failCounter++
        } 
        this.players[id].onMission = false
        return true
    }

    assassinate(userId, target) {
        console.log(`[game][assassinate] user:${userId} decides to assassinate player ${target}`)
        
        // validation
        if (this.roomData.status !== 'start') {
            return -1
        }
        if (this.game.gameData.stage !== 'assassinating') {
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
            console.log('[game][completeAssassinate] Assassinate success')
            this.gameData.winner = 'R'
        } else {
            console.log('[game][completeAssassinate] Assassinate fail')
            this.gameData.winner = 'B'
        }
        this.game.gameData.stage = 'end'
        
        return 1
    }
    resetOnMission(leaderId, NumOnMission) {
        console.log('[game][resetOnMission]')
        this.roundInfo.onMission = []
        for(let i = 0;i<NumOnMission;i++) {
            this.roundInfo.onMission.push((leaderId+i)%NumOnMission)
        }
    }
    // timeout
    completeQuesting() {
        console.log('[game][completeQuesting]')
        const mid = this.missions.length -1
        const leaderId = this.roundInfo.leader
        if (mid<0) {
            return -1
        }
        const NumOnMission = this.missions[mid].NumOnMission
        console.log('[game][completeQuesting] NumOnMission:', NumOnMission)
        if(NumOnMission === undefined || NumOnMission === null || NumOnMission === NaN) {
            console.log('[game][completeQuesting] onMission not qualified, reset onMission')
            this.resetOnMission(leaderId, NumOnMission)
        }
        if (this.roundInfo.onMission.length !== NumOnMission) {
            console.log('[game][completeQuesting] onMission size wrong, reset onMission')
            this.resetOnMission(leaderId, NumOnMission)
        } 
        this.gameData.stage = 'voting'
        console.log('[game][completeQuesting] stage:', this.gameData.stage)
        return 1
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
        this.voteResult.forEach(result => {
            if (result === 'T') {
                voteAgreeCounter++
            }
        })
       
        // update VoteHistory and RoundInfo
        this.updateVoteHistory()
        this.resetVoteResult()

        if(voteAgreeCounter > this.roomData.numOfPlayers/2) {
            this.gameData.stage = 'action'
            this.resetRoundInfo(0)
        } else {
            if(this.roundInfo.roundId >= 4) {
                this.missions[mid].result = 'fail'
                this.gameData.failCounter++
                this.updateMissions()
                this.resetRoundInfo(this.roundInfo.roundId+1)
            }
            if(this.gameData.failCounter>=3) {
                this.gamesData.winner = 'R'
                this.gameData.stage = 'end'
            } else {
                this.gameData.stage = 'questing'
                this.resetRoundInfo(0)
            }
        }
       

        return 1
    }

    completeAction() {
        console.log('[game][CompleteAction]')
        // validation
        if (this.gameData.stage !== 'action') {
            return -1
        }
        const mid = this.missions.length -1
        if (mid<0) {
            return -1
        }

        // get mission result
        const fcounter = this.actionResult.failCounter
        const criteria = this.missions[mid].badTolerance
        if ( fcounter > criteria) {
            console.log(`[game][CompleteAction] fails, f:${fcounter}`)
            this.missions[mid].result = 'fail'
            this.gameData.failCounter++
        } else {
            console.log(`[game][CompleteAction] success, f:${fcounter}`)
            this.missions[mid].result = 'success'
            this.gameData.successCounter++
        }
        this.missions[mid]['failCounter'] = this.actionResult.failCounter
       

        if(this.gameData.failCounter>=3) {
            this.gameData.winner = 'R'
            this.gameData.stage = 'end'
        } else if (this.gameData.successCounter>=3) {
            this.gameData.stage = 'assassinating'
        } else {
            this.gameData.stage = 'questing'
        }
        this.updateMissions()
        this.resetActionResult()
    }

    completeAssassinate() {
        console.log('[game][completeAssassinate]')
        // validation
        if (this.roomData.status !== 'start') {
            return -1
        }
        if (this.gameData.stage !== 'assassinating') {
            return -1
        }

        // random pick Merlin
        const target = Math.round(Math.random() * (this.room.numOfPlayers - 1))
        console.log('[game][completeAssassinate] random pick target: ',target)

        if (this.playersInfo[target].charactor === 'Merlin') {
            console.log('[game][completeAssassinate] Assassinate success')
            this.gameData.winner = 'R'
        } else {
            console.log('[game][completeAssassinate] Assassinate fail')
            this.gameData.winner = 'B'
        }
        this.gameData.stage = 'end'
        
        return 1
    }
}
