import uuidv1 from 'uuid/v1'
import avalonRule from '../../Avalon'
import mathUtil from '../mathUtil'

// const QUESI_SEC = avalonRule.turnInterval
// const VOTE_SEC = avalonRule.decisionInterval
// const ACTION_SEC = avalonRule.decisionInterval
// const ASSAINATION_SEC = avalonRule.assassinationInterval

const TEST_SEC1 = 10
const TEST_SEC2 = 200

const QUESI_SEC = TEST_SEC2
const VOTE_SEC = TEST_SEC2
const ACTION_SEC = TEST_SEC2
const ASSAINATION_SEC = TEST_SEC2

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
            failCounter: 0,
            missionId: -1
        }
        this.voteHistory = [[],[],[],[],[]]
        this.players = []
        this.roundInfo = null
        this.missions = []
        // initaial Mission
        this.initialMissions()
        // private
        this.playersInfo = [] 
        this.voteResult = []
        this.actionResult = {
            failCounter: 0
        }
        // time
        this.time_counter = 0 // sent from gameController
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
    get mission() {
        const mId = this.gameData.missionId
        if (mId>=0 && mId<5) {
            return this.missions[mId]
        } else {
            return null
        }
       
    }
    get publicData() {
        return {
            room: this.roomData,
            data: this.gameData,
            missions: this.missions,
            voteHistory: this.voteHistory,
            roundInfo: this.roundInfo,
            players: this.players,
            time: this.time_counter
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
    countTime() {
        // console.log('[game][countTime]')
        if (this.time_counter >= -1) {
            this.time_counter--
        }
        return
    }
    assignTime(time) {
        console.log('[game][assignTime]')
        if (time >= 0) {
            this.time_counter = time
        }
        return
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
        this.gameData.missionId = 0
        this.initialPlayersInfo()
        this.resetPlayerActionStatus()
        this.resetVoteResult()
        this.initializeRoundInfo()

        this.moveToStage('quest')
        // start counting time
        console.log('[game][start] start counting time from:', this.time_counter )
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
        this.playersInfo.forEach((playerInfo, id) => {
            playerInfo['saw'] = id
            if (playerInfo.charactor == 'Merlin') {
                playerInfo['saw'] = view.Merlin
            } else if (playerInfo.charactor == 'Percival') {
                playerInfo['saw'] = view.Percival
            } else if (playerInfo.charactor !== 'Loyalty') {
                if (playerInfo.charactor !== 'Oberon') {
                    playerInfo['saw'] = view.Traitor
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
    initialMissions() {
        console.log('[game][initialMissions]')
        for(let i = 0 ; i<5 ; i++) {
            const mission = {
                NumOnMission: this.configuration.requiredNum[i],
                badTolerance: this.configuration.badTolerance[i],
                ladyOfLake: null,
                result: "pending",
                failCounter: 0
            }
            this.missions.push(mission)
        }
    }
    moveToNextMission() {
        console.log('[game][moveToNextMission]')
        if(this.gameData.missionId >=4 || this.gameData.stage === "end" || this.gameData.stage === "assassinating" ) {
            console.log('[game][moveToNextMission] stop pushing new mission')
            return -1
        }
        this.gameData.missionId++
    }
    resetVoteResult() {
        this.voteResult = []
        for(var i = 0; i < this.room.numOfPlayers; i++) {
            this.voteResult.push('T');
        }
    }
    initializeRoundInfo() {
        console.log('[game][initializeRoundInfo]')        
        this.roundInfo = {
            roundId: 0,
            leader: Math.round(Math.random() * (this.room.numOfPlayers - 1)),
            onMission: []
        }
    }
    updateRoundInfo(roundId){
        console.log('[game][updateRoundInfo] roundId:', roundId)        
        this.roundInfo = {
            roundId: roundId % 5,
            leader: (this.roundInfo.leader+1) % (this.room.numOfPlayers),
            onMission: []
        }
    }
    updateVoteHistory() {
        console.log('[game][updateVoteHistory]')
        
        const missionId = this.gameData.missionId
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
    resetOnMissionsStatus() {
        this.players.forEach(player => {
            player.onMission = false
        });
    }
    autoAssignOnMission(leaderId, NumOnMission) {
        console.log('[game][autoAssignOnMission]')
        this.roundInfo.onMission = []
        for(let i = 0;i<NumOnMission;i++) {
            const id = (leaderId+i)%NumOnMission
            this.roundInfo.onMission.push(id)
            this.players[id].onMission = true
        }
    }
    // --- player actions ---
    quest(leaderId, list) {
        console.log('[game][quest]',leaderId, list)
        const mId = this.gameData.missionId
        if (leaderId == null || list == null) {
            console.log('[game][quest] input error')
            return -1
        }
        if (mId<0) {
            console.log('[game][quest] mId error', mId)
            return -1
        }
        if (this.gameData.stage !== 'questing') {
            console.log('[game][quest] stage error', this.gameData.stage)
            return -1
        }
        if (leaderId !== this.roundInfo.leader) {
            console.log('[game][quest] not leader', leaderId)
            return -1
        }
        if (list.length !== this.missions[mId].NumOnMission) {
            console.log('[game][quest] list length error', leaderId)
            return -1
        }
        
        // validation
        for(let i = 0 ; i < list.length ; i++) {
            const id = list[i]
            if(id <0 ||i>this.gameData.numOfPlayers-1) {
                return -1
            }
        }

        // set onMission list
        this.roundInfo.onMission = list.slice()

        // update onMission status
        this.resetPlayerActionStatus() 
        for(let i = 0 ; i < list.length ; i++) {
            const id = list[i]
            this.players[id].onMission = true
        } 
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
        if (vote === 0) {
            this.voteResult[id] = 'N'
        } else if (vote === 1) {
            this.voteResult[id] = 'T'
        } else {
            return -1
        }
        return true
    }
   
    action(id, decision) {
        console.log('[game][action]', id, decision)

        // validation
        if (id == null || decision == null) {
            return -1
        }
        if (this.gameData.stage !== 'action') {
            return -1
        }
        if (!this.players[id].onMission) {
            return -1
        }
        if (decision === 0) {
            this.actionResult.failCounter++
        } else if (decision === 1) {
            // noting
        } else {
            return -1
        }
        // count 
        this.players[id].onMission = false
        return true
    }

    assassinate(id, target) {
        console.log(`[game][assassinate] assassin:${id}, murdered player ${target}`)
        
        // validation
        if (this.roomData.status !== 'start') {
            return -1
        }
        if (this.gameData.stage !== 'assassinating') {
            return -1
        }
        if (target <0 || target >= this.roomData.numOfPlayers || id < 0 || id >= this.roomData.numOfPlayers) {
            return -1
        }

        if (this.playersInfo[id].charactor !== 'Assassin') {
            return -1
        }
        
        // assassinate Merlin
        if (this.playersInfo[target].charactor === 'Merlin') {
            console.log('[game][assassinate] Assassinate success')
            this.gameData.winner = 'R'
        } else {
            console.log('[game][assassinate] Assassinate fail')
            this.gameData.winner = 'B'
        }
        this.moveToStage('end')
        
        return 1
    }
    // move to desired stage
    moveToStage(stage) {
        console.log('[game][moveToStage] stage: ', stage)
        if (stage == null) {
            return
        }
        switch(stage) {
            case 'quest':
                this.gameData.stage = 'questing'
                this.resetOnMissionsStatus()
                this.time_counter = QUESI_SEC
                break
            case 'vote':
                this.gameData.stage = 'voting'
                this.time_counter = VOTE_SEC
                break
            case 'action':
                this.gameData.stage = 'action'
                this.time_counter = ACTION_SEC
                break
            case 'assassinate':
                this.gameData.stage = 'assassinating'
                this.time_counter = ASSAINATION_SEC
                break
            case 'end':
                this.gameData.stage = 'end'
                this.time_counter = 0
                break
            default:
                this.gameData.stage = 'questing'
                this.resetOnMissionsStatus()
                this.time_counter = QUESI_SEC
                break
        }
    }
    // Complete
    completeQuesting() {
        console.log('[game][completeQuesting]')
        const mId = this.gameData.missionId
        const leaderId = this.roundInfo.leader
        if (mId<0) {
            return -1
        }
        const NumOnMission = this.missions[mId].NumOnMission
        console.log('[game][completeQuesting] NumOnMission:', NumOnMission)
        if (this.roundInfo.onMission == null || this.roundInfo.onMission.length !== NumOnMission) {
            console.log('[game][completeQuesting] onMission size wrong, reset onMission')
            this.autoAssignOnMission(leaderId, NumOnMission)
        } 
        // move to vote stage
        this.moveToStage('vote')
        return 1
    }

    completeVoting() {
        console.log('[game][completeVoting]')
        const mId = this.gameData.missionId
        // validation
        if (mId<0) {
            return -1
        }
        if (this.roundInfo.onMission.length !== this.missions[mId].NumOnMission) {
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
            this.moveToStage('action')
            // this.updateRoundInfo(0)
        } else {
            // vote no pass 5 times
            if(this.roundInfo.roundId >= 4) {
                this.missions[mId].result = 'fail'
                this.gameData.failCounter++
                this.moveToNextMission()
                this.updateRoundInfo(0)
            } else {
                this.updateRoundInfo(this.roundInfo.roundId+1)
            }

            if(this.gameData.failCounter>=3) {
                this.gameData.winner = 'R'
                this.moveToStage('end')
            } else {
                this.moveToStage('quest')
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
        const mId = this.gameData.missionId
        if (mId<0) {
            return -1
        }

        // get mission result
        const fcounter = this.actionResult.failCounter
        const criteria = this.missions[mId].badTolerance
        if ( fcounter > criteria) {
            console.log(`[game][CompleteAction] fails, f:${fcounter}`)
            this.missions[mId].result = 'fail'
            this.gameData.failCounter++
        } else {
            console.log(`[game][CompleteAction] success, f:${fcounter}`)
            this.missions[mId].result = 'success'
            this.gameData.successCounter++
        }
        this.missions[mId]['failCounter'] = this.actionResult.failCounter
       

        if(this.gameData.failCounter>=3) {
            this.gameData.winner = 'R'
            this.moveToStage('end')
        } else if (this.gameData.successCounter>=3) {
            this.moveToStage('assassinate')
        } else {
            this.updateRoundInfo(0)
            this.moveToStage('quest')
        }
        this.moveToNextMission()
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
        console.log('[game][completeAssassinate] random pick target: ', target)

        if (this.playersInfo[target].charactor === 'Merlin') {
            console.log('[game][completeAssassinate] Assassinate success')
            this.gameData.winner = 'R'
        } else {
            console.log('[game][completeAssassinate] Assassinate fail')
            this.gameData.winner = 'B'
        }
        this.moveToStage('end')
        return 1
    }
}
