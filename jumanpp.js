var exec     = require('child_process').exec;
var execSync = require('child_process').execSync;
var sq       = require('shell-quote');

var JUMANpp = function() {};

JUMANpp.prototype = {
    command : 'jumanpp',
    _format: function(arrayResult) {
        var result = [];
        if (!arrayResult) { return result; }
        // 表層形 読み 見出し語 品詞大分類 品詞大分類 ID 品詞細分類 品詞細分類 ID 活用型 活用型 ID 活用形 活用形 ID 意味情報
        arrayResult.forEach(function(parsed) {
            var i = 0;
            if (parsed.length <= 5) { return; }
            if (parsed[0].match(/^\@$/)) i = 1;
            result.push({
                surface       : parsed[0 + i],
                pronunciation : parsed[1 + i],
                entry         : parsed[2 + i],
                compound      : parsed[3 + i],
                compound2     : parsed[5 + i],
                // ID1           : parsed[5],
                // compound3     : parsed[6],
                // compound4     : parsed[7],
                // ID2           : parsed[8],
                // conjugation1  : parsed[9],
                // conjugation2  : parsed[10],
                inflecion     : parsed[11 + i].replace(/代表表記:/,""),
                kanji_reading : parsed[12 + i].match(/^漢字読み\S+$/)?parsed[12 + i].replace(/漢字読み:/,""):"",
                category      : parsed[13 + i].match(/^カテゴリ\S+$/)?parsed[13 + i].replace(/カテゴリ:/,""):parsed[12 + i].replace(/カテゴリ:/,""), 
                domain        : parsed[13 + i].match(/^ドメイン\S+$/)?parsed[13 + i].replace(/ドメイン:/,""):""
            });
        });
        return result;
    },
    _shellCommand : function(str) {
        return sq.quote(['echo', str]) + ' | ' + this.command;
    },
    _parseJUMANppResult : function(result) {
        return result.split('\n').map(function(line) {
            var arr = line.split(/[\s\t]+/g);
            // EOS
            if(arr&&arr.length > 10){
                arr[arr.length - 1] = arr[arr.length - 1].substr(0,arr[arr.length - 1].length - 2)
                arr[arr.length - 3] = arr[arr.length - 3].substr(1,arr[arr.length - 3].length - 1)
            }
            if (arr.length === 1) {
                return [line];
            }
            return arr;
        });
    },
    parse : function(str, callback) {
        process.nextTick(function() { // for bug
            exec(JUMANpp._shellCommand(str), function(err, result) {
                if (err) { return callback(err); }
                callback(err, JUMANpp._parseJUMANppResult(result).slice(0,-2));
            });
        });
    },
    parseSync : function(str) {
        var result = execSync(JUMANpp._shellCommand(str));
        return JUMANpp._parseJUMANppResult(String(result)).slice(0, -2);
    },
    parseFormat : function(str, callback) {
        JUMANpp.parse(str, function(err, result) {
            if (err) { return callback(err); }
            callback(err, JUMANpp._format(result));
        });
    },
    parseSyncFormat : function(str) {
        return JUMANpp._format(JUMANpp.parseSync(str));
    }
};

for (var x in JUMANpp.prototype) {
    JUMANpp[x] = JUMANpp.prototype[x];
}

module.exports = JUMANpp;
