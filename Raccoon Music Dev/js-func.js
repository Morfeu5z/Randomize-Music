/** Electron imports **/
const electron = require('electron');
const { remote, ipcRenderer } = require('electron');
const popmotion = require('popmotion');
const fs = require('fs');
const ytdl = require('ytdl-core');
const os = require('os'); 

/** FM Comtrollers **/
const ulList = document.querySelector('#file-list ul');
const ulDisk = document.querySelector('#app-disk ul');
const diskRefresh = document.querySelector('#disks-refresh');

var clickedMenuBox = false; //left slider
var doAnimation = false; // left slider animation
var pathTable = []; // Starter path on windows
var path = '';
var loadpicPath = __dirname;
var ffmpegPath = '';
var loadpicTable = [];

/** YTD controllers **/
var newTitle = '';
var downloadBtnName = 'Pobierz MP3';
var downloadAudio = true;
var videoID;
var activeYTDL = false;
var RadioBtnStop = true;
var downloadActive = false;
var downloadSuccess = false;


/** -----------------------External source---------------------- **/
var loadpicPathTable = loadpicPath.split('\\');
// console.log(loadpicPathTable);
loadpicPath = '';
for(var j = 0; j < loadpicPathTable.length - 2; j++){
    loadpicPath = loadpicPath + loadpicPathTable[j] + '\\';
}
ffmpegPath = loadpicPath + 'adds\\ffmpeg.exe';
loadpicPath = loadpicPath + 'adds\\loadpic';
// console.log(loadpicPath);

/** -----------------------Pic Load Table---------------------- **/
if(!fs.existsSync(loadpicPath)){
    var loadpicPath = __dirname + '\\assets\\loadpic';
}
fs.readdirSync(loadpicPath).forEach(load => {
    try {
        if(load.slice(0,9) === 'ytdl_load' 
        || load.slice(-3,load.length) === '.gif'
        || load.slice(-3,load.length) === '.png'
        || load.slice(-3,load.length) === '.jpg'
        || load.slice(-4,load.length) === '.jpeg'
        || load.slice(-3,load.length) === '.svg'){
            loadpicTable.push(load);
        }
    } catch (error) {
        //        
    }
});

// console.log(loadpicTable);

/** -----------------------App----------------------- **/
function closeApp() {
    if(downloadActive){
        if (!confirm("Trwa pobieranie z YouTube, napewno chcesz zamknąć program?")) {
            return 0;
        }
    }
    remote.app.quit();
}
function minmax() {
    const currentWindow = remote.getCurrentWindow();
    if (currentWindow.isMaximized()) {
        currentWindow.unmaximize();
    } else {
        currentWindow.maximize();
    }
}
function hiddeWindow() {
    remote.getCurrentWindow().minimize();
}



/** -----------------------File Manager---------------------- **/
/** Create list of disks 
 *  FIXME: For now, only windows disk scaner
*/
function getDiskList() {
    ulDisk.innerHTML = '';
    var DiscTable = [];
    for(var i = 65; i < 91; i++){
        var tmpPath = String.fromCharCode(i) + ':\\';
        try {
            if(fs.readdirSync(tmpPath) != null){
                
                DiscTable.push(String.fromCharCode(i));
                var newDisk = document.createElement('li');
                var newLabel = document.createTextNode(tmpPath);
                newDisk.appendChild(newLabel);
                ulDisk.appendChild(newDisk);
                
                // console.log('Disk: ' + tmpPath);
            }   
        } catch (error) {
            //            
        }
    }
    // console.log('Disks: ' + DiscTable);
    pathTable = [];
    pathTable.push(DiscTable[0] + ':\\');
    path = pathbuilder('current');
    getDir(path);
}

/** Path maker
 * @param {*} mode 
 */
function pathbuilder(mode) {
    var first = true;
    switch (mode) {
        case 'current':
            var compleate = '';
            pathTable.forEach(element => {
                (!first) ? compleate += element + '\\' : compleate += element;
                first = false;
            });
            return compleate;
            break;
        case 'back':
            if (pathTable.length > 1) pathTable.pop();
            var compleate = '';
            pathTable.forEach(element => {
                (!first) ? compleate += element + '\\' : compleate += element;
                first = false;
            });
            return compleate;
            break;
        case 'home':
            var tmp = pathTable[0];
            pathTable = [];
            pathTable.push(tmp);
            var compleate = pathTable[0];
            return compleate;
            break;
    }
}

/** Create list of dirs and files
 * @param {*} path 
 */
function getDir(path) {
    files = fs.readdirSync(path);
    ulList.innerHTML = '';
    // console.log(files);
    files.forEach(element => {
        //console.log(element.slice(-4, -1));
        if (element[0] != "$" 
            && element.slice(-4, -1) != ".sy" 
            && element.slice(-4, -1) != ".Ms" 
            && element != 'System Volume Information') {
                newli = document.createElement('li'); // new li element
                newtxt = document.createTextNode(element); // add file or dir name
                newli.appendChild(newtxt);
                ulList.appendChild(newli); // add to ul
        }
    });
    // console.log(newlist);
    document.querySelector('#current-path').innerHTML = path;
}



/** -----------------------Randomize Tools---------------------- **/
/** Randomize files with prefix */
function randomize() {
    if(!downloadActive){
        // console.log(path);
        if (!confirm("Are you sure you want to randomize this directory: " + path + "?")) return 0;
        reRandomize(false);
        var wasRandom = false;
        var list = fs.readdirSync(path);
        var miss = 0;
        var prefix = 0;
        var ll = list.length;
        for (var i = 0; i < ll; i++) {
            // console.log(list);
            var x = 0;
            x = Math.floor(Math.random() * (list.length - 1));
            // console.log(x);
            prefix++;
            if (fs.lstatSync(path + list[x]).isDirectory()) {
                //Do nothing
                miss++;
            } else {
                fs.renameSync(path + list[x], path + prefix + "_-_" + list[x]);
                wasRandom = true;
            }
            list.splice(x, 1);
        }
        getDir(path);
        if (wasRandom) {
            addInfoSlide('Randomize Complete.');
            addInfoSlide('Miss directory: ' + miss);
        } else {
            addInfoSlide('Nothing to randomize.');
        }
    }
}

/** reRandomize files
 * @param {*} setInfo 
 */
function reRandomize(setInfo = true) {
    if(!downloadActive){
        if (setInfo) if (!confirm("Are you sure you want to re-randomize this directory: " + path + "?")) return 0;;
        // console.log(path);
        var list = fs.readdirSync(path);
        var prefix = 0;
        var wasRandom = false;
        list.forEach(item => {
            var ext = item.split('.');
            ext = ext[ext.length - 1];
            var end = item.length - ext.length;

            for (var i = 0; i < end; i++) {
                var old_prefix = item.slice(i, i + 2);
                var prefix = item.slice(i, i + 3);
                if (prefix == "_-_") {
                    try {
                        wasRandom = true;
                        fs.renameSync(path + item, path + item.slice(i + 3, item.length));
                        i = end;
                    } catch (error) {
                        addInfoSlide('Error! File: \"' + item + '\" is used by another program.', 'error', 10000);
                    }
                } else if (old_prefix == '. ') {
                    try {
                        wasRandom = true;
                        fs.renameSync(path + item, path + item.slice(i + 2, item.length));
                        i = end;
                    } catch (error) {
                        addInfoSlide('Error! File: \"' + item + '\" is used by another program.', 'error', 10000);
                    }
                }
            }
        });
        getDir(path);
        if (setInfo) if (wasRandom) {
            addInfoSlide('Re-Randomize Complete.');
        } else {
            addInfoSlide('Nothing to Re-Randomize.');
        };
    }
}



/** -----------------------YTDL---------------------- **/
function yt_downloader_show() {
    document.querySelector('#ytdl-container').classList.add('ytdl-container-active');
}

function yt_downloader_hide() {
    document.querySelector('#ytdl-container').classList.remove('ytdl-container-active');
    if (downloadActive) addInfoSlide('Pobieranie w tle.', '', 10000);
}

/** Check title when user modify it
 * @param {*} name 
 */
function ytdl_nameChange(name){
    newTitle = titleStandarization(name);
    console.log(newTitle);
    if(newTitle === ''){
        ytd_panel_mode('reset', false);
    }
    else
    {
        ytd_panel_mode('mp3mp4');
    }
}

/** check the correctness of url and title
 * @param {link} url 
 */
function ytdl_linkCheck(url) {
    if (downloadActive == false) {
        try {
            videoID = ytdl(url);
            ytdl.getInfo(ytdl.getURLVideoID(url), (err, info) => {
                if (err) throw err;
                console.log(info);
                newTitle = titleStandarization(info.title);
                ytd_panel_mode('linkAccept');
                var los = Math.floor(Math.random() * loadpicTable.length);
                // console.log(loadpicPath + loadpicTable[los]);
                document.querySelector('#downloadPic').src = loadpicPath + '\\' + loadpicTable[los];
            });
        } catch (error) {
            ytd_panel_mode('linkError');
        }
    }
}

/** Audio/Video radio btn chooser
 * @param {*} format 
 */
function setYTD_Radio(format){
    // console.log(format);
    if(RadioBtnStop === false){
        switch(format){
            case 'mp3':
                downloadBtnName = 'Pobierz MP3';
                downloadAudio = true;
                ytd_panel_mode('mp3mp4');
                break;
                
                case 'mp4':
                downloadBtnName = 'Pobierz MP4';
                downloadAudio = false;
                ytd_panel_mode('mp3mp4');
                break;
        }
    }
}



/** Active or deactive radio buttons
 * mode: active, deactive
 * @param {*} mode 
 */
function radioBtnMode(mode){
    var YTD_radio = document.getElementsByName('ytd_radio');
    switch (mode) {
        case 'active':
                YTD_radio.forEach(radio => {
                    radio.disabled = false;
                });   
                break;
                case 'deactive':
                YTD_radio.forEach(radio => {
                    radio.disabled = true;
            });   
        break;

    }    
}


/** Radio btn block */
RadioBtnStop = true;
radioBtnMode('deactive');

/** Download Audio or Video
 * FIXME: It's definitly not best video quality, for that I need converting with ffmpeg used
 * @param {*} url 
 */
function yt_downloader_btn(url) {
    if(downloadAudio){
        /** best audio? */
        // videoID = ytdl(url, {filter: (format) => format.itag === '140'});
        // videoID = ytdl(url, { quality: 'highest'});
        videoID = ytdl(url, {filter: (format) => format.container === 'mp4'});
        yt_downloader(url, 'mp3');
    }else{
        // videoID = ytdl(url, { filter: 'audioandvideo', quality: 'highest' });
        videoID = ytdl(url, {filter: (format) => format.container === 'mp4'});
        yt_downloader(url, 'mp4');
    }
}

/** YouTube Downloader Script
 * @param {*} url 
 */
function yt_downloader(url, ext='') {
    if (activeYTDL && downloadActive == false) {
        if (path == "C:\\") {
            addInfoSlide("Na dysku C:\\ należy wskazać folder docelowy!", 'error', 10000);
        } else {
            // Blocking script if downloading is active
            activeYTDL = false;
            // Radio btn block
            RadioBtnStop = true;
            radioBtnMode('deactive');
            newTitle = titleStandarization(newTitle);
            var filePointer = path + newTitle + '.mp4';
            
            ytdl.getInfo(ytdl.getURLVideoID(url), (err, info) => {
                if (err) throw err;
                /** TODO: Set Start and End point of music (cut) */
                // console.log("Path: " + filePointer);
                videoID.pipe(fs.createWriteStream(filePointer));
            
                ytd_panel_mode('start');
            });
            var ile = 0;
            videoID.on("progress", () => {
                console.log("Progress...");
                document.querySelector('#downloadButton h3').textContent = "Pobieranie: " + ile++;
            })
            
            videoID.on("end", () => {
                console.log("Download complete!");
                if(ext === 'mp3'){
                    try {
                        var ffmpeg = require('fluent-ffmpeg');
                        var proc = new ffmpeg({ source: filePointer, nolog: true })
                        if(os.platform() === 'win32'){
                            proc.setFfmpegPath(ffmpegPath);
                        }else{
                            return 0;// change it for linux
                        }
                        
                        proc.toFormat(ext);
                        
                        proc.on('start', function() {
                            addInfoSlide("Rozpoczynam konwertowanie do "+ext);
                            console.log('Start converting.');
                        });
                        
                        var ile = 0;
                        proc.on('progress', function() {
                            console.log("Converting progress...");
                            document.querySelector('#downloadButton h3').textContent = "Konvertowanie: " + ile++;
                        });
                        
                        proc.on('end', function() {
                            ytd_panel_mode('success');
                            console.log('File has been converted successfully');
                            addInfoSlide("Konwertowanie do "+ext+" zakończone.");
                            fs.unlinkSync(filePointer);
                        });
                        
                        proc.on('error', function(err) {
                            console.log('An error happened: ' + err.message);
                            addInfoSlide("Blad podczas konwertowania!", 'error');
                            ytd_panel_mode('success');
                        });
                        
                        
                        // save to file <-- the new file I want -->
                        var newfilePointer = filePointer.slice(0, -3);
                        proc.saveToFile(newfilePointer + ext);
                        
                    } catch (e) {
                        console.log("Converting error");
                        addInfoSlide("Blad podczas konwertowania!", 'error');
                        ytd_panel_mode('success');
                    }
                }else{
                    ytd_panel_mode('success');
                }
            })
        }
    } else if (downloadSuccess) ytd_panel_mode('reset');
}

/** Function return file name without problematic symbols
 * @param {string} title 
 */
function titleStandarization(title = 'tmp') {
    var omv = ['Official', 'official'];
    var sliceEnd = title.length;
    if (title.length > 60) sliceEnd = 60;
    title = title.slice(0, sliceEnd);

    for (var i = 0; i < title.length; i++) {
        var error = 0;
        //console.log(title.slice(i, i+9));
        if (title.slice(i, i + 8) == omv[0] || title.slice(i, i + 8) == omv[1]) {
            if (title[i - 2] != ' ') {
                title = title.slice(0, i - 1);
            } else {
                title = title.slice(0, i - 2);
            }
        } else {
            switch (title[i]) {
                case '\\':
                    error++;
                    break;
                case '/':
                    error++;
                    break;
                    break;
                case ':':
                    error++;
                    break;
                    break;
                case '*':
                    error++;
                    break;
                    break;
                case '?':
                    error++;
                    break;
                    break;
                case '"':
                    error++;
                    break;
                    break;
                case '<':
                    error++;
                    break;
                    break;
                case '>':
                    error++;
                    break;
                    break;
                case '|':
                    error++;
                    break;
                default:
                    error = 0;
            }
            if (error > 0) title = title.slice(0, i) + title.slice(i + 1, title.length);
        }
    }
    return title;
}

/** Change visual design using info about ytd status
 * mode: 'success', 'start', 'reset'
 * @param {ytd panel mode} mode 
 */
function ytd_panel_mode(mode, message = true) {
    switch (mode) {
        case 'mp3mp4':
            if(downloadSuccess){
                document.querySelector('#downloadButton').classList.remove("successBtn");
                downloadSuccess = false;
            }
            if(activeYTDL)document.querySelector('#downloadButton h3').textContent = downloadBtnName;
            document.querySelector('#ytdl_title').disabled = false;
            ytd_panel_mode('linkAccept');
            break;

        case 'reset':
            document.querySelector('#url').value = '';
            document.querySelector('#downloadButton').classList.remove("activeBtn");
            document.querySelector('#downloadButton').classList.remove("successBtn");
            document.querySelector('#downloadButton h3').textContent = "Wprowadź link";
            document.querySelector('#ytdl_title').value = '';
            document.querySelector('#url').disabled = false;
            document.querySelector('#ytdl_title').disabled = false;
            // Radio btn block
            RadioBtnStop = true;
            radioBtnMode('deactive');
            newTitle = '';
            getDir(path);
            break;
            
        case 'success':
            console.log("Download Complete");
            if(message) addInfoSlide("Pobieranie zakończone");
            document.querySelector('#downloadButton h3').textContent = "Clear!";
            document.querySelector('#downloadButton').classList.remove("activeBtn");
            document.querySelector('#downloadButton').classList.add("successBtn");
            document.querySelector('#downloadPic').classList.remove("downloadPicActive");
            downloadActive = false;
            downloadSuccess = true;
            // Radio btn noblock
            RadioBtnStop = false;
            radioBtnMode('active');
            getDir(path);
            break;
            
        case 'start':
            console.log("Pobieranie!");
            if(message) addInfoSlide("Rozpoczynam pobieranie");
            document.querySelector('#downloadPic').classList.add("downloadPicActive");
            downloadActive = true;
            radioBtnMode('deactive');
            document.querySelector('#ytdl_title').disabled = true;
            document.querySelector('#url').disabled = true;
            getDir(path);
            // Radio btn block
            RadioBtnStop = true;
            radioBtnMode('deactive');
            break;

        case 'linkError':
            console.log("Link error.");
            if(message) addInfoSlide("Nieprawidowy link!", 'error');
            document.querySelector('#downloadButton').classList.remove("activeBtn");
            document.querySelector('#downloadButton h3').textContent = "Wprowadź link";
            document.querySelector('#ytdl_title').textContent = "Nieprawidowy link!";
           
            // Radio btn block
            RadioBtnStop = true;
            radioBtnMode('deactive');
            break;

        case 'linkAccept':
            document.querySelector('#ytdl_title').value = newTitle;
            document.querySelector('#downloadButton').classList.add("activeBtn");
            document.querySelector('#downloadButton h3').textContent = downloadBtnName;
            if(message) addInfoSlide("Gotowe do pobrania.");
            activeYTDL = true;
            // Radio btn block
            RadioBtnStop = false;
            radioBtnMode('active');
            break;
    }
}



/** -----------------------File delete---------------------- **/
/** Delete file global path*/
var toDelete;

/** Delete global path builder
 * @param {*} ev 
 */
function setTriggerToDelete(ev) {
    toDelete = path + ev;
}

/** Delete file or directory */
function deleteFile() {
    console.log("File to delete: " + toDelete);
    try {
        if (fs.lstatSync(toDelete).isDirectory()) {
            if (!confirm("Napewno chcesz usunąć folder: \"" + toDelete + "\"?")) {
                aminate_slider();
                return 0;
            }
        } else if (fs.lstatSync(toDelete).isFile()) {
            if (!confirm("Napewno chcesz usunąć plik: \"" + toDelete + "\"?")) {
                aminate_slider();
                return 0;
            }
        } else {
            aminate_slider();
            return 0;
        }
        aminate_slider();
        try {
            fs.unlinkSync(toDelete);
            console.log("Deleted file: " + toDelete);
            addInfoSlide("Usunięto: " + toDelete);
            getDir(path);
        } catch (error) {
            console.log("Delete error!");
            addInfoSlide("Wystąpil problem. Plik jest prawdopodobnie używany przez inny program!", 'error');
            getDir(path);
        }
    } catch (error) {
        aminate_slider();
        addInfoSlide("Brak dostępu do obiektu!", 'error');
        getDir(path);
    }

}



/** -----------------------Slider menu and info---------------------- **/
/** Slider (left menu) button maker */
function addButton(ico, txt, func = closeApp, style = 'slider-button') {
    var button = document.createElement('div');
    var div_ico = document.createElement('div');
    var div_txt = document.createElement('div');
    var icon = document.createElement('i');
    icon.classList.add(ico);
    var content = document.createTextNode(txt);
    div_ico.appendChild(icon);
    div_txt.appendChild(content);
    button.appendChild(div_ico);
    button.appendChild(div_txt);
    button.classList.add(style);
    button.addEventListener('click', func);
    return button;
}

/** info about file on slider */
function infoFuncEvent(e) {
    addInfoSlide(ev.target.textContent);
    // console.log(ev.target.textContent);
}

/** Left menu maker (slider) */
function aminate_slider(btnList = []) {
    dur = 250;
    if (!clickedMenuBox && !doAnimation) {
        clickedMenuBox = true;
        doAnimation = true
        var box = document.querySelector('#box');
        var slider_div = document.createElement("div");
        slider_div.classList.add("slider-box");
        slider_div.id = "slider-box";


        slider_div.appendChild(addButton('icon-shuffle', 'Randomize', randomize));
        slider_div.appendChild(addButton('icon-arrows-cw', 'Re-Randomize', reRandomize));
        slider_div.appendChild(addButton('icon-download', 'YouTube Downloader', yt_downloader_show));
        //bonus buttons
        if (btnList.length > 0) {
            btnList.forEach(btn => {
                slider_div.appendChild(addButton(btn[0], btn[1], btn[2]));
            });
        }
        //
        slider_div.appendChild(addButton('icon-logout', 'Exit', closeApp));


        box.appendChild(slider_div);

        const animBox = popmotion.styler(slider_div);
        popmotion.tween({
            to: {
                marginLeft: 0
            },
            duration: dur
        }).start(animBox.set);
        setTimeout(function () {
            doAnimation = false;
        }, dur + 150);

    } else if (clickedMenuBox && !doAnimation) {
        clickedMenuBox = false;
        doAnimation = true;
        box = document.querySelector('#slider-box');
        animBox = popmotion.styler(box);
        popmotion.tween({
            to: {
                marginLeft: -250
            },
            duration: dur
        }).start(animBox.set);
        setTimeout(function () {
            box.remove();
            doAnimation = false;
        }, dur + 150);
    }
};

/** Info block maker */
function addInfoSlide(txt, clas = '', wait = 4000) {
    if (clickedMenuBox) aminate_slider();
    var infoBox = document.querySelector('#info-slide');
    var infoItem = document.createElement('div');
    var infoTxt = document.createTextNode(txt);
    infoItem.appendChild(infoTxt);
    infoItem.classList.add('info-item-' + clas);
    infoBox.appendChild(infoItem);
    var animation = popmotion.styler(infoItem);
    popmotion.tween({
        to: {
            opacity: 1
        },
        duration: 300
    }).start(animation.set);

    setTimeout(() => {
        popmotion.tween({
            from: {
                opacity: 1
            },
            to: {
                opacity: 0
            },
            duration: 300
        }).start(animation.set);
        setTimeout(() => {
            infoItem.remove();
        }, 200);
    }, wait);
}