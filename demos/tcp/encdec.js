// Nodejs encryption with CTR
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';


function encrypt(text,key) {
    iv = crypto.randomBytes(16);
 let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
 let encrypted = cipher.update(text);
 encrypted = Buffer.concat([encrypted, cipher.final()]);
 //return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
 return iv.toString("hex")+encrypted.toString("hex");
}

function decrypt(text,key) {
    var ivv=text.substring(0,32);
    var encryptedData=text.substring(32,text.length);
 let iv = Buffer.from(ivv, 'hex');
 let encryptedText = Buffer.from(encryptedData, 'hex');
 let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
 let decrypted = decipher.update(encryptedText);
 decrypted = Buffer.concat([decrypted, decipher.final()]);
 return decrypted.toString();
}

        module.exports = { encrypt, decrypt };