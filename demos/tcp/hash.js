var crypto = require('crypto');
var util=require("./util.js");


function createHash(str){
var hash = crypto.createHash('sha512');
//passing the data to be hashed
//data = hash.update('nodejserdskgnjkghalksdjhglaekrjgtelktjaelkrtjelrkanodejserdskgnjkghalksdjhglaekrjgtelktjaelkrtjelrkanodejserdskgnjkghalksdjhglaekrjgtelktjaelkrtjelrkanodejserdskgnjkghalksdjhglaekrjgtelktjaelkrtjelrkanodejserdskgnjkghalksdjhglaekrjgtelktjaelkrtjelrkanodejserdskgnjkghalksdjhglaekrjgtelktjaelkrtjelrkanodejserdskgnjkghalksdjhglaekrjgtelktjaelkrtjelrkanodejserdskgnjkghalksdjhglaekrjgtelktjaelkrtjelrkanodejserdskgnjkghalksdjhglaekrjgtelktjaelkrtjelrkanodejserdskgnjkghalksdjhglaekrjgtelktjaelkrtjelrkanodejserdskgnjkghalksdjhglaekrjgtelktjaelkrtjelrkanodejserdskgnjkghalksdjhglaekrjgtelktjaelkrtjelrkanodejserdskgnjkghalksdjhglaekrjgtelktjaelkrtjelrkanodejserdskgnjkghalksdjhglaekrjgtelktjaelkrtjelrkanodejserdskgnjkghalksdjhglaekrjgtelktjaelkrtjelrkanodejserdskgnjkghalksdjhglaekrjgtelktjaelkrtjelrkanodejserdskgnjkghalksdjhglaekrjgtelktjaelkrtjelrkanodejserdskgnjkghalksdjhglaekrjgtelktjaelkrtjelrka');
var data=hash.update(str);
//Creating the hash in the required format
gen_hash= data.digest('hex');
//Printing the output on the console
//console.log("hash : " + gen_hash);
return gen_hash;
}

function createFoldedHash(str){
    var hash = crypto.createHash('sha512'); 
    var data=hash.update(str);
    var gen_hash= data.digest('hex');
    //now break in two
    b1=gen_hash.substring(0,64);
    b2=gen_hash.substring(64,128);
   // console.log("b1 "+b1);
   // console.log("b2 "+b2);
    var final=util.xor(b1,b2);
    return final;
}

module.exports = { createHash, createFoldedHash };