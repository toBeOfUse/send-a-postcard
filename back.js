const http = require("http");
const fs = require("fs");

if (!fs.existsSync("index.txt")){
    fs.writeFileSync("index.txt", "");
}

http.createServer((req, res)=>{
    req.setEncoding("utf-8");
    let body = "";
    if (req.method=="POST" && req.url == "/mail/box"){
        const timestamp = new Date().toLocaleString();
        fs.appendFileSync("inbox.txt", "Receiving message at "+timestamp+":\n");
        req.on("data", (c)=>{
            body += c;
        });
        req.on("end", () => {
            fs.appendFile("inbox.txt", body+"\n\n---\n\n",
            function (err) {
                if (err) throw err;
                console.log('appended message to inbox.txt');
            });
            res.statusCode = 200;
            res.end();
        })
    } else {
        res.statusCode = 404;
        res.end();
    }
}).listen(8090);
console.log("server listening on port 8090");