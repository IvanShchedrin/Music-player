var context, // web audio context
    source, // источник звука
    bufferGlobal, // глобальный буфер песни, для повторного воспроизведения (создается при загрузке песни)
    destination, // получатель звука
    sp, // визуализатор waveform
    timeFull = 0,
    isPaused = 0,
    canvas,
    $pausebtn,
    $resumebtn;

var startOffset = 0,
    startTime = 0;

// создаем context и фильтр
$(document).ready(function() {
	
	try {
		context = new (window.AudioContext || window.webkitAudioContext)();
	} catch(e) {
		alert("Web Audio API is not supported in this browser");
	}
    
    filterNode = context.createBiquadFilter();

	$pausebtn = $("#pause-button");
	$resumebtn = $("#resume-button");
});

function audioProcess (ape) {
	
	var time = 0;
    if(!isPaused){
        time = (context.currentTime - startTime + startOffset) * 1000;
        $("#timer").text(toTime(time % timeFull) + "/" + toTime(timeFull));
        $("#progress").css("width", (time * 100) / (timeFull) + "%");
    }

    if(time > timeFull){
        source.stop();
        isPaused = 1;
        startOffset = 0;
        $resumebtn.css('display', 'inline-block');
        $pausebtn.css('display', 'none');
    }

    // переменные для анализа сигнала
    var canvasHh = Math.floor( canvas.offsetHeight / 2 );
    var inputBuffer = ape.inputBuffer;
    var outputBuffer = ape.outputBuffer;
    var channel;
    var channelsLen = outputBuffer.numberOfChannels;
    var sample;
    var sampleLen = inputBuffer.length;
    
    // для визулизации создаем монобуфер
    var mono = new Array(sampleLen);
    for (sample = 0; sample < sampleLen; sample++) 
        mono[sample] = 0;

    for (channel = 0; channel < channelsLen; channel++) {  

        var inputData = inputBuffer.getChannelData(channel);

        // микшируем в монобуфер все каналы
        for (sample = 0; sample < sampleLen; sample++) 
            mono[sample] = (mono[sample] + inputData[sample]) / 2;
    }
    vizualize(mono, canvasHh);
}

function playSound(){
	$pausebtn.show(0);
    $resumebtn.hide(0);

    source = context.createBufferSource();
    source.buffer = bufferGlobal;
    // создаем получатель звука (колонки) и коннектим его к буферу-источнику
    destination = context.destination;
    source.connect(destination);
    // подключаем визуализатор
    source.connect(sp);
    sp.connect(context.destination);

    source.connect(filterNode);
    filterNode.connect(context.destination);

    startTime = context.currentTime;

    if(startOffset < 0){
        source.start(0, 1 % bufferGlobal.duration);
    } else{
        source.start(0, startOffset % bufferGlobal.duration);
    }

    isPaused = 0;
};

function stopSound(){
	$resumebtn.show(0);
    $pausebtn.hide(0);
    source.stop();
    isPaused = 1;
};

function playerOpening(){
	setTimeout(function() {
        $("#container").animate({"opacity" : "0"}, 1000); 
    }, 1000);
    setTimeout(function() {
        $("#container").css({"height" : "450px", "width" : "500px", "margin": "-225px 0 0 -250px"});
    }, 2100);
    setTimeout(function() {
        $("#container").animate({"opacity" : "1"}, 1000);
    }, 2200);
	$("#container").draggable();
};

function initCanvas(){
	// переменные для работы с визуализатором
    canvas = document.getElementById("visualizer");
    
    // настраиваем поле для визуализатора
    canvas.ctx = canvas.getContext( "2d" );
    canvas.ctx.strokeStyle = "#eee";
    canvas.ctx.lineWidth = 2;
    canvas.ctx.fillStyle = "rgba(0, 0, 0, 0)";
    canvas.ctx.fillRect( 0, 0, canvas.offsetWidth, canvas.offsetHeight );
};

// функция отрисовки линий waveform
function vizualize(sample, canvasHh) {
    canvas.ctx.clearRect( 0, 0, canvas.width, canvas.height);
    canvas.ctx.fillRect( 0, 0, canvas.width, canvas.height );
    canvas.ctx.beginPath();

    canvas.ctx.moveTo(-1, canvasHh);
    var y;

    for ( var x = 0; x < canvas.width; x++ ) {
        y = canvasHh - Math.floor( sample[x] * canvasHh );
        canvas.ctx.lineTo( x, y );
    }

    canvas.ctx.stroke();
};

function setEqualizer(setting) {
	for (var i = 0; i < 10; i++){
        equalizerNodes[i].gain.value = equalSets[setting][i];
        console.log(equalSets[setting][i]);
    }
    equalSets[0] = setting;
    console.log(equalSets[0][0]);
}

function toTime(ms){
    var date = new Date(null);
    date.setSeconds(ms/1000);
    return date.toISOString().substring(14, 19);
};

function updateMetaData(file) {
    ID3.loadTags(file.name, function () {
	    
	    var artistLink = "about:blank",
	    	coverLink = "https://music.yandex.ru/",
	    	title = "Unknown title",
    		artist = "Unknown artist";

        tags = ID3.getAllTags(file.name);
        title = tags.title || "Unknown title";

        if(tags.artist){
            artist = tags.artist;
            artistLink = "https://music.yandex.ru/search?text=" + tags.artist;
        };

        if(tags.album){
            coverLink = "https://music.yandex.ru/search?text=" + tags.album;
        };

        $("#title").text(title);
        $("#artist").text(artist);
        $("#artist-link").attr("href", artistLink)
        $("#cover-link").attr("href", coverLink)

        if ("picture" in tags) {
            var cover = tags.picture;
            var base64String = "";
            for (var i = 0; i < cover.data.length; i++) {
                base64String += String.fromCharCode(cover.data[i]);
            }
            $("#cover").hide();
            $("#cover").attr("src", "data:" + cover.format + ";base64," + window.btoa(base64String));
            $("#cover").fadeIn(1000);

        } else {
            $("#cover").hide();
            $("#cover").attr("src", "images/album.png");
            $("#cover").fadeIn(1000);
        }

    },
    {
        tags: ["artist", "title", "picture", "album"], dataReader: FileAPIReader(file)
    });
};

$(function(){

    $("#about").click(function() {
        var box = $("#about-box");
        box.toggle(300);
        setTimeout(function() {
            box.css({"top": "150px", "left": "125px"});
        }, 300);
        box.draggable();
    });

    $pausebtn.click(function(){
    	stopSound();
        startOffset += context.currentTime - startTime;
    });

    $resumebtn.click(function(){
        playSound();
    });

    $("#file").on("dragenter", function(){
        $("#move-here").animate({'background-color':'#333'},300);
    });

    $("#file").on("dragleave", function(){
        $("#move-here").animate({'background-color':'#ddd'},300);
    });

    $("#songJump").click(function(e){

    	stopSound();

        var posPescents =  (e.pageX - $(this).offset().left) / $(this).width();
        
        if(posPescents >= 1){
        	posPescents = 0;
        }

        startOffset = (timeFull / 1000) * posPescents;

        playSound();
    });

    $("#file").hover(function() {
        $("#move-here").animate({"background-color" : "#333"}, 300);
        $("#move-here span").animate({"color" : "#eee"}, 300);
    }, function() {
        $("#move-here").animate({"background-color" : "#ddd"}, 300);
        $("#move-here span").animate({"color" : "#333"}, 300);
    });

    $("#equalizer-btns #Pop").click(function(){
        $("#equalizer-btns button").css('background-color', 'rgba(229, 229, 229, .7)');
        $(this).css('background-color', '#aaa');

        filterNode.disconnect(destination);
        filterNode = null;
        filterNode = context.createBiquadFilter();

        filterNode.type = 4;
        filterNode.frequency.value = 320;
        filterNode.gain.value = 10;

        filterNode.type = 5;
        filterNode.frequency.value = 1700;
        filterNode.gain.value = -10;
        source.connect(filterNode);
        filterNode.connect(destination);
    });

    $("#equalizer-btns #Rock").click(function(){
        $("#equalizer-btns button").css('background-color', 'rgba(229, 229, 229, .7)');
        $(this).css('background-color', '#aaa');

        filterNode.disconnect(destination);
        filterNode = null;
        filterNode = context.createBiquadFilter();

        filterNode.type = 4;
        filterNode.frequency.value = 1500;
        filterNode.gain.value = -10;

        source.connect(filterNode);
        filterNode.connect(destination);
    });

    $("#equalizer-btns #Jazz").click(function(){
        $("#equalizer-btns button").css('background-color', 'rgba(229, 229, 229, .7)');
        $(this).css('background-color', '#aaa');

        filterNode.disconnect(destination);
        filterNode = null;
        filterNode = context.createBiquadFilter();

        filterNode.type = 4;
        filterNode.frequency.value = 250;
        filterNode.Q.value = 5;

        filterNode.type = 5;
        filterNode.frequency.value = 2000;
        filterNode.Q.value = 3;

        source.connect(filterNode);
        filterNode.connect(destination);
    });

    $("#equalizer-btns #Classic").click(function(){
        $("#equalizer-btns button").css('background-color', 'rgba(229, 229, 229, .7)');
        $(this).css('background-color', '#aaa');

        filterNode.disconnect(destination);
        filterNode = null;
        filterNode = context.createBiquadFilter();

        filterNode.type = "lowpass";
        filterNode.frequency.value = 0;
        filterNode.Q.value = 0;
        filterNode.gain.value = -1;

        source.connect(filterNode);
        filterNode.connect(destination);
    });

    $("#equalizer-btns #Normal").click(function(){
        $("#equalizer-btns button").css('background-color', 'rgba(229, 229, 229, .7)');
        $(this).css('background-color', '#aaa');

        filterNode.disconnect(destination);
        filterNode = null;
        filterNode = context.createBiquadFilter();

        filterNode.type = 1;
        filterNode.frequency.value = 0;
        filterNode.Q.value = 0;

        source.connect(filterNode);
        filterNode.connect(destination);
    });
});

$(window).load(function(){

	playerOpening();
	initCanvas();
    
    function playsound(raw) {
        context.decodeAudioData(raw, function (buffer) {

            // если получили пустой буфер, значит файл не прочитался - завершаем работу
            if (!buffer) {
                $("#name").text("Невозможно прочитать файл");
                return;
            }

            // останавливаем предыдущую песню
            if (source){
                source.stop(0);
            }

            // сбрасываем предыдущий визуализатор
            if (sp){
                sp.disconnect(destination);
                sp = null;
            }

            // сохраняем буфер в глобальный буфер
            bufferGlobal = buffer;
            timeFull = bufferGlobal.duration * 1000;
            startOffset = 0;

            $("#manualing").fadeIn(800);
            $("#loading").animate({'opacity':'0'},500);
            $("#wait-button").css('display', 'none');

			/*
            *	создание объекта ScriptProcessor
            *	аргументы: длина буфера, количество входящих каналов, количество исходящих каналов
            *	чем больше буфер - тем меньшее число раз будет вызыван код обработки,
            *	должен быть кратен степени двойки
            */
            sp = context.createScriptProcessor ? context.createScriptProcessor( 512, 2, 2 ) : context.createJavaScriptNode( 512, 2, 2 );
            sp.onaudioprocess = audioProcess;

            playSound();

        }, function (error) {
            console.error("failed to decode:", error);
        });
    }

    // функция обработки события изменения файла в input`е
    function onfilechange(then, evt) {

        var files = evt.target.files;

        if(files[0]){

            $("#loading").animate({'opacity':'1'},500);
            var selFile = files[0];
            var reader = new FileReader();
            
            // выводим имя файла в текстовое поле
            $("#name").text(selFile.name);

            // функция обработки события загрузки файла
            reader.onload = function (e) {
                updateMetaData(selFile);
                then(e.target.result);
            };

            reader.onerror = function (e) {
                console.error(e);
            };

            reader.readAsArrayBuffer(selFile);
        }
    };

    document.getElementById('file').addEventListener('change', onfilechange.bind(null, playsound), false);
});