/*------------------------------------

    Servidor y comunicación player-servidor

------------------------------------*/

var express = require("express");
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var five = require("johnny-five");

server.listen(3000);



/*------------------------------------

    Funciones para cada acción

------------------------------------*/

function encenderLED() {

}



/*------------------------------------

    Configuración de Johnny Five

------------------------------------*/

var board = new five.Board();

var interacciones = [];

board.on("ready", function() {

    /*------------------------------------

    Conexión con el Player

    ------------------------------------*/

    io.on("connect", function (socket) {
        console.log("PlateaPlayer conectado!");
        socket.on("sense", function (datos) {
            var string = JSON.stringify(datos);
            var sense = JSON.parse(string);
            interacciones.push(sense);
        });
    });



    /*------------------------------------

    Ejecución de acciones

    ------------------------------------*/





});