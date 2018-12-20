var express = require("express");
var path = require("path");
var qs = require("qs");
var getPort = require('get-port');

var app = express();
app.use(express.static(path.join(__dirname, "dist")));

var server;

async function start() {
    var port = await getPort({port: [...Array(12)].map((d,i)=>3000+i)});
    server = app.listen(port, null, () => {
        var { address, port } = server.address();
        console.log(`Server is running on http://localhost:${port}`);
    });
}
start();

app.get("/risklab/feedback", (req, res) => {
    // do nothing
    console.log(JSON.stringify(req.url));
});
