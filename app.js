function heartbeat() {
    try {
        var colors = require("colors");
        var fs = require("fs");
        var app = require("express")();
        var http = require("http").Server(app);
        var io = require("socket.io")(http);
        var express = require("express");

        var convert = require("./modules/convert.js");

        var branch = "master";

        var git = require('git-rev');

        app.use(require("express").static('public'));

        app.get("/", function(req, res) {
            console.log("app.js      - " + "[Refresh - Food] A user connected".blue);
            fs.readFile("pages/index.html", "utf-8", function(err, data) {
                res.send(data);
            });
        });

        app.get("/privacy-policy", function(req, res) {
            console.log("app.js      - " + "[SubjectRefresh] A user requested the privacy policy".blue);
            fs.readFile("pages/privacy-policy.html", "utf-8", function(err, data) {
                res.send(data);
            });
        });

        io.on("connection", function(socket) {
            socket.on("getFoodSuggestions", function(packet) {
                convert.getNDB(packet.food, function(outputOne) {
                    io.sockets.connected[socket.id].emit("suggestions", { output: outputOne });
                });
            });

            socket.on("getFood", function(packet) {
                console.log("app.js      - " + "[Refresh - Food] A user requested statistics for ".blue + (packet).green);
                convert.getCalorie(packet.food, function(calorie) {
                    convert.energyBurnt(packet.age, packet.weight, "running", 60, packet.gender, function(runningSpeed) {
                        convert.energyBurnt(packet.age, packet.weight, "walking", 60, packet.gender, function(walkingSpeed) {
                            convert.energyBurnt(packet.age, packet.weight, "swimming", 60, packet.gender, function(swimmingSpeed) {
                                io.sockets.connected[socket.id].emit("receiveCalories", { running: calorie / runningSpeed, walking: calorie / walkingSpeed, swimming: calorie / swimmingSpeed });
                            });
                        });
                    });
                });
            });
        });

        app.post("/update-git", function(req, res){
            console.log("Reloading git repo");
            updateGit();
            res.send({message:"OK",code:200})
        });

        function run_cmd(cmd, args, cb, end) {
            var spawn = require('child_process').spawn,
                child = spawn(cmd, args),
                me = this;
            child.stdout.on('data', function (buffer) { cb(me, buffer) });
            child.stdout.on('end', end);
        }

        function gitFetch(callback){
            var git_fetch_output = new run_cmd(
                'git', ['fetch','--all'],
                function (me, buffer) { me.stdout += buffer.toString() },
                function(){
                    callback(git_fetch_output.stdout);
                }
            );
        }

        function gitReset(callback){
            var git_reset_output = new run_cmd(
                'git', ['reset','--hard','origin/'+branch],
                function (me, buffer) { me.stdout += buffer.toString() },
                function(){
                    callback(git_reset_output.stdout);
                }
            );
        }

        function updateGit(){
            gitFetch(function(output){
                console.log("app.js      - " + output.green);
                gitReset(function(output){
                    console.log("app.js      - " + output.green);
                });
            });
        }

        http.listen(3001, function() {
            console.log("app.js      - " + "[Refresh - Food] Running at ".green + "http://localhost:3001".blue);
        });
    } catch (e) {
        console.log("app.js      - " + "[Refresh] FATAL ERROR".red);
        console.log(e);
        heartbeat();
    }
}

heartbeat();