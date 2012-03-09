var fs = require('fs'),
    DictClass = require('./dictclass'),
    // global dictionary
    dicts = {
        // the list contains instance of DictMeta
        'en2zh' : [],
        'zh2en' : []
    }


exports.loadDictSync = function (ifoFile, idxFile, dictFile, fromLang, toLang) { 
    var fd = fs.openSync(ifoFile, 'r'),
        info = fs.readFileSync(ifoFile, 'UTF-8'),
        lines = info.split('\n'),
        nameLine = lines.filter(function(line){ return line.substr(0,8) == 'bookname'; }),
        dictName = nameLine[0].substring(9),
        entireFileBuffer = fs.readFileSync(idxFile),
        
        wordBytes = new Array(),
        isWord = true,
        isOffset = false,
        isLength = false,
        oneWord, offset, length, indexes = [];
    for (var i=0; i<entireFileBuffer.length; i++){
        if (isWord){
            if (entireFileBuffer[i] != 0){
                wordBytes.push(entireFileBuffer[i]);
            }else{
                oneWord = (new Buffer(wordBytes)).toString('utf8');
                isWord = false;
                isOffset = true;
                isLength = false;
            }
        }

        if (isOffset){
            // i is the position of \0
            offset = entireFileBuffer.readUInt32BE(i+1);
            isOffset = false;
            isLength = true;
        }

        if (isLength){
            length = entireFileBuffer.readUInt32BE(i+5);
            isLength = false;
            isWord = true;
            i += 8;
            //console.log('offset:' + offset);
            //console.log('length:' + length);

            var idx = new DictClass.WordIndex(oneWord, offset, length);
            wordBytes = new Array();
            indexes.push(idx);
        }
    }
    
    // To parse dict file, first of all, gunzip -S .dz xxxx.dict.dz
    var dictBuffer = fs.readFileSync(dictFile); // read as buffer
    
    var dictMeta = new DictClass.DictMeta(dictName, fromLang, toLang, indexes, dictBuffer);
    // add to proper array list
    dicts[fromLang + '2' + toLang].push(dictMeta);
}

/**
 * Uses a binary search algorithm to locate a value in the specified array.
 * @param {Array} items The array containing the item.
 * @param {variant} value The value to search for.
 * @return {int} The zero-based index of the value in the array or -1 if not found.
 */
function binarySearch(items, value){

    var startIndex  = 0,
        stopIndex   = items.length - 1,
        middle      = Math.floor((stopIndex + startIndex)/2);
    debugger;
    while(items[middle]['word'] != value && startIndex < stopIndex){

        //adjust search area
        if (value < items[middle]['word']){
            stopIndex = middle - 1;            
        } else if (value > items[middle]['word']){
            startIndex = middle + 1;
        }

        //recalculate middle
        middle = Math.floor((stopIndex + startIndex)/2);    
        if (typeof items[middle] === undefined || null == items[middle]) return -1;
    }

    //make sure it's the right value
    return (items[middle]['word'] != value) ? -1 : middle;
}

// Sort indexes, the idx file already in order.
// http://code.google.com/p/babiloo/wiki/StarDict_format
// bubbleSort(indexes);

    
function lookupRaw(toBeTranslated, fromLang, toLang) {
    if (typeof toBeTranslated === undefined || null == toBeTranslated || toBeTranslated.trim() == '') return '';

    var lookingDicts = dicts[fromLang + '2' + toLang],
        results = [];
    lookingDicts.forEach(function (dictMeta){
        var pos = binarySearch(dictMeta.indexes, toBeTranslated), 
            response = new DictClass.LookupResponse(dictMeta.dictName);
        if (pos == -1){
            response.rawContent = '';
        }else{
            var item = dictMeta.indexes[pos];
            response.rawContent = dictMeta.dictData.toString('UTF-8', item.offset, item.offset + item.length);
        }
        results.push(response);
    });
    return results;
}

/**
 * return an array of LookupResponse
 */
exports.lookup = function (toBeTranslated, fromLang, toLang) {
    //TODO: format the raw content
    var results = lookupRaw(toBeTranslated, fromLang, toLang);
    var formatted = '';
    for (var resp in results){
        formatted += results[resp].dictName + '<br/>';
        formatted += results[resp].rawContent + '<br/><br/>';
    }
    return formatted;
}


