var fs = require('fs'),
    DictClass = require('./dictclass'),
    // global dictionary
    dicts = {
        // the list contains instance of DictMeta
        'en2zh' : [],
        'zh2en' : []
    }

var Parser = {

    loadDictSync : function (ifoFile, idxFile, dictFile, fromLang, toLang) { 
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
    },
    /**
     * 
     * @param {toBeTranslated} the word to be translated
     * @param {formLang} source language
     * @param {toLang} target language, like 'zh','en'
     * @return {String} spliced results
     */
    lookup : function (toBeTranslated, fromLang, toLang) {
        //TODO: format the raw content
        var results = lookupRaw(toBeTranslated, fromLang, toLang);
        var formatted = '';
        for (var resp in results){
            formatted += results[resp].dictName + '<br/>';
            formatted += results[resp].rawContent + '<br/><br/>';
        }
        return formatted;
    },

    /**
     * prefetch some matching words
     * @param {prefix} the characters user inputs in the typeahead control
     * @param {amount} how many matching words should be returned, note: it's possible the returned array size is less than the amount.
     * @param {fromLang}
     * @param {toLang}
     * @return {array}
     */
    prefetch : function (prefix, amount, fromLang, toLang) {
        if (typeof prefix === undefined || null == prefix || prefix.trim() == '') return [];
        var lookingDicts = dicts[fromLang + '2' + toLang],
            results = [];
        lookingDicts.forEach(function (dictMeta){
            var pos = exploreBinarySearch(dictMeta.indexes, prefix),
                subresult = [];
            if (pos != -1){
                // fetch a chunk
                for (var i=pos; i<pos + amount && i<dictMeta.indexes.length - 1 && match(dictMeta.indexes[pos].word, prefix); i++){
                    var item = dictMeta.indexes[i];
                    //TODO: return a brief translated content also?
                    
                    subresult.push(item.word);
                }
            }
            Array.prototype.push.apply(results, subresult);
        });

        // now results contains matching words from multiple dictionary, need merge then sort them
        // remove duplicated one
        debugger;
        for (var i=0; i<results.length; i++){
            for (var w=i+1; w<results.length; w++){
                if (results[i] == results[w]){
                    results.splice(w, 1);
                    w--;
                }
            }
        }

        results.sort(function(a, b){
            return a > b;
        });

        return results;

    }
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

/**
 * a responsive function of 'typeahead' control on UI
 * @param {items} array of dict index.
 * @param {prefix} the characters user has already typed in the control
 * @return {int} the index of first matching word
 */
function exploreBinarySearch(items, prefix){
    //binary search first
    var startIndex = 0,
        stopIndex = items.length - 1,
        middle = Math.floor((stopIndex + startIndex)/2);
    while(!match(items[middle]['word'], prefix) && startIndex < stopIndex){
        // adjust search area
        var middlePrefix = items[middle]['word'].substr(0, items[middle]['word'].length > prefix.length ? prefix.length : items[middle]['word'].length);
        if (prefix < middlePrefix){
            stopIndex = middle - 1;
        }else if (prefix > middlePrefix){
            startIndex = middle + 1;
        }

        // recalculate middle
        middle = Math.floor((stopIndex + startIndex)/2);
        if (typeof items[middle] === undefined || null == items[middle]) return -1;
    }

    // Now, the middle one matches with the prefix.
    var exploreIndex = middle;
    // there are multiple matching words backward, iterate matching backward
    while(exploreIndex >=0 && match(items[exploreIndex]['word'], prefix)){
        exploreIndex --;
    }

    if (exploreIndex + 1 >= 0) return exploreIndex + 1;

    return -1;
}

function match(item, prefix){
    var pattern = new RegExp('^'+prefix+'.*$', 'gi');
    return pattern.test(item);
}
    
function lookupRaw(toBeTranslated, fromLang, toLang) {
    if (typeof toBeTranslated === undefined || null == toBeTranslated || toBeTranslated.trim() == '') return '';

    var lookingDicts = dicts[fromLang + '2' + toLang],
        results = [];
    lookingDicts.forEach(function (dictMeta){
        var pos = binarySearch(dictMeta.indexes, toBeTranslated), 
            rawContent = '';
        if (pos == -1){
            rawContent = '';
        }else{
            var item = dictMeta.indexes[pos];
            rawContent = dictMeta.dictData.toString('UTF-8', item.offset, item.offset + item.length);
        }
        if (rawContent){
            var response = new DictClass.LookupResponse(dictMeta.dictName, rawContent);
            results.push(response);
        }
    });
    return results;
}

module.exports = Parser;
