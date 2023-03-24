const { app, BrowserWindow, ipcMain } = require('electron')
const fsl= require("fs").lstatSync;
var win;

app.on("browser-window-created", (e, win1) => {
    //win1.removeMenu();
});

function createWindow () {
// Create the browser window.
 win = new BrowserWindow({
	width: 470,
	height: 690,
    show:true,
    autoHideMenuBar:true,
	title: "FyrChat",
	webPreferences: {
        preload:__dirname+'/preload.js'
	}
})

// Load the index.html of the app.
win.loadFile(__dirname+'/index.html')

// Open the DevTools.
//win.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// This method is equivalent to 'app.on('ready', function())'
app.whenReady().then(createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
// On macOS it is common for applications and their menu bar
// to stay active until the user quits explicitly with Cmd + Q
if (process.platform !== 'darwin') {
	app.quit()
}
})

app.on('activate', () => {
	// On macOS it's common to re-create a window in the
	// app when the dock icon is clicked and there are no
	// other windows open.
if (BrowserWindow.getAllWindows().length === 0) {
	createWindow()
}
})

// In this file, you can include the rest of your
// app's specific main process code. You can also
// put them in separate files and require them here.

var msgs=[];


ipcMain.handle("sendCmd", async(events,args)=>{
	var opts=args.opts;
	var keys=args.keys;
	var cmd=args.cmd;
	z=await sendPQube(opts,keys,cmd);
	console.log(z);
	//if z==ok
	if (z=="ok")
	msgs.push({from:"this",msg:cmd});
	return z;
})
ipcMain.handle("getMsgs", async(events,args)=>{
	return msgs;
})
ipcMain.handle("delMsgs", async(events,args)=>{
	 msgs=[];
})
ipcMain.handle("listenCmd", async(events,args)=>{
	var opts=args.opts;
	var keys=args.keys;
	await startListener(opts,keys);
})
ipcMain.handle("stopCmd", async(events,args)=>{
	console.log("Stopped listener");
	server.close();
})
ipcMain.handle("getVals", async(events,args)=>{
    return {val:34, type:"ein"};
})
ipcMain.handle("resize", async(events,args)=>{
    win.setSize(450, 450, true);
})
ipcMain.handle("genKP", async(events,args)=>{
	var ntruenc=require("./ntruenc.js");
    kp=await ntruenc.PQ0Q_GEN();
	return kp;
})
ipcMain.handle('focus-fix', () => {
    win.blur();
    win.focus();
});

////////////////////////
var server;
async function startListener(_opts,_keys){
	var net = require('net');
	var split = require('split');
	var crypto=require("crypto");
	var hash=require("./hash.js");
	//var Enc=require("./encdec.js");
	var Enc=require("./encdec-chacha.js")
	var ntruenc=require("./ntruenc.js");
		
	var pmine, pyours, pload, challenge, key;
	var keys;
	
	server = net.createServer();
	
	
	
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
	
	/*
	(async () => {
		var Keys=new Object();
		Keys.pub="";
		Keys.priv="";
	 //server.listen(90, "127.0.0.1", function(){});
	 startServer({port:90,host:"127.0.0.1",timeout:5000},Keys);
	
	})();
	*/
	
	async function startServer(opts,Keys){
		keys=Keys;
		server.timeout=opts.timeout;
		server.listen(opts.port, opts.host, function(){});
		console.log("Started listener: "+opts.port+" "+opts.host);
	}
	async function stopServer(){
		server.close();
	}

	await startServer(_opts,_keys);

}//startListener ends


async function handleRequest(cmd,pk,sk){

    console.log("Received: "+cmd);
	msgs.push({from:"other",msg:cmd});
	return "ok";
}
////////////////////////

async function sendPQube(_opts,_keys,_cmd){
	var net = require('net');
var split = require('split');
var crypto=require("crypto");
var hash=require("./hash.js");
//var Enc=require("./encdec.js")
var Enc=require("./encdec-chacha.js")
var ntruenc=require("./ntruenc.js");


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

     encrypted=Enc.encrypt(Cmd,Buffer.from(key,"hex"));
     //console.log("Encrypted command: "+encrypted);
     client.write(encrypted+"\n");

    }
    if (pass>=2){
        var decrypted=Enc.decrypt(data,Buffer.from(key,"hex"));
        dialAns=decrypted;
        //console.log("It said: "+decrypted);
        //console.log("*EOT*");
        client.end();
    }

    pass++;
});


client.on('error', function(ex) {
    console.log("Error! Could not connect");
    dialAns=-1;
  });

  /*
(async () => {

var Keys=new Object();
Keys.pub="";
Keys.priv="";


z=await PQubeDial({port:90,host:"127.0.0.1",pub:""},Keys,"date"); 
console.log(z);

})();

*/

async function PQubeDial(opts,Keys,cmd){
    toDial_pub=opts.pub
    keys=Keys
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

return await PQubeDial(_opts,_keys,_cmd);

}
