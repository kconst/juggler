(function(){
    var fs = require('fs'),
        stringData = {
            circuits : [],
            jugglers : []
        },
        parsedData = {
            circuits : [],
            jugglers : []
        },
        groupSize,
        resultString = [],
        utils = {
            calcDot : calcDot,
            assignJuggler : assignJuggler,
            generateRatings : generateRatings
        };

    fs.readFile("juggler.txt", "utf8", function (error, text) {
        var dataArr = text.split('\r\n\r\n');

        stringData.circuits = dataArr[0];
        stringData.jugglers = dataArr[1];

        // convert strings to arrays
        stringData.circuits = stringData.circuits.split('\r\n');
        stringData.jugglers = stringData.jugglers.split('\r\n');

        // setup mappings for circuits and jugglers
        stringData.circuits.forEach(function (e) {
            var values = e.match(/(?:)(\d+)/g);

            parsedData.circuits.push({
                id: 'C' + values[0],
                H: values[1],
                E: values[2],
                P: values[3],
                group: []
            });
        });

        stringData.jugglers.forEach(function (e) {
            var values = e.match(/(?:)(\d+)/g),
                juggler;

            // in case we pick up an empty line :P
            if (!values) {
                return;
            }

            juggler = {
                id: 'J' + values[0],
                'H': values[1],
                'E': values[2],
                'P': values[3],
                // TODO: make dynamic for every circuit!!!
                circuitPreference : values.slice(4, values.length),
                circuitRating : []
            };

            parsedData.jugglers.push(juggler);
        });

        // number of jugglers assigned to a circuit should be the number of jugglers divided by the number of circuits
        groupSize = parsedData.jugglers.length / parsedData.circuits.length;


        // assign jugglers to circuits first by preference then bump for better fits
        parsedData.jugglers.forEach(utils.assignJuggler);

        // sort circuit jugglers by dot rating
        parsedData.circuits.forEach(function (circuit, i) {
            circuit.group.sort(function (jugglerB, jugglerA) {
                if (parsedData.jugglers[jugglerA.index].circuitRating[i] > parsedData.jugglers[jugglerB.index].circuitRating[i]) {
                    return 1;
                }

                if (parsedData.jugglers[jugglerA.index].circuitRating[i] < parsedData.jugglers[jugglerB.index].circuitRating[i]) {
                    return -1;
                }

                return 0;
            });
        });

        // generate result string, reverse to match sample output
        parsedData.circuits.reverse();

        parsedData.circuits.forEach(function (circuit) {
            resultString.push([circuit.id, ' '].join(''));

            circuit.group.forEach(function (juggler) {
                // list ratings by each juggler's preference
                resultString.push([
                    juggler.id,
                    utils.generateRatings(parsedData.jugglers[juggler.index]),
                    ' '
                ].join(''))
            });

            resultString.push('\r\n');
        });

        fs.writeFile('output.txt', resultString.join(''), function(err) {
             if(err) {
                return console.log(err);
             }

             console.log("file written!");
         });
        //console.log(resultString.join(''));
    });

    function assignJuggler(juggler, index) {
        var assignment;

        if (juggler.assigned === undefined) {
            assignment = juggler.circuitPreference.some(function(preference){
                if (parsedData.circuits[preference].group.length < groupSize) {
                    juggler.assigned = preference;
                    parsedData.circuits[preference].group.push({
                        id : juggler.id,
                        index : index
                    });

                    return true;
                } else {
                    return parsedData.circuits[preference].group.some(function(existingJuggler, existingIndex, currentGroup){
                        var /*existingJuggler = parsedData.jugglers.filter(function(e){return e.id === existingJuggler.id})[0],*/
                            jugRating = calcDot([
                                [ juggler.H, juggler.E, juggler.P ],
                                [ parsedData.circuits[this.preference].H, parsedData.circuits[this.preference].E, parsedData.circuits[this.preference].P ]
                            ]),
                            existingRating = calcDot([
                                [ parsedData.jugglers[existingJuggler.index].H, parsedData.jugglers[existingJuggler.index].E, parsedData.jugglers[existingJuggler.index].P ],
                                [ parsedData.circuits[this.preference].H, parsedData.circuits[this.preference].E, parsedData.circuits[this.preference].P ]
                            ]),
                            removedIndex = 0; //default

                        if (jugRating > existingRating) {
                            // get index to mark as unassigned
                            parsedData.jugglers.filter(function(e, i){
                                if (e.id === existingJuggler.id) {
                                    removedIndex = i;
                                    return true;
                                }
                            });

                            currentGroup.splice(existingIndex, 1, {
                                id : juggler.id,
                                index : index
                            });

                            parsedData.jugglers[removedIndex].assigned = undefined;

                            juggler.assigned = this.preference;

                            assignJuggler(parsedData.jugglers[removedIndex], removedIndex);
                            return true;
                        }

                        return false;
                    }, { preference : preference });
                }
            });

            // if all its preferred circuits were empty then just chuck it into an empty circuit
            if (!assignment) {
                parsedData.circuits.some(function(circuit, index){
                    if (circuit.group.length < groupSize) {
                        juggler.assigned = index;
                        circuit.group.push({
                            id : juggler.id,
                            index : index
                        });

                        return true;
                    }
                });
            }
        }
    }

    function calcDot(arr) {
        return (arr[0][0] * arr[1][0]) + (arr[0][1] * arr[1][1]) + (arr[0][2] * arr[1][2]);
    }

    function generateRatings(juggler) {
        return juggler.circuitPreference.map(function(preference){
            var circuitIndex = 0; // default

            parsedData.circuits.some(function(circuit, i){
                if (circuit.id === 'C' + preference) {
                    circuitIndex = i;
                    return true;
                }
            });

            return [
                ' C',
                preference,
                ':',
                calcDot([
                    [ juggler.H, juggler.E, juggler.P ],
                    [ parsedData.circuits[circuitIndex].H, parsedData.circuits[circuitIndex].E, parsedData.circuits[circuitIndex].P ]
                ])
            ].join('');
        });
    }
}());
