var net = require('net');
var split = require('split');
var crypto=require("crypto");
var hash=require("./hash.js");
//var Enc=require("./encdec.js")
var Enc=require("./encdec-chacha.js")
var ntruenc=require("./ntruenc.js");

var creds=require("./clientcreds.js");

var toDial_pub;//=creds.pub_hex_server;

var pmine, pyours, pload, toSend, challenge, key;
var dialAns=null;
var Cmd; 
var keys;//=creds.keys;

var client = new net.Socket();
client.setEncoding('utf8');


var pass=0;
var stream = client.pipe(split());
stream.on('data',async function(data){
    if (data=="") return;

    if (pass==0){
    //console.log("Should send solved + key");
     //must contain challengeHash + new challenge
     var dec=await ntruenc.PQ0Q_DECRYPT(data,keys.priv);
     challengeHash=dec.substring(0,128);
     //now confirming hashes
     //console.log("challenge hash is "+challengeHash);
     if (challengeHash!=hash.createHash(challenge)){
       console.log("Wrong hash");
       dialAns=-1;
       client.end();
     }
     //new challenge
     newchallenge=dec.substring(128,dec.length);
     //console.log("New challenge is "+newchallenge+" length "+newchallenge.length);
     //hashing new challenge
     newchallengeHash=hash.createHash(newchallenge)
     //generating key
     key=crypto.randomBytes(32);
     key=key.toString("hex");
     //send back
     toSend=newchallengeHash+key;
     //console.log("=> key is "+key+" length "+key.length);
     //now encrypting with server key
     var toSend=await ntruenc.PQ0Q_ENCRYPT(toSend,toDial_pub);
     //sending solved +key; the server will sotre key
     client.write(toSend+'\n');
     
    }
    
    if (pass==1){
        var decrypted=Enc.decrypt(data,Buffer.from(key,"hex"));
        //console.log("Pass-1: "+decrypted); // GO or NO
        if (decrypted!="GO")
        {dialAns=-1;client.end();}

     ///////////////////////////////////
     //Now sending an encrpyted command
     /*
     cmd="date";
     var arg = process.argv[2];
        if (typeof arg=="undefined") cmd="date";
        else cmd=arg;
        */

     encrypted=Enc.encrypt(Cmd,Buffer.from(key,"hex"));
     //console.log("Encrypted command: "+encrypted);
     client.write(encrypted+"\n");

    }
    if (pass>=2){
        var decrypted=Enc.decrypt(data,Buffer.from(key,"hex"));
        dialAns=decrypted;
        console.log("It said: "+decrypted);
        console.log("*EOT*");
        client.end();
    }

    pass++;
});


client.on('error', function(ex) {
    console.log("Error! Could not connect");
    dialAns=-1;
  });

(async () => {

var Keys=new Object();
Keys.pub="";
Keys.priv="";


z=await PQubeDial({port:90,host:"127.0.0.1",pub:""},Keys,"date"); 
console.log(z);

})();

async function PQubeDial(opts,Keys,cmd){
    toDial_pub=creds.pub_hex_server;//=opts.pub
    keys=creds.keys;//=Keys
    client.timeout=opts.timeout;
    Cmd=cmd;
    client.connect(opts.port, opts.host, async function() {
        z=await doPQubeHandshake();  
    });
    while (dialAns==null) await new Promise(r => setTimeout(r, 200));
    return dialAns; 
    
}

async function doPQubeHandshake(){
    //sending pmine, pyours pload
    challenge=crypto.randomBytes(32);
    challenge=challenge.toString("hex");
    //console.log("challenge is "+challenge);
    pmine=keys.pub;
    pyours=hash.createHash(toDial_pub);
    pload=await ntruenc.PQ0Q_ENCRYPT(challenge,toDial_pub);
    toSend=pmine+pyours+pload;
    client.write(toSend+'\n');
}


