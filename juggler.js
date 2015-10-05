(function(){
    var startTime = new Date(),
        fs = require('fs'),
        stringData = {
            circuits : [],
            jugglers : []
        },
        groupSize,
        resultString = [],
        utils = {
            calcDot : calcDot,
            assignJuggler : assignJuggler,
            generateRatings : generateRatings
        },
        LinkedList = require('./LinkedList');

    var ll = new LinkedList();
    var circuitsLL = new LinkedList();
    var jugglersLL = new LinkedList();

    fs.readFile("jugglefest.txt", "utf8", function (error, text) {
        var dataArr = text.split('\n\n');

        stringData.circuits = dataArr[0];
        stringData.jugglers = dataArr[1];

        // convert strings to arrays
        stringData.circuits = stringData.circuits.split('\n');
        stringData.jugglers = stringData.jugglers.split('\n');

        // setup mappings for circuits and jugglers
        stringData.circuits.forEach(function (e, i, arr) {
            var values = e.match(/(?:)(\d+)/g);

            /*arr[i] = {
                id: 'C' + values[0],
                    H: values[1],
                E: values[2],
                P: values[3],
                group: []
            };*/
            circuitsLL.push({
                id: 'C' + values[0],
                H: values[1],
                E: values[2],
                P: values[3],
                group: []
            });
        });

        stringData.jugglers.forEach(function (e, i, arr) {
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
                // TODO: make dynamic for every circuit
                circuitPreference : values.slice(4, values.length),
                circuitRating : []
            };

//            arr[i] = juggler;
            jugglersLL.push(juggler);
        });

        // number of jugglers assigned to a circuit should be the number of jugglers divided by the number of circuits
        groupSize = stringData.jugglers.length / stringData.circuits.length;


        // assign jugglers to circuits first by preference then bump for better fits
//        stringData.jugglers.forEach(utils.assignJuggler);
        jugglersLL.forEach(utils.assignJuggler);

        // sort circuit jugglers by dot rating
        stringData.circuits.forEach(function (circuit, i) {
            circuit.group.sort(function (jugglerB, jugglerA) {
                if (stringData.jugglers[jugglerA.index].circuitRating[i] > stringData.jugglers[jugglerB.index].circuitRating[i]) {
                    return 1;
                }

                if (stringData.jugglers[jugglerA.index].circuitRating[i] < stringData.jugglers[jugglerB.index].circuitRating[i]) {
                    return -1;
                }

                return 0;
            });
        });

        // generate result string, reverse to match sample output
        stringData.circuits.reverse();

        stringData.circuits.forEach(function (circuit) {
            resultString.push([circuit.id, ' '].join(''));

            circuit.group.forEach(function (juggler) {
                // list ratings by each juggler's preference
                resultString.push([
                    juggler.id,
                    utils.generateRatings(stringData.jugglers[juggler.index]),
                    ' '
                ].join(''))
            });

            resultString.push('\r\n');
        });

        console.log(new Date() - startTime);

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

        juggler = juggler.value;

        if (juggler.assigned === undefined) {
            // ignore last whitespace entry
            if (!juggler) {
                return;
            }
            assignment = juggler.circuitPreference.some(function(preference){
//                if (stringData.circuits[preference].group.length < groupSize) {
                if (circuitsLL.get(preference).group.length < groupSize) {
                    juggler.assigned = preference;
                    circuitsLL.get(preference).group.push({
                        id : juggler.id,
                        index : index
                    });

                    return true;
                } else {
                    return circuitsLL.get(preference).group.some(function(existingJuggler, existingIndex, currentGroup){
                        var /*existingJuggler = stringData.jugglers.filter(function(e){return e.id === existingJuggler.id})[0],*/
                            circuitPreference = circuitsLL.get(this.preference),
                            existingJugRating = jugglersLL.get(existingJuggler.index),
                            jugRating = calcDot([
                                [ juggler.H, juggler.E, juggler.P ],
                                [ circuitPreference.H, circuitPreference.E, circuitPreference.P ]
                            ]),
                            existingRating = calcDot([
                                [ existingJugRating.H, existingJugRating.E, existingJugRating.P ],
                                [ circuitPreference.H, circuitPreference.E, circuitPreference.P ]
                            ]),
                            removedIndex = 0; //default

                        if (jugRating > existingRating) {
                            // get index to mark as unassigned
                            stringData.jugglers.filter(function(e, i){
                                if (e.id === existingJuggler.id) {
                                    removedIndex = i;
                                    return true;
                                }
                            });

                            currentGroup.splice(existingIndex, 1, {
                                id : juggler.id,
                                index : index
                            });

                            stringData.jugglers[removedIndex].assigned = undefined;

                            juggler.assigned = this.preference;

                            assignJuggler(stringData.jugglers[removedIndex], removedIndex);
                            return true;
                        }

                        return false;
                    }, { preference : preference });
                }
            });

            // if all its preferred circuits were empty then just chuck it into an empty circuit
            if (!assignment) {
                circuitsLL.some(function(circuit, index){
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

            stringData.circuits.some(function(circuit, i){
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
                    [ stringData.circuits[circuitIndex].H, stringData.circuits[circuitIndex].E, stringData.circuits[circuitIndex].P ]
                ])
            ].join('');
        });
    }
}());
