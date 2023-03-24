var net = require('net');
var split = require('split');
var crypto=require("crypto");
var hash=require("./hash.js");
//var Enc=require("./encdec.js");
var Enc=require("./encdec-chacha.js")
var ntruenc=require("./ntruenc.js");

var creds=require("./servercreds.js");

var pmine, pyours, pload, challenge, key;
var keys;

var server = net.createServer();



server.on('connection', async function(socket){
    socket.setEncoding('utf8');
    var pass=0;
    var stream = socket.pipe(split());
    stream.on('data',async function(data){
        if (data=="") return;
        //console.log(pass+": "+data);
        
            if (pass==0){
            //console.log("-I got challenge");
            pmine=data.substring(0,2054);
            pyours=data.substring(2054,2182);
            pload=data.substring(2182, 4226);
             //checking if pyours matches me. It is always hashed
             if(pyours!=hash.createHash(keys.pub)){
                console.log("Not me!");
                socket.end();
            }
             //decrypting pload
             var dec=await ntruenc.PQ0Q_DECRYPT(pload,keys.priv);
             //console.log("decrypted challenge is "+dec+ " length "+dec.length);
             //now hashing the challenge
            var challengeHash=hash.createHash(dec);
            //creating our challenge
            challenge=crypto.randomBytes(32);
            challenge=challenge.toString("hex");
            toEnc=challengeHash+challenge
            //console.log("New challenge "+challenge, "length "+challenge.length);
            //now encrypting with pmine
            var enc=await ntruenc.PQ0Q_ENCRYPT(toEnc,pmine);
            //now sending it back
            socket.write(enc+"\n");
            }
            
            if (pass==1){
            //console.log("-I got solved challenge + key; store key");
            //decrypting pload
            var dec=await ntruenc.PQ0Q_DECRYPT(data,keys.priv);
            //console.log("Decrypted data is "+dec);
            solvedChallenge=dec.substring(0,128);
            //check solvedchallenge
            //console.log("solved challenge is "+solvedChallenge);
            if (solvedChallenge!=hash.createHash(challenge)){
                console.log("Wrong hash");
                socket.end();
            }
            key=dec.substring(128,192);
            
            //console.log("=> key is "+key);

            var encrpyted=Enc.encrypt("GO",Buffer.from(key,"hex"));
            socket.write(encrpyted+"\n")
            }

            if (pass>=2){
            var decrypted = Enc.decrypt(data,Buffer.from(key,"hex"));
            console.log("Decrypted cmd is: "+decrypted);

            var executedcmd=await handleRequest(decrypted,pmine,key);//"Execd Cmd"
            var encrpyted=Enc.encrypt(executedcmd,Buffer.from(key,"hex"));
            socket.write(encrpyted+"\n");
            //server.close();
            }
        
            pass++;
    });
});

(async () => {
    var Keys=new Object();
    Keys.pub="";
    Keys.priv="";
 //server.listen(90, "127.0.0.1", function(){});
 startServer({port:90,host:"127.0.0.1",timeout:5000},Keys);

})();

async function startServer(opts,Keys){
    keys=creds.keys;//=Keys;
    server.timeout=opts.timeout;
    server.listen(opts.port, opts.host, function(){});
}
async function stopServer(){
    server.close();
}

async function handleRequest(cmd,pk,sk){

    if (cmd=="date"){
        var d=new Date();
        return d.toString();
    }
    if (cmd=="time"){
        var d=new Date();
        d=d.getTime();
        return d.toString();
    }
    if (cmd=="ping")
    return "pong";

    return "Invalid command";
}