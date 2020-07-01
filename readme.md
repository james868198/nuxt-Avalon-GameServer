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
    management: {
        name
        id
        status: "pending",
        numOfPlayers: 2,
        players: []
    }
    missions:
        [
            {
                badTolerance: 0
                history: null
                id: 1
                ladyOfLake: null
                requiredNum: 2
                result: 'success'
            },
            {
                badTolerance: 0
                history: null
                id: 1
                ladyOfLake: null
                requiredNum: 2
            }
        ]
    voteHistory [
        [
            {
                leader:
                onMission: []
                result: []
            },
            {
                onMission: []
                result: []
            }
        ]
    ]
    status: {
      
        missionId:
        stage:
        winner: 
    }
    roundInfo: {
        leader: (...)
        onMission: (...)
        result: []
    }
