const diffController = require('./controllers/diffController');

let pathOld = '';
let pathNew = '';

process.argv.forEach(function (val, index) {
    if(index === 2)
    {
        pathOld = val;
    }
    if(index === 3)
    {
        pathNew = val;
    }
});

diffController.getPathsInVerboseMode(pathOld, pathNew);
