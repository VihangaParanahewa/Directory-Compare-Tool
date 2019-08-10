const fs = require('fs');
const diff = require('diff');
const dirCompare = require('dir-compare');
const jsonFile = require('jsonfile');
const file = 'fileStructure.json';
const wildcard = require('wildcard');

const jsonContent = jsonFile.readFileSync(file);

let data = [ ];
let missingFiles = [];
let jsonFilePath = 'Diff.json';

let count = 0;

let displayResult = false;
let displayMessages = false;

let contents2;
var diffFiles, removedArray, addedArray, oldMissingDir, newMissingDir, oldMissingFile, newMissingFile;
diffFiles = removedArray = addedArray = oldMissingFile = newMissingFile = oldMissingDir = newMissingDir = [];

let isFromPost = false;

let options =
    {
        compareContent: true,
        compareFileSync: dirCompare.fileCompareHandlers.lineBasedFileCompare.compareSync,
        compareFileAsync: dirCompare.fileCompareHandlers.lineBasedFileCompare.compareAsync,
        ignoreLineEnding: true,
        ignoreWhiteSpaces: true
    };

let path1 = '';
let path2 = '';

var diffController = {


    getDiff: async function (req, resp) {

        resetVariables();


        if (path1 === '' || path2 === '') {
            if (!isFromPost) {
                resp.render('index',{
                    success: false,
                    displayResult: displayResult,
                    displayMessages: displayMessages,
                    displayMissingFiles: false
                });
            } else {

                displayMessages = true;
                resp.render('index', {
                    success: false,
                    message: 'Directory Path is Empty',
                    displayResult: displayResult,
                    displayMessages: displayMessages,
                    displayMissingFiles: false
                });

            }

        } else if (path1 === path2) {

            displayMessages = true;
            resp.render('index', {
                success: false,
                path: {old: path1, new: path2},
                message: 'Directory Path is Same, No diff found',
                displayResult: displayResult,
                displayMessages: displayMessages,
                displayMissingFiles: false
            });

        } else {
            try {

                displayResult = true;
                var res = new Promise((resolve, reject) => {
                    resolve(dirCompare.compareSync(path1, path2, options));
                });

                diffController.findMissingFiles(await res);

                if (diffFiles.length === 0) {
                    missingFiles[0].oldMissingDir = oldMissingDir;
                    missingFiles[0].newMissingDir = newMissingDir;
                    missingFiles[0].oldMissingFile = oldMissingFile;
                    missingFiles[0].newMissingFile = newMissingFile;

                    resp.render('index', {
                        success: true,
                        path: {old: path1, new: path2},
                        data: data,
                        displayResult: displayResult,
                        displayMessages: displayMessages,
                        missingFiles: missingFiles,
                        displayMissingFiles: true
                    });
                }

                for (let j = 0; j < diffFiles.length; j++) {

                    let content = await diffController.getContentOfOriginal(j);
                    let asyncJ = await diffController.getContentOfOld(j, content);
                    if (asyncJ === diffFiles.length - 1) {
                        missingFiles[0].oldMissingDir = oldMissingDir;
                        missingFiles[0].newMissingDir = newMissingDir;
                        missingFiles[0].oldMissingFile = oldMissingFile;
                        missingFiles[0].newMissingFile = newMissingFile;

                        resp.render('index', {
                            success: true,
                            path: {old: path1, new: path2},
                            data: data,
                            displayResult: displayResult,
                            displayMessages: displayMessages,
                            missingFiles: missingFiles,
                            displayMissingFiles: true
                        });
                    }

                }
            } catch (e) {

                displayMessages = true;
                resp.render('index', {
                    success: false,
                    path: {old: path1, new: path2},
                    message: 'No such file or directory, Check directory paths',
                    displayMessages: displayMessages,
                    displayResult: displayResult,
                    displayMissingFiles: false
                });

            }
        }
    },



    compareDiff: function (request, response) {

        path1 = request.body.path1;
        path2 = request.body.path2;
        isFromPost = true;

        response.redirect('/');


    },



    getPathsInVerboseMode: function(pathOld, pathNew){

        path1 = pathOld;
        path2 = pathNew;
        try {
            if (fs.existsSync(jsonFilePath)) {
                fs.unlinkSync(jsonFilePath)
            }
        } catch(err) {
            console.error(err)
        }
        this.verboseMode();
    },




    verboseMode: async function () {
        resetVariables();

        if (path1 === '' || path2 === '') {

            console.log('Directory Path(s) Empty');

        }
        if (path1 === path2 && path1 !== '') {

            console.log('Directory Paths are Same, No diff found');

        }
        try {

            displayResult = true;
            var res = new Promise((resolve, reject) => {
                resolve(dirCompare.compareSync(path1, path2, options));
            });

            this.findMissingFiles(await res);

            if(diffFiles.length === 0)
            {
                missingFiles[0].oldMissingDir = oldMissingDir;
                missingFiles[0].newMissingDir = newMissingDir;
                missingFiles[0].oldMissingFile = oldMissingFile;
                missingFiles[0].newMissingFile = newMissingFile;

                let obj = {data, missingFiles};
                let json = JSON.stringify(obj);


                if(data.length > 0 || missingFiles > 0)
                {

                    fs.writeFile(jsonFilePath, json, 'utf8', (err)=>
                    {
                        if(err)
                        {
                            console.log(err);
                        }
                    });
                }
            }

            for (let j = 0; j < diffFiles.length; j++) {

                let content = await this.getContentOfOriginal(j);
                let asyncJ = await this.getContentOfOld(j, content);
                if (asyncJ === diffFiles.length - 1) {
                    missingFiles[0].oldMissingDir = oldMissingDir;
                    missingFiles[0].newMissingDir = newMissingDir;
                    missingFiles[0].oldMissingFile = oldMissingFile;
                    missingFiles[0].newMissingFile = newMissingFile;

                    let obj = {data, missingFiles};
                    let json = JSON.stringify(obj);


                    if(data.length > 0 || missingFiles > 0)
                    {

                        fs.writeFile(jsonFilePath, json, 'utf8', (err)=>
                        {
                            if(err)
                            {
                                console.log(err);
                            }
                        });
                    }

                }
            }
        } catch (e) {

            console.log('No such file or directory, Check directory paths');
            console.log(e);

        }
    },






    findMissingFiles: function (res) {

        let addFiles;
        let entryType;
        let entryName;
        addFiles = false;

        let distinctCount = 0;
        console.log("Finding Missing Files...");
        console.log("Finding Remove / Newly Added Content...");

        res.diffSet.forEach(function (entry)
        {
            if(entry.name1)
            {
                entryType = entry.name1.split(".").pop();
                entryName = entry.name1;

            } else {

                entryType = entry.name2.split(".").pop();
                entryName = entry.name2;

            }

            addFiles = diffController.filterProcess(entryType, entryName);



            if(addFiles) {

                if (entry.state === 'distinct') {

                    if (entry.relativePath !== '') {
                        diffFiles[distinctCount] = entry.relativePath + '\\' + entry.name1;
                    } else {
                        diffFiles[distinctCount] = '\\' + entry.name1;
                    }
                    distinctCount++;

                }


                if (entry.state === 'left') {

                    if (entry.relativePath !== '') {
                        if (entry.type1 === 'file') {
                            newMissingFile.push(path2 + entry.relativePath + '\\' + entry.name1);
                        } else {
                            newMissingDir.push(path2 + entry.relativePath + '\\' + entry.name1);
                        }
                    } else {
                        if (entry.type1 === 'file') {
                            newMissingFile.push(path2 + entry.relativePath + '\\' + entry.name1);
                        } else {
                            newMissingDir.push(path2 + entry.relativePath + '\\' + entry.name1);
                        }
                    }
                }


                if (entry.state === 'right') {

                    if (entry.relativePath !== '') {
                        if (entry.type2 === 'file') {
                            oldMissingFile.push(path1 + entry.relativePath + '\\' + entry.name2);
                        } else {
                            oldMissingDir.push(path1 + entry.relativePath + '\\' + entry.name2);
                        }
                    } else {
                        if (entry.type2 === 'file') {
                            oldMissingFile.push(path1 + entry.relativePath + '\\' + entry.name2);
                        } else {
                            oldMissingDir.push(path1 + entry.relativePath + '\\' + entry.name2);
                        }
                    }

                }
            }
        });

        console.log("Number of different Files: " + distinctCount);

    },





    filterProcess: function (entryType, entryName)
    {
        let notIgnored = false;

        if(jsonContent.IncludeFiles.length > 0)
        {
            for (let i = 0; i < jsonContent.IncludeFiles.length; i++) {

                if (wildcard(jsonContent.IncludeFiles[i], entryName))
                {
                        return true;
                }
            }

        } else if (jsonContent.IgnoredFiles.length > 0){

            for (let i = 0; i < jsonContent.IgnoredFiles.length; i++)
            {
                if (wildcard(jsonContent.IgnoredFiles[i], entryName))
                {
                    return false;
                } else {
                    notIgnored = true;
                }
            }

        } else {
            return true;
        }

        if(notIgnored)
        {
            return true;
        }
    },




    getContentOfOriginal: function (j) {
        return new Promise(function (resolve, reject) {
            fs.readFile(path1 + diffFiles[j], 'utf8', function (err, contents) {
                if (!err) {
                    resolve(contents)
                }

            });
        })

    },




    getContentOfOld: function (j, content) {
        return new Promise(function (resolve, reject) {
            fs.readFile(path2 + diffFiles[j], 'utf8', function (err, contents) {

                contents2 = contents;

                let options =
                    {
                        ignoreCase: true,
                        ignoreWhitespace: true
                    };

                const res = diff.diffLines(content, contents2, options);
                removedArray = [];
                addedArray = [];
                let added = 0;
                let removed = 0;

                for (let i = 0; i < res.length; i++) {
                    if (res[i].removed) {
                        if (res[i].value.split('\n').filter(skipComments).toString() !== '') {
                            res[i].value.split('\n').filter(skipComments).forEach(function (item) {
                                removedArray[removed] = item.toString().replace(/\r/g, '');
                                removed++;
                            });
                        }

                    }

                    if (res[i].added) {
                        if (res[i].value.split('\n').filter(skipComments).toString() !== '') {
                            res[i].value.split('\n').filter(skipComments).forEach(function (item) {
                                addedArray[added] = item.toString().replace(/\r/g, '');
                                added++;
                            });

                        }
                    }
                }

                for (let j = 0; j < removedArray.length; j++) {
                    for (let k = 0; k < addedArray.length; k++) {
                        if (removedArray[j] === addedArray[k]) {
                            removedArray.splice(j, 1);
                            addedArray.splice(k, 1);
                            k = -1;
                        }
                    }
                }

                if (removedArray.length > 0 || addedArray.length > 0) {
                    count++;

                    data[count] = {

                        path: {removedContentPath: path1 + diffFiles[j], addedContentPath: path2 + diffFiles[j]},
                        added: [],
                        removed: [],
                        index: count

                    };

                    if (addedArray.length > 0) {
                        for (let j = 0; j < addedArray.length; j++) {
                            data[count].added[j] = addedArray[j];
                        }

                    }
                    if (removedArray.length > 0) {
                        for (let j = 0; j < removedArray.length; j++) {
                            data[count].removed[j] = removedArray[j];
                        }
                    }
                }
                if (!err) {
                    resolve(j)
                }
            });
        });
    },
};





function skipComments(value) {
    if (value.charAt(0) !== '#') {
        return value;
    }
}



function resetVariables(){
    data = [];
    count = 0;
    diffFiles = [];
    oldMissingDir = [];
    newMissingDir = [];
    oldMissingFile = [];
    newMissingFile = [];
    displayResult = false;
    displayMessages = false;

    missingFiles[0] = {

        oldMissingDir: [],
        newMissingDir: [],
        oldMissingFile: [],
        newMissingFile: []

    };
}



module.exports = diffController;
