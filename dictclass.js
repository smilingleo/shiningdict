/**
 * a word's index information
 */
exports.WordIndex = function (word, offset, length){
    this.word = word;
    this.offset = offset;
    this.length = length;
}

/**
 * dict file meta data
 */
exports.DictMeta = function (dictName, fromLang, toLang, indexes, dictData){
    this.dictName = dictName;
    this.fromLang = fromLang;
    this.toLang = toLang;
    this.indexes = indexes;
    this.dictData = dictData;
}

/**
 * lookup response
 */
exports.LookupResponse = function(dictName, rawContent) {
    this.dictName = dictName;
    this.rawContent = rawContent;
}
