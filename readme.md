# GAME SERVER

## programming languages, frameworks

express
node 8.10.0

## redis database

dev url: 127.0.0.1:6379
0: game
1: user

## Archeture

## HTTP API

## WebSocket API

## game data structure v1

game:
    missions:
        [
            {
                badTolerance: 0
                history: null
                id: 1
                ladyOfLake: null
                requiredNum: 2
                roundsHistory: [
                    [T,F,F,F,T,T]
                ]
            }
        ]
    numOfPlayers: 2
    players: Array(2)
    roundInfo:
        id: (...)
        leader: (...)
        missionId: (...)
        onMission: (...)
        stage: (...)
    status: (...)
    winerCamp: (...

## game data structure v2

game:
    roomStatus: {
        name: wefwef
        id: wefwefwefwef
        status: "pending",
        numOfPlayers: 2,
    }
    players: []
    missions:
        [
            {
                badTolerance: 0
                ladyOfLake: null
                requiredNum: 2
                result: 'success'
                failCounter: 0
            },
            {
                badTolerance: 0
                ladyOfLake: null
                requiredNum: 2
            }
        ]
    voteHistory [
        [
            {
                leader:
                onMission: []
                voteResults: []
            },
            {
                leader:
                onMission: []
                voteResults: []
            }
        ]
    ]
    gamesData: {
        missionId:
        stage:
        winner:
        successCounter: 0,
        failCounter: 0
    }
    roundInfo: {
        leader: (...)
        onMission: (...)
        voteResults: []
    }
    playersInfo {
        charactor
        camp
        saw
    }
## development diary

6/30/2020
1. game.js redesign
2. gameController timer redesign

room name = gameId