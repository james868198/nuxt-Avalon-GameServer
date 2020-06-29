const rule = {
    name: 'Avalon',
    turnInterval: 300,
    decisionInterval: 20,
    assassinationInterval: 120,
    charactors: {
        Loyalty: {
            Name: 'Loyalty',
            camp: 'B'
        },
        Merlin: {
            name: 'Merlin',
            camp: 'B',
            saw: ['Traitor', 'Assassin', 'Mordred', 'Morgana', 'Oberon']
        },
        Percival: {
            name: 'Percival',
            camp: 'B',
            saw: ['Merlin', 'Morgana']
        },
        Traitor: {
            name: 'Traitor',
            camp: 'R',
            saw: ['Traitor', 'Assassin', 'Mordred', 'Morgana']
        },
        Assassin: {
            name: 'Assassin',
            camp: 'R',
            saw: ['Traitor', 'Assassin', 'Mordred', 'Morgana']
        },
        Morgana: {
            name: 'Morgana',
            camp: 'R',
            saw: ['Traitor', 'Assassin', 'Mordred', 'Morgana']
        },
        Mordred: {
            name: 'Mordred',
            camp: 'R',
            saw: ['Traitor', 'Assassin', 'Mordred', 'Morgana']
        },
        Oberon: {
            name: 'Oberon',
            camp: 'R'
        }
    },
    configuration: {
        // for test
        '2': {
            playersNumbers: 2,
            charactors: ['Merlin', 'Assassin'],
            requiredNum: [2, 2, 2, 2, 2],
            badTolerance: [0, 0, 0, 0, 0],
            haveLadyOfTheLake: false
        },
        '6': {
            playersNumbers: 6,
            charactors: [
                'Oberon',
                'Percival',
                'Morgana',
                'Merlin',
                'Mordred',
                'Assassin'
            ],
            requiredNum: [2, 3, 4, 3, 4],
            badTolerance: [0, 0, 0, 0, 0],
            haveLadyOfTheLake: false
        },
        // for formal
        '5': {
            playersNumbers: 5,
            charactors: ['Loyalty', 'Loyalty', 'Merlin', 'Traitor', 'Assassin'],
            requiredNum: [2, 3, 2, 3, 3],
            badTolerance: [0, 0, 0, 0, 0],
            haveLadyOfTheLake: false
        },
        // '6': {
        //     playersNumbers: 6,
        //     charactors: [
        //         'Loyalty',
        //         'Loyalty',
        //         'Loyalty',
        //         'Merlin',
        //         'Traitor',
        //         'Assassin'
        //     ],
        //     requiredNum: [2, 3, 4, 3, 4],
        //     badTolerance: [0, 0, 0, 0, 0],
        //     haveLadyOfTheLake: false
        // },
        '7': {
            playersNumbers: 7,
            charactors: [
                'Loyalty',
                'Loyalty',
                'Percival',
                'Merlin',
                'Traitor',
                'Assassin',
                'Morgana'
            ],
            requiredNum: [2, 3, 3, 4, 4],
            badTolerance: [0, 0, 0, 1, 0],
            haveLadyOfTheLake: false
        },
        '8': {
            playersNumbers: 8,
            charactors: [
                'Loyalty',
                'Loyalty',
                'Loyalty',
                'Merlin',
                'Percival',
                'Assassin',
                'Morgana',
                'Mordred'
            ],
            requiredNum: [3, 4, 4, 5, 5],
            badTolerance: [0, 0, 0, 1, 0],
            haveLadyOfTheLake: true
        },
        '9': {
            playersNumbers: 9,
            charactors: [
                'Loyalty',
                'Loyalty',
                'Loyalty',
                'Loyalty',
                'Merlin',
                'Percival',
                'Assassin',
                'Morgana',
                'Mordred'
            ],
            requiredNum: [3, 4, 4, 5, 5],
            badTolerance: [0, 0, 0, 1, 0],
            haveLadyOfTheLake: true
        },
        '10': {
            playersNumbers: 10,
            charactors: [
                'Loyalty',
                'Loyalty',
                'Loyalty',
                'Loyalty',
                'Merlin',
                'Percival',
                'Assassin',
                'Morgana',
                'Mordred',
                'Oberon'
            ],
            requiredNum: [3, 4, 4, 5, 5],
            badTolerance: [0, 0, 0, 1, 0],
            haveLadyOfTheLake: true
        }
    }
}

export default rule
