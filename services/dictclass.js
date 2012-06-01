var DictMeta = {

    ////////////////////////////// Dictionary Meta Data //////////////////////////////
    /**
     * a word's index information
     */
    WordIndex : function(word, offset, length){
        this.word = word;
        this.offset = offset;
        this.length = length;
    },

    /**
     * dict file meta data
     */
    DictMeta : function(dictName, fromLang, toLang, indexes, dictData){
        this.dictName = dictName;
        this.fromLang = fromLang;
        this.toLang = toLang;
        this.indexes = indexes;
        this.dictData = dictData;
    },

    /**
     * lookup response
     */
    LookupResponse : function(dictName, rawContent) {
        this.dictName = dictName;
        this.rawContent = rawContent;
    },

    ////////////////////////////// UI Models //////////////////////////////

    UserSession : function(username, password, timestamp){
        this.username = username;
        this.password = password;
        this.timestamp = timestamp;

    }
}


DictMeta.UserSession.prototype = {
    credential : function(){
        return this.username + "," + password;
    }
}

module.exports = DictMeta;
