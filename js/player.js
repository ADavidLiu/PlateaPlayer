/*------------------------------------

Variables para el player

------------------------------------*/

var canvas,
    video,
    videoNativo,
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
    btnFilters,
    contentFilters,
    filtersOpened = false,
    sliderBlur,
    sliderGrayscale,
    sliderInvert,
    mensaje,
    btnFullscreen,
    btnNoFullscreen,
    label,
    menuIndex,
    btnIndex,
    contentIndex,
    indexOpened,
    indexLista,
    intervalos = [],
    timeouts = [];



/*------------------------------------

Variables para las interacciones

------------------------------------*/

var json,
    interactions;



/*------------------------------------

Lectura del JSON con las interacciones

------------------------------------*/

function preload() {
    // Se carga el video desde el sistema de archivos
    barraProgreso = select(".barra-progreso__progreso");
    video = createVideo("../videos/videoPrueba.mp4", function () {
        var src = video.elt.currentSrc;
        var titulo = src.substring(src.lastIndexOf("."), src.lastIndexOf("/") + 1);
        cambiarTitulo(titulo);
        duracion = video.duration();
        video.attribute("id", "video");
        videoNativo = document.getElementById("video");
        // Al terminar el video
        videoNativo.onended = function () {
            finalizarVideo();
        }
        // Se lee el JSON después de que se cargue el video
        var pathInicial = "../interactions/interacciones.json";
        cargarJSON(pathInicial);
    });
    video.parent("videoContainer");
}

function cargarJSON(path) {
    json = loadJSON(path, determinarInteracciones);
}



/*------------------------------------

Determinación de interacciones respectivas

------------------------------------*/

function determinarInteracciones() {
    if (json) {
        console.log("Determinar interacciones");
        interactions = json.interactions;
        // Se determina el tipo de interacción
        for (var i = 0; i < interactions.length; i++) {
            var interaccion = interactions[i];
            for (var j = 0; j < interaccion.type.data.shift.length; j++) {
                for (var k = 0; k < interaccion.type.data.shift[j].transform.length; k++) {
                    switch (interaccion.type.event) {
                    case "HOT_SPOT":
                        switch (interaccion.type.data.shift[j].type) {
                        case "ELLIPSE":
                        case "POLY":
                            crearGeometria(interaccion.type.data, interaccion.type.data.shift[j], interaccion.type.data.shift[j].transform[k], interaccion.isPaused);
                            break;
                        case "IMAGE":
                            crearImagen(interaccion.type.data, interaccion.type.data.shift[j], interaccion.type.data.shift[j].transform[k], interaccion.isPaused);
                            break;
                        case "TEXT":
                            crearTexto(interaccion.type.data, interaccion.type.data.shift[j], interaccion.type.data.shift[j].transform[k], interaccion.isPaused);
                            break;
                        case "WEB_CONTENT":
                            crearIframe(interaccion.type.data, interaccion.type.data.shift[j], interaccion.type.data.shift[j].transform[k], interaccion.isPaused);
                            break;
                        case "VIDEO":
                            crearVideo(interaccion.type.data, interaccion.type.data.shift[j], interaccion.type.data.shift[j].transform[k], interaccion.isPaused);
                            break;
                        }
                        break;
                    case "WEB_CONTENT":
                        crearIframe(interaccion.type.data, interaccion.type.data.shift[j], interaccion.type.data.shift[j].transform[k], interaccion.isPaused);
                        break;
                    case "INDEX":
                        crearIndex(interaccion.type.data, interaccion.type.data.shift[j], interaccion.type.data.shift[j].transform[k]);
                        break;
                    }
                }
            }
        }
    } else {
        alert("JSON no cargado");
    }
}


/*------------------------------------

Funciones para transformar las interacciones

------------------------------------*/

function crearGeometria(data, shift, transform, isPaused) {
    // Crea el elemento con un 'div' vacío
    var elem = createDiv("");
    elem.parent("videoContainer");
    // Añade los estilos necesarios
    if (shift.type === "ELLIPSE") {
        elem.addClass("interactive interactive__geometry interactive__geometry--ellipse");
    } else {
        elem.addClass("interactive interactive__geometry interactive__geometry--poly");
        var vertices = shift.geometry.vertices;
        formarPoligono(elem, vertices);
    }
    // Se dimensiona relativamente
    elem.style("width", shift.geometry.width + "%");
    elem.style("height", shift.geometry.height + "%");
    // Se manejan los tiempos de aparición
    mostrarElemento(elem, transform, isPaused);
    asignarAccion(elem, data);
}

function formarPoligono(elem, vertices) {
    var verticesFormatted = "";
    for (var i = 0; i < vertices.length; i++) {
        var coord = vertices[i].x + "%" + " " + vertices[i].y + "%, ";
        verticesFormatted += coord;
    }
    verticesFormatted = verticesFormatted.slice(0, -2);
    elem.style("clip-path", "polygon(" + verticesFormatted + ")");
}

function mostrarElemento(elem, transform, isPaused) {
    // Posiciona el elemento si no el elemento no es un index
    if (!hasClass(elem, "interactive__index-item")) {
        posicionarElemento(elem, transform.translate.y, transform.translate.x);
    }

    // Muestra el elemento
    var fin = transform.start_time + transform.duration;
    var intervalo = setInterval(function () {
        // Se agrega al array global
        intervalos.push(intervalo);
        if (video.time() >= transform.start_time && video.time() < fin) {
            // Si es un elemento index, muestra el botón
            if (hasClass(elem, "interactive__index-item")) {
                menuIndex.removeClass("menu__item--hidden");
            }
            // Sólo se ejecuta una vez
            if (!hasClass(elem, "interactive--visible")) {
                // Muestra el elemento
                elem.addClass("interactive--visible");
                // Pausa el video si así está configurada la interacción
                if (isPaused) {
                    pausarVideo();
                }
                // Si es un video, se reproduce
                if (hasClass(elem, "interactive__video")) {
                    elem.play();
                }
                // Aplica las transformaciones distintas a posición/traslación
                var transformacion = "";
                switch (transform.type) {
                case "ROTATE":
                    transformacion += "rotate(" + transform.rotate.deg + "deg) ";
                    elem.style("transform", transformacion);
                    break;
                case "SCALE":
                    transformacion += "scale(" + transform.scale.factor + ") ";
                    elem.style("transform", transformacion);
                    break;
                }
                // Se elimina después de cumplida su duración
                var timeout = setTimeout(function () {
                    // Se agrega al array global
                    timeouts.push(timeout);
                    // Elimina el elemento del DOM
                    elem.remove();
                    // Si pausó el video, lo reanuda
                    if (isPaused) {
                        reanudarVideo();
                    }
                    // Si el elemento es un video, lo detiene
                    if (hasClass(elem, "interactive__video")) {
                        elem.stop();
                    }
                    // Si es un index, oculta el padre si no quedan otros elementos
                    if (!checkIndexContent() && !hasClass(elem, "menu__item--hidden")) {
                        menuIndex.addClass("menu__item--hidden");
                    }
                    clearTimeout(timeout);
                    console.log("INTERACCIÓN TERMINADA");
                }, transform.duration * 1000); // Se convierte a segundos
            } else {
                clearInterval(intervalo);
            }
        }
    }, 1); // Cada milisegundo
}

function posicionarElemento(elem, y, x) {
    elem.style("top", y + "%");
    elem.style("left", x + "%");
}

function crearImagen(data, shift, transform, isPaused) {
    var img = createImg(shift.image.src, shift.image.alt);
    img.parent("videoContainer");
    img.addClass("interactive interactive__img");
    img.style("width", shift.image.width + "%");
    mostrarElemento(img, transform, isPaused);
    asignarAccion(img, data, transform);
}

function crearTexto(data, shift, transform, isPaused) {
    // Se crea el contenedor y se aplican los estilos propios
    var div = createDiv(shift.html);
    styleText(div, shift);
    div.parent("videoContainer");
    div.addClass("interactive interactive__text");
    mostrarElemento(div, transform, isPaused);
    asignarAccion(div, data, transform);
}

function crearIframe(data, shift, transform, isPaused) {
    // Se crea el iFrame
    var iframe = createElement("iframe", "");
    iframe.parent("videoContainer");
    iframe.attribute("src", shift.src);
    iframe.style("width", shift.width + "%");
    iframe.style("height", shift.height + "%");
    iframe.addClass("interactive interactive__iframe");
    mostrarElemento(iframe, transform, isPaused);
    asignarAccion(iframe, data, transform);
}

function crearVideo(data, shift, transform, isPaused) {
    var newVideo = createVideo(shift.src);
    newVideo.addClass("interactive interactive__video");
    newVideo.style("width", shift.width + "%");
    newVideo.style("height", shift.height + "%");
    mostrarElemento(newVideo, transform, isPaused);
    asignarAccion(newVideo, data, transform);
}

function crearIndex(data, shift, transform) {
    var label = shift.label;
    var item = createElement("li", label);
    styleText(item, shift);
    item.parent("indexLista");
    item.addClass("interactive interactive__index-item");
    mostrarElemento(item, transform, false);
    asignarAccion(item, data, transform);
}

function styleText(elem, shift) {
    elem.style("font-family", shift.font.family);
    elem.style("font-size", shift.font.size + "vw");
    elem.style("color", shift.font.color);
    elem.style("text-decoration", shift.font.decoration);
    elem.style("font-weight", shift.font.weight);
    elem.style("background-color", shift.font.backgroundColor);
    elem.style("line-height", shift.font.lineHeight + 0.5 + "vw");
    var padding = shift.font.padding[0] + "rem " + shift.font.padding[1] + "rem";
    elem.style("padding", padding);
}

function eliminarInteracciones() {
    var interacciones = selectAll(".interactive");
    if (interacciones != undefined || interacciones != null) {
        for (var i = 0; i < interacciones.length; i++) {
            interacciones[i].remove();
        }
    }
}

function reiniciarInteracciones() {
    eliminarInteracciones();
    determinarInteracciones();
}


/*------------------------------------

Funciones propias de "acción" para las interacciones

------------------------------------*/

function asignarAccion(elem, data, transform) {
    // Asigna los eventos de click a cada index item
    var accion = data.action;
    if (accion === "GOTO") {
        if (!hasClass(elem, "interactive__index-item")) {
            var target = data.target;
        } else {
            var target = transform.target;
        }
        bindClick(elem, target, accion);
    } else {
        bindClick(elem, null, accion);
    }
}

function bindClick(elem, target, accion) {
    elem.mouseClicked(function () {
        if (target) {
            if (typeof target === "string") {
                if (hasClass(elem, "interactive__index-item")) {
                    console.log("cambiarVideo()");
                    cambiarVideo(target);
                } else {
                    console.log("abrirURL()");
                    abrirURL(target);
                }
            } else {
                console.log("goto()");
                goto(target);
            }
        } else {
            // Lógica para acciones que no tengan "target"         
            switch (accion) {
            case "PLAY":
                reanudarVideo();
                break;
            case "PAUSE":
                pausarVideo();
                break;
            }
        }
        // Si después de seleccionar un item de la lista, debido al nuevo tiempo, ya no quedan elementos para mostrarse en ese momento, se elimina todo el index menu
        /*if (checkIndexContent()) {
            contentIndex.removeClass("menu__item-content--visible");
            menuIndex.addClass("menu__item--hidden");
            indexOpened = false;
        }*/
    });
}

function cambiarVideo(target) {
    video.src = target;
    video.time(0);
    eliminarInteracciones();
    menuIndex.removeClass("interactive__index--hidden");
    eliminarTimeEvents();
    video.play();
}

function abrirURL(target) {
    var tab = window.open(target, "_blank");
    if (tab) {
        tab.focus();
    } else {
        alert("Por favor active las ventanas emergentes");
    }
}

function goto(nuevoTiempo) {
    video.time(nuevoTiempo);
    reiniciarInteracciones();
}

function checkIndexContent() {
    if (indexLista.hasChildNodes()) {
        return true;
    } else {
        return false;
    }
}

function eliminarTimeEvents() {
    for (var i = 0; i < timeouts.length; i++) {
        clearTimeout(timeouts[i]);
    }
    for (var i = 0; i < intervalos.length; i++) {
        clearInterval(intervalos[i]);
    }
}


/*------------------------------------

Configuración inicial y event binding

------------------------------------*/

function setup() {
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

function cambiarTitulo(titulo) {
    label.html(titulo);
}



/*------------------------------------

Loop de ejecución

------------------------------------*/

function draw() {
    // Control de reproducción a través del mismo video
    if (!isReproduciendo) {
        canvas.mouseClicked(reanudarVideo);
    } else {
        canvas.mouseClicked(pausarVideo);
    }

    // Barra de progreso
    actualizarProgreso();

    // Reinicia las interacciones si está en loop
    if (isLooping && video.time() === 0) {
        reiniciarInteracciones();
    }
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
    if (video.time() === 0) {
        reiniciarInteracciones();
    }
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
        if (tiempo === duracion || tiempo === 0) {
            reanudarVideo();
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
    var nuevoTiempo = duracion * (barraProgresoContainer.value() / 100);
    video.time(nuevoTiempo);
    reiniciarInteracciones();
}

function actualizarProgreso() {
    tiempo = video.time();
    progreso = (100 / duracion) * tiempo;
    barraProgresoContainer.value(progreso);
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
        label.addClass("informacion__titulo--visible");
        // Oculta los controles después de 4 segundos si no se mueve el mouse
        var hideControls = setTimeout(function () {
            ocultarControles();
            clearTimeout(hideControls);
        }, 4000);
    }
}

function ocultarControles() {
    if (hasClass(controles, "video__controls--visible") && hasClass(menu, "menu--visible")) {
        controles.removeClass("video__controls--visible");
        menu.removeClass("menu--visible");
        label.removeClass("informacion__titulo--visible");
    }
}

function bindEvents() {
    // Pointer a los controles
    controles = select(".video__controls");
    menu = select(".menu");
    label = select(".informacion__titulo");

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


    /*barraProgresoContainer = select(".barra-progreso");
    barraProgresoContainer.mouseClicked(cambiarTiempo);*/

    barraProgresoContainer = select(".barra-progreso");
    barraProgresoContainer.input(cambiarTiempo);

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
    btnFilters = select(".menu__item-icon--filters");
    contentFilters = select(".menu__item-content--filters");

    btnFilters.mouseClicked(function () {
        if (!filtersOpened) {
            contentFilters.addClass("menu__item-content--visible");
            filtersOpened = true;
        } else {
            contentFilters.removeClass("menu__item-content--visible");
            filtersOpened = false;
        }
    });

    // Index del video
    btnIndex = select(".menu__item-icon--index");
    contentIndex = select(".menu__item-content--index");
    menuIndex = select(".menu__item--index");
    indexLista = document.getElementById("indexLista");

    btnIndex.mouseClicked(function () {
        if (!indexOpened) {
            contentIndex.addClass("menu__item-content--visible");
            indexOpened = true;
        } else {
            contentIndex.removeClass("menu__item-content--visible");
            indexOpened = false;
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

function keyReleased() {
    // Si se presiona spacebar
    if (keyCode == 32) {
        if (!isReproduciendo) {
            reanudarVideo();
            ocultarControles();
        } else {
            pausarVideo();
            mostrarControles();
        }
    }
    return false;
}

function finalizarVideo() {
    if (!isLooping) {
        detenerVideo();
    }
}