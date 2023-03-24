var ntru=require("ntru-legacy");
var util=require("./util.js");

"use strict";

module.exports = { PQ0Q_ENCRYPT, PQ0Q_DECRYPT, PQ0Q_GEN };

async function PQ0Q_GEN(){
    keyPair=await ntru.keyPair();
    keyPair.publicKey=util.arrayToHex(keyPair.publicKey);
    keyPair.privateKey=util.arrayToHex(keyPair.privateKey);
    return keyPair;
}

async function PQ0Q_ENCRYPT(data,pub){ //hex

    var rawData,rawPub;

    rawData=util.hexToArray(data);
    rawPub=util.hexToArray(pub);
        var encrypted=await ntru.encrypt(rawData,rawPub);
        return util.arrayToHex(encrypted);
    
}

async function PQ0Q_DECRYPT(data,priv){ //hex

    var rawData,rawPriv;

    rawData=util.hexToArray(data); 

    rawPriv=util.hexToArray(priv);
    var decrypted=await ntru.decrypt(rawData,rawPriv);
    return util.arrayToHex(decrypted); 
    
}


