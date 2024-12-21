const net = require("net");
const crypto = require("crypto");
// You can use print statements as follows for debugging, they'll be visible when running tests.
// console.log("Logs from your program will appear here!",process.env,process.argv);
let index = process.argv.indexOf("--port");
const serverType = process.argv.indexOf("--replicaof") != -1 ? "slave" : "master";
// let replicaHost = replicaIndex
let port = index === -1 ? 6379 : process.argv[index+1];

let obj={};

function generateRandomString(){
  return crypto.randomBytes(40).toString('hex');
}
// Uncomment this block to pass the first stage
const server = net.createServer(async(connection) => {
  // Handle connection
  connection.on("data", async(data) =>{

    let receivedData = data.toString();
    let coommands = receivedData.split("\r\n");
  
    /**
     * sets key in redis
     */
    if (coommands[2] == "SET") {

      const key = coommands[4];
      obj[key]=coommands[6];
      if(coommands[10]){
        setTimeout(() =>{
          delete obj[key];
        },coommands[10])
      }
      return connection.write('+OK\r\n');
    }

     /**
     * gets  key from redis
     */
    if (coommands[2] == "GET") {
      const key = coommands[4];
      let val=obj[key];
      if(val){
        let len=val.length;
        return connection.write("$" + len + "\r\n" + val + "\r\n");

      }else{
        return connection.write('$-1\r\n');

      }
    }

    /**
     * echo works!
     */
    if (coommands[2] == "ECHO") {
      const str = coommands[4];
      const l = str.length;
      return connection.write("$" + l + "\r\n" + str + "\r\n");
    }

    /**
     * ping works!
     */
    if(receivedData==='*1\r\n\$4\r\nPING\r\n'){
        connection.write('+PONG\r\n');
    }
  
    let randomString = await generateRandomString();
    let master_replid=randomString;
    let master_repl_offset=0;

    if(coommands.includes("INFO")){
      console.log("here");
      const serverKeyValuePair = `role:${serverType}`
      console.log(master_replid,"master_repl_offset",master_repl_offset);
      let conString =`${serverKeyValuePair.length} ${serverKeyValuePair}${master_replid}${master_repl_offset}\r\n`
        console.log("myconstring",conString);
      
            connection.write(`$${serverKeyValuePair.length}\r\n${serverKeyValuePair}\r\n${master_replid}\r\n${master_repl_offset}\r\n`);
    }


    // connection.end();
})
});
console.log("port",port);
server.listen(port, "127.0.0.1");
