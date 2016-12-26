/*------------------------------------

Variables para el player

------------------------------------*/

var canvas,
    video,
    controles,
    velocidadActual = 1,
    isReproduciendo = true,
    sliderVolume,
    sliderVolumeContainer,
    barraProgreso,
    barraProgresoContainer,
    tiempo,
    duracion,
    progreso,
    anchoContenedor,
    btnStop,
    btnPlay,
    btnPause,
    btnSlower,
    btnFaster,
    isLooping = false,
    btnVolumeUp,
    btnVolumeOff,
    btnVolumeDown,
    btnVolumen,
    isMuted,
    volumenActual = 0.5,
    volumenAnterior = 0.5,
    menu,
    filtersOpened = false,
    sliderBlur,
    sliderGrayscale,
    sliderInvert,
    mensaje,
    btnFullscreen,
    btnNoFullscreen;



/*------------------------------------

Variables para las interacciones

------------------------------------*/

var json = {},
    interactions = {};



/*------------------------------------

Lectura del JSON con las interacciones

------------------------------------*/

function preload() {
    var path = "../interactions/hotspot_test.json";
    json = loadJSON(path, determinarInteracciones);
}



/*------------------------------------

Determinación de interacciones respectivas

------------------------------------*/

function determinarInteracciones() {
    console.log(json);
    interactions = json.interactions;
    for (var i = 0; i < interactions.length; i++) {
        // Se determina el tipo de interacción
        var interaccion = interactions[i];
        switch (interaccion.type.event) {
            case "HOT_SPOT":
                for (var j = 0; j < interaccion.type.data.shift.length; j++) {
                    if (interaccion.type.data.shift[j].type === "ELLIPSE") {
                        isEllipse(interaccion.type.data.shift[j], interaccion.type.data.transform[j]);
                    } else {
                        isPolygon(interaccion.type.data.shift[j], interaccion.type.data.transform[j]);
                    }
                }
                break;
            // AQUÍ IRÍAN LOS CASOS DE LOS OTROS TIPOS DE INTERACCIÓN
        }
    }
}



/*------------------------------------

Control de ejecución de las interacciones

------------------------------------*/

function isEllipse(shift, transform) {
    console.log("Is ellipse");
    console.log(shift);
    console.log(transform);
}

function isPolygon(shift, transform) {
    console.log("Is polygon");
    console.log(shift);
    console.log(transform);
}



/*------------------------------------

Funciones para transformar las interacciones

------------------------------------*/

function trasladar(coordOld, coordNew) {
    console.log("Trasladado a las coordenadas " + "(" + coordNew.x + "," + coordNew.y + ")");
}



/*------------------------------------

Configuración inicial y event binding

------------------------------------*/

function setup() {
    // Se carga el video desde el sistema de archivos
    barraProgreso = select(".barra-progreso__progreso");
    video = createVideo("../videos/videoPrueba.mp4", function () {
        duracion = video.duration();
    });
    video.parent("videoContainer");

    // Se crea el canvas del tamaño del video
    var alto = select("video").height;
    var ancho = select("video").width;
    canvas = createCanvas(ancho, alto);
    canvas.parent("videoContainer");

    // Se inicia el video
    video.play();

    // Event binding
    bindEvents();

}



/*------------------------------------

Loop de ejecución

------------------------------------*/

function draw() {
    // Control a través del mismo video
    if (!isReproduciendo) {
        canvas.mouseClicked(reanudarVideo);
    } else {
        canvas.mouseClicked(pausarVideo);
    }

    // Barra de progreso
    tiempo = video.time();
    progreso = (100 / duracion) * tiempo + "%";
    barraProgreso.style("width", progreso);
}



/*------------------------------------

Se ejecuta cuando la ventana sea redimensionada

------------------------------------*/

function windowResized() {
    // Escala el canvas al tamaño del video cuando la ventana cambie de tamaño
    escalarCanvas();
}



/*------------------------------------

Funciones para controlar el player

------------------------------------*/

function cambiarFiltros() {
    var blur = "blur(" + sliderBlur.value() + "px)";
    var grayscale = "grayscale(" + sliderGrayscale.value() + "%)";
    var sepia = "sepia(" + sliderSepia.value() + "%)";
    var invert = "invert(" + sliderInvert.value() + "%)";
    var filtros = blur + " " + grayscale + " " + sepia + " " + invert;
    //console.log(filtros);
    video.style("filter", filtros);
}

function escalarCanvas() {
    var alto = select("video").height;
    var ancho = select("video").width;
    resizeCanvas(ancho, alto);
}

function detenerVideo() {
    video.stop();
    isReproduciendo = false;
    cambiarIconos(btnPlay, btnPause);
}

function reanudarVideo() {
    video.play();
    isReproduciendo = true;
    cambiarIconos(btnPause, btnPlay);
}

function pausarVideo() {
    video.pause();
    isReproduciendo = false;
    cambiarIconos(btnPlay, btnPause);
}

function silenciarVideo() {
    if (!isMuted) {
        volumenAnterior = video.volume();
        video.volume(0);
        volumenActual = 0;
        sliderVolume.value(0);
        cambiarIconos(btnVolumeOff, btnVolumeUp);
        cambiarIconos(btnVolumeOff, btnVolumeDown);
        isMuted = true;
    } else {
        video.volume(volumenAnterior);
        volumenActual = volumenAnterior;
        sliderVolume.value(volumenAnterior);
        cambiarVolumen();
        isMuted = false;
    }
    //console.log(volumenActual);
}

function iniciarLoop() {
    if (!isLooping) {
        video.attribute("loop", true);
        btnLoop.addClass("active");
        isLooping = true;
        // Si se activa cuando ya haya acabado el video
        if (tiempo === duracion) {
            video.play();
        }
    } else {
        video.removeAttribute("loop");
        btnLoop.removeClass("active");
        isLooping = false;
    }
}

function mostrarMensaje(texto) {
    var nuevoMensaje = createP(texto.toString() + "x");
    nuevoMensaje.parent("mensajeContainer");
    nuevoMensaje.addClass("mensaje__texto");
    mensaje.addClass("mensaje--visible");
    setTimeout(function () {
        mensaje.removeClass("mensaje--visible");
        nuevoMensaje.remove();
    }, 500);
}

function disminuirVelocidad() {
    if (video.speed() > 0) {
        video.speed(velocidadActual -= 0.5);
    } else {
        alert("Mínima velocidad alcanzada");
    }
    mostrarMensaje(video.speed());
    console.log("Nueva velocidadActual = " + velocidadActual);
}

function aumentarVelocidad() {
    video.speed(velocidadActual += 0.5);
    mostrarMensaje(video.speed());
    console.log("Nueva velocidadActual = " + velocidadActual);
}

function cambiarVolumen() {
    volumenAnterior = video.volume();
    volumenActual = sliderVolume.value();
    video.volume(volumenActual);
    if (video.volume() >= 0.5) {
        cambiarIconos(btnVolumeUp, btnVolumeOff);
        cambiarIconos(btnVolumeUp, btnVolumeDown);
    }
    if (video.volume() < 0.5 && video.volume() > 0) {
        cambiarIconos(btnVolumeDown, btnVolumeUp);
        cambiarIconos(btnVolumeDown, btnVolumeOff);
    }
    if (video.volume() === 0) {
        cambiarIconos(btnVolumeOff, btnVolumeUp);
        cambiarIconos(btnVolumeOff, btnVolumeDown);
    }
    //console.log(volumenActual);
}

function cambiarTiempo() {
    console.log("Mouse X: " + mouseX);
    //var nuevoTiempo = (100/duracion) * (mouseX/duracion);
    console.log(duracion);
    var anchoTotal = barraProgresoContainer.style("width").split("px")[0];
    var anchoProgreso = barraProgreso.style("width").split("px")[0] / duracion;
    console.log("Ancho total: " + anchoTotal);
    console.log("Ancho progreso: " + anchoProgreso);
    var nuevoTiempo = duracion * (mouseX / 100);
    console.log("Nuevo tiempo: " + nuevoTiempo);
    video.time(nuevoTiempo);
    nuevoTiempo = 0;
}

function cambiarIconos(elem1, elem2) {
    if (hasClass(elem1, "hidden")) {
        elem1.removeClass("hidden");
    }
    if (!hasClass(elem2, "hidden")) {
        elem2.addClass("hidden");
    }
}

function hasClass(elemento, claseAcheckear) {
    var chars = elemento.class();
    for (var i = 0; i < chars.length; i++) {
        var clasesCompletas = chars.concat();
        var clases = chars.split(" ");
        if (clases[i] === claseAcheckear) {
            return true;
        }
    }
    return false;
}

function mostrarControles() {
    if (!hasClass(controles, "video__controls--visible") && !hasClass(menu, "menu--visible")) {
        controles.addClass("video__controls--visible");
        menu.addClass("menu--visible");
        // Oculta los controles después de 4 segundos si no se mueve el mouse
        setTimeout(ocultarControles, 4000);
    }
}

function ocultarControles() {
    if (hasClass(controles, "video__controls--visible") && hasClass(menu, "menu--visible")) {
        controles.removeClass("video__controls--visible");
        menu.removeClass("menu--visible");
    }
}

function bindEvents() {
    // Pointer a los controles
    controles = select(".video__controls");
    menu = select(".menu");

    // Controles de playback
    btnStop = select(".video__control--stop");
    btnStop.mouseClicked(detenerVideo);

    btnPlay = select(".video__control--play");
    btnPlay.mouseClicked(reanudarVideo);

    btnPause = select(".video__control--pause");
    btnPause.mouseClicked(pausarVideo);

    btnSlower = select(".video__control--slower");
    btnSlower.mouseClicked(disminuirVelocidad);

    btnFaster = select(".video__control--faster");
    btnFaster.mouseClicked(aumentarVelocidad);

    btnLoop = select(".video__control--loop");
    btnLoop.mouseClicked(iniciarLoop);


    barraProgresoContainer = select(".barra-progreso");
    barraProgresoContainer.mouseClicked(cambiarTiempo);


    // Controles de volumen
    sliderVolume = select(".video__control--volume");
    sliderVolume.changed(cambiarVolumen);
    sliderVolume.input(cambiarVolumen);

    btnVolumeUp = select(".fa-volume-up");
    btnVolumeOff = select(".fa-volume-off");
    btnVolumeDown = select(".fa-volume-down");

    // Silenciar el video
    btnVolumeUp.mouseClicked(silenciarVideo);
    btnVolumeDown.mouseClicked(silenciarVideo);
    btnVolumeOff.mouseClicked(silenciarVideo);

    // Fullscreen
    btnFullscreen = select(".fa-expand");
    btnNoFullscreen = select(".fa-compress");

    btnFullscreen.mouseClicked(function () {
        fullscreen(1);
        cambiarIconos(btnNoFullscreen, btnFullscreen);
    });

    btnNoFullscreen.mouseClicked(function () {
        fullscreen(0);
        cambiarIconos(btnFullscreen, btnNoFullscreen);
    });

    // Controles del menú
    var btnFilters = select(".menu__item-icon--filters");
    var contentFilters = select(".menu__item-content--filters");

    btnFilters.mouseClicked(function () {
        if (!filtersOpened) {
            contentFilters.addClass("menu__item-content--visible");
            filtersOpened = true;
        } else {
            contentFilters.removeClass("menu__item-content--visible");
            filtersOpened = false;
        }
    });

    // Filtros
    sliderBlur = select(".filters__slider--blur");
    sliderBlur.input(cambiarFiltros);
    sliderBlur.changed(cambiarFiltros);

    sliderGrayscale = select(".filters__slider--grayscale");
    sliderGrayscale.input(cambiarFiltros);
    sliderGrayscale.changed(cambiarFiltros);

    sliderSepia = select(".filters__slider--sepia");
    sliderSepia.input(cambiarFiltros);
    sliderSepia.changed(cambiarFiltros);

    sliderInvert = select(".filters__slider--invert");
    sliderInvert.input(cambiarFiltros);
    sliderInvert.changed(cambiarFiltros);

    // Mensaje central
    mensaje = select(".mensaje");

    // Mostrar controles on-hover
    canvas.mouseOver(mostrarControles);
    canvas.mouseOut(ocultarControles);
    canvas.mouseMoved(mostrarControles);
    video.mouseOver(mostrarControles);
    video.mouseOut(ocultarControles);
    video.mouseMoved(mostrarControles);
    controles.mouseOver(mostrarControles);
    controles.mouseOut(ocultarControles);
    controles.mouseMoved(mostrarControles);
    menu.mouseOver(mostrarControles);
    menu.mouseOut(ocultarControles);
    menu.mouseMoved(mostrarControles);
}