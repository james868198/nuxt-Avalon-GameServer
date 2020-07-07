# GAME SERVER

## programming languages, frameworks

express: 4.16.1
node: 8.10.0
redis: 3.0.2
socket.io: 2.3.0

---

## redis database

    dev url: 127.0.0.1:6379
    0: game
    1: user

---

## HTTP API

## WebSocket API

---

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
