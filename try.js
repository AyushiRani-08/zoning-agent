const { runStudy } = require('./feasibility');

const plot = {
    type: 'Polygon',
    coordinates: [[
        [76.9600, 11.0000],
        [76.9604, 11.0000],
        [76.9604, 11.0005],
        [76.9600, 11.0005],
        [76.9600, 11.0000]
    ]]
};

console.log(runStudy(plot, 'warehouse'));