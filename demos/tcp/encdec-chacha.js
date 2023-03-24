const crypto = require('crypto');
var chacha20 = require("./chacha20.js");


function encrypt(text,key) {
    iv = crypto.randomBytes(12);
    key=Buffer.from(key,"hex");
 var encrypted = chacha20.encrypt(key, iv, Buffer.from(text));
 var final= iv.toString("hex")+encrypted.toString("hex");
 final = Buffer.from(final, 'hex').toString('base64');
 //console.log(final);
 return final;
}

function decrypt(text,key) {
  text = Buffer.from(text, 'base64').toString('hex')
    var iv=text.substring(0,24);
    text=text.substring(24,text.length);
    iv = Buffer.from(iv, 'hex');
  key=Buffer.from(key,"hex");
  text=Buffer.from(text,"hex");
 var decrypted=chacha20.decrypt(key, iv, text);
 return decrypted.toString();
}

        module.exports = { encrypt, decrypt };