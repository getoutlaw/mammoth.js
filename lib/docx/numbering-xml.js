exports.readNumberingXml = readNumberingXml;
exports.Numbering = Numbering;
exports.defaultNumbering = new Numbering({});

function Numbering(nums, abstractNums, styles, styleIdMap) {
    function findLevel(numId, level, styleId) {
        // var num = nums[numId];
        var num = nums[numId] || (styleIdMap && styleIdMap[styleId]);
        console.log('num', nums[numId], (styleIdMap && styleIdMap[styleId]));
        if (num) {
            console.log('findLevel.num', nums, numId, abstractNums, num.abstractNumId);
            var abstractNum = abstractNums[num.abstractNumId];
            if (abstractNum.numStyleLink == null) {
                console.log('findLevel.num.numStyleLink', abstractNums[num.abstractNumId].levels[level]);
                return abstractNums[num.abstractNumId].levels[level];
            } else {
                var style = styles.findNumberingStyleById(abstractNum.numStyleLink);
                console.log('findLevel.num.style', style);
                return findLevel(style.numId, level, styleId);
            }
        } else {
            return null;
        }
    }

    return {
        findLevel: findLevel
    };
}

function readNumberingXml(root, options) {
    if (!options || !options.styles) {
        throw new Error("styles is missing");
    }

    var abstractNums = readAbstractNums(root);
    var nums = readNums(root, abstractNums);
    var styleIdMap = createStyleIdMap(root, abstractNums);
    return new Numbering(nums, abstractNums, options.styles, styleIdMap);
}

function readAbstractNums(root) {
    var abstractNums = {};
    root.getElementsByTagName("w:abstractNum").forEach(function(element) {
        var id = element.attributes["w:abstractNumId"];
        abstractNums[id] = readAbstractNum(element);
    });
    return abstractNums;
}

function readAbstractNum(element) {
    var levels = {};
    element.getElementsByTagName("w:lvl").forEach(function(levelElement) {
        var levelIndex = levelElement.attributes["w:ilvl"];
        var numFmt = levelElement.first("w:numFmt").attributes["w:val"];
        var lvlText = levelElement.firstOrEmpty("w:lvlText").attributes["w:val"];
        var pStyle = levelElement.firstOrEmpty("w:pStyle").attributes["w:val"];
        levels[levelIndex] = {
            isOrdered: numFmt !== "bullet",
            level: levelIndex,
            numFmt: numFmt,
            lvlText: lvlText,
            pStyle: pStyle
        };
    });

    var numStyleLink = element.firstOrEmpty("w:numStyleLink").attributes["w:val"];

    return {levels: levels, numStyleLink: numStyleLink};
}

function readNums(root) {
    var nums = {};
    root.getElementsByTagName("w:num").forEach(function(element) {
        var numId = element.attributes["w:numId"];
        var abstractNumId = element.first("w:abstractNumId").attributes["w:val"];
        nums[numId] = {abstractNumId: abstractNumId};
    });
    return nums;
}

function createStyleIdMap(root, abstractNums) {
    var map = {};
    Object.keys(abstractNums).forEach(function(numKey) {
        Object.keys(abstractNums[numKey]).forEach(function(k) {
            if (abstractNums[numKey][k].pStyle) {
                map[abstractNums[numKey][k].pStyle] = abstractNums[numKey][k];
            }
        });
    });
    return map;
}
