import uuidv1 from 'uuid/v1'
import avalonRule from '../../Avalon'
import mathUtil from '../mathUtil'

export default class game {
    constructor(roomName, numOfPlayers) {
        console.log('[game]new game', roomName, numOfPlayers)
        // basic
        this.name = roomName
        this.id = uuidv1()
        // condiguration
        this.numOfPlayers = numOfPlayers
        this.configuration = avalonRule.configuration[this.numOfPlayers]
        this.haveLadyOfTheLake = this.configuration.haveLadyOfTheLake
        // status
        this.status = 'pending' // start, assasination, over
        this.missionResult = null
        this.nowPlayerAmount = 0
        this.players = []
        this.winerCamp = null
        // round status
        this.round = null
        this.roundInfo = null
        // mission
        this.missionFailTimes = 0
        this.missionSuccessessTimes = 0
        this.mission = null

        this.missionId = 1
        this.RoundId = 1
        this.missions = []
        for (let i = 0; i < 5; i++) {
            this.missions.push({
                id: i + 1,
                requiredNum: this.configuration.requiredNum[i],
                badTolerance: this.configuration.badTolerance[i],
                ladyOfTheLake: null,
                history: null,
                roundsHistory: []
            })
        }
        // time
        this.timer = null // sent from gameController
        this.createdTime = Date.now()
        this.startTime = null
        // this.mostRecentModifiedTime = this.createdTime
        // private
        this.playersInfo = []
    }
    get roomData() {
        return {
            name: this.name,
            id: this.id,
            numOfPlayers: this.numOfPlayers,
            nowPlayerAmount: this.nowPlayerAmount
        }
    }
    get gameData() {
        return {
            winerCamp: this.winerCamp,
            status: this.status,
            players: this.players,
            // board
            missions: this.missions,
            // round
            roundInfo: this.roundInfo
        }
    }
    get full() {
        return this.numOfPlayers == this.nowPlayerAmount
    }
    getPlayerInfoById(id) {
        console.log('[game]getPlayerInfoById', id)
        return this.playersInfo[id]
    }
    addPlayer(playerData) {
        console.log('[game]addPlayer', playerData)
        if (this.status !== 'pending') {
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
        this.nowPlayerAmount++
    }
    isPlayerInGame(userId) {
        console.log('[game][getPlayerInfoById]')
        let status = false
        this.players.forEach(player => {
            console.log('[game][getPlayerInfoById] ', player.userId, userId)
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
    removePlayer(player) {
        console.log('[game]removePlayer', player)
        if (this.status == "pending") {
            this.players = this.players.filter(item => item.id !== player.id) // es6 array remove寫法
            this.nowPlayerAmount--
        }
    }
    // game status
    start() {
        console.log('[game]start')
        this.initial()
        // this.startTime = Date.now()
        this.status = 'start'
    }
    over() {
        console.log('[game]over')
    }
    initial() {
        console.log('[game] initial')

        // if (!this.configuration) {
        //     return false
        // }
        const charactors = mathUtil.shuffle(this.configuration.charactors)
        const view = {
            Merlin: [],
            Traitor: [],
            Percival: []
        }
        // assign charactors
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
        this.resetPlayers()
        this.resetMission()
        this.resetRound()
    }
    // system actions
    resetPlayers() {
        this.players.forEach(player => {
            player.onMission = false
            player.voted = false
        })
    }
    resetMission() {
        console.log('[game]resetMission')
        let id = 1
        if (this.mission) {
            if (this.mission.status !== 'pending') {
                id = this.mission.id + 1
            }
        }
        this.mission = {
            id: id,
            NumOnMission: this.missions[id - 1].requiredNum,
            badTolerance: this.missions[id - 1].badTolerance,
            actionCount: 0,
            status: 'pending',
            success: 0,
            fail: 0
        }
    }
    resetRound(resetId) {
        console.log('[game]resetRound', resetId)
        const votes = []
        let id = 1
        let leader = Math.round(Math.random() * (this.numOfPlayers - 1))
        for (let i = 0; i < this.numOfPlayers; i++) {
            votes.push('Y')
        }
        if (this.round) {
            if (this.round.id > 4 || resetId) {
                id = 1
            } else {
                id = this.round.id + 1
            }
            leader = (this.round.leader + 1) % this.numOfPlayers
        }
        this.round = {
            stage: 'questing', // questing, voting, action
            id: id,
            // mission
            leader: leader,
            onMission: [],
            finishedMission: {},
            // vote
            agreeCount: this.numOfPlayers,
            votedCount: 0,
            voteHistory: votes,
            actionResult: 'no action'
        }
        this.setRoundInfo()
    }
    setRoundInfo() {
        console.log('[game]setRoundInfo')
        this.roundInfo = {
            missionId: this.mission.id || null,
            id: this.round.id,
            stage: this.round.stage,
            leader: this.round.leader,
            onMission: this.round.onMission || []
        }
    }
    setMissionHistory() {
        console.log('[game]setMissionHistory')
        if (!this.mission || !this.round) {
            return
        }
        this.missions[this.mission.id - 1].history = {
            leader: this.round.leader,
            onMission: this.round.onMission,
            numOfSuccess: this.mission.success,
            numOfFailure: this.mission.fail,
            result: this.mission.fail > 0 ? 'fail' : 'success'
        }
    }
    setRoundHistory() {
        console.log('[game]setRoundHistory')
        if (!this.mission || !this.round) {
            return
        }
        this.missions[this.mission.id - 1].roundsHistory.push({
            id: this.round.id,
            leader: this.round.leader,
            voteHistory: this.round.voteHistory,
            onMission: this.round.onMission,
            result: this.round.actionResult
        })
    }
    roundCheck() {
        console.log('[game] roundCheck')
        if (this.status !== 'start') {
            return
        }
        const round = this.round
        const mission = this.mission

        // round.stage

        if (round.stage === 'questing') {
            if (round.onMission.length === mission.NumOnMission) {
                // questing to voting
                round.stage = 'voting'
                this.setRoundInfo()
            }
        } else if (round.stage === 'voting') {
            if (round.votedCount == this.numOfPlayers) {
                // voting to next stage
                if (2 * round.agreeCount > this.numOfPlayers) {
                    // agree
                    // go to next stage
                    console.log('[game][agreeCount]', round.agreeCount)
                    round.stage = 'action'
                    round.actionResult = 'action'
                    this.setRoundInfo()
                } else if (round.id == 5) {
                    // disagree over 5
                    // go to next stage
                    round.stage = 'action'
                    this.setRoundInfo()
                } else {
                    // disagree, go to next stage

                    // set round history to missions rounds
                    this.setRoundHistory()

                    // reset players, round
                    this.resetPlayers()
                    this.resetRound()
                }
            }
        } else if (round.stage === 'action') {
            if (mission.actionCount === mission.NumOnMission) {
                // All action complete
                if (mission.fail > mission.badTolerance || round.id == 5) {
                    // fail
                    mission.status = 'fail'
                    this.missionFailTimes++
                } else {
                    // success
                    mission.status = 'success'
                    this.missionSuccessessTimes++
                }
                // set history to missions
                this.setMissionHistory()
                this.setRoundHistory()
                // reset players, mission, round
                this.resetPlayers()
                this.resetMission()
                this.resetRound(true)

                // check game over
                if (this.missionSuccessessTimes == 3) {
                    this.status = 'assassinating'
                } else if (this.missionFailTimes == 3) {
                    this.winerCamp = 'R'
                    this.status = 'over'
                }
            }
        } else {
            // error
            // reset players, mission, round
            this.resetPlayers()
            this.resetMission()
            this.resetRound(true)
        }
    }

    // player actions
    quest(leaderId, id) {
        console.log('[game]quest', id)
        if (this.round.stage !== 'questing') {
            return false
        }
        if (leaderId !== this.round.leader) {
            return false
        }
        if (this.round.onMission.length >= this.mission.NumOnMission) {
            return false
        }
        this.players[id].onMission = true
        this.round.onMission.push(id)
        this.roundCheck()
        return true
    }
    // unQuest(id) {
    //     if (this.round.NumOnMission <= 0) {
    //         return false
    //     }
    //     this.round.NumOnMission--
    //     this.players[id].onMission = false
    // }
    vote(id, voteResult) {
        console.log('[game]vote', id, voteResult)
        if (this.round.stage !== 'voting') {
            return false
        }
        if (this.players[id].voted) {
            return false
        }
        this.players[id].voted = true
        this.round.votedCount++
        if (voteResult === 'N' || voteResult === 'n') {
            this.round.voteHistory[id] = 'N'
            this.round.agreeCount--
        }
        console.log('[game]vote agree', this.round.agreeCount)
        this.roundCheck()
        return true
    }
    action(id, decision) {
        console.log('[game]action', id, decision)
        if (this.round.stage !== 'action') {
            return false
        }
        let onMissionCheck = false
        this.round.onMission.forEach(onMissionId => {
            if (onMissionId === id) {
                onMissionCheck = true
            }
        })
        if (this.round.finishedMission[id]) {
            return false
        } else {
            this.round.finishedMission[id] = 'finished'
        }
        if (!onMissionCheck) {
            return false
        }
        if (decision == 'f') {
            this.mission.fail++
        } else if (decision == 's') {
            this.mission.success++
        } else {
            return false
        }
        this.mission.actionCount++
        this.roundCheck()
        return true
    }
    assassinate(id, target) {
        console.log('[game]assassinate', id, target, this.status)
        if (this.status !== 'assassinating') {
            return false
        }
        if (this.playersInfo[id].charactor !== 'Assassin') {
            return false
        }
        if (this.playersInfo[target].charactor === 'Merlin') {
            this.winerCamp = 'R'
        } else {
            this.winerCamp = 'B'
        }
        this.status = 'over'
        return true
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
