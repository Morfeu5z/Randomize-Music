// Get drives list
localStorage.setItem('DiskLoop', 0);

const electron = require('electron');
const { remote, ipcRenderer } = require('electron');
const popmotion = require('popmotion');
const fs = require('fs');
const diskInfo = require('diskinfo');


const ulList = document.querySelector('#file-list ul');
const ulDisk = document.querySelector('#app-disk ul');
const diskRefresh = document.querySelector('#disks-refresh');

var clickedMenuBox = false; //left slider
var doAnimation = false; // left slider animation
var pathTable = []; // Starter path on windows
var path = '';

function closeApp(){
    remote.app.quit();
}
function minmax(){
    const currentWindow = remote.getCurrentWindow();
    if (currentWindow.isMaximized()) {
        currentWindow.unmaximize();
    } else {
        currentWindow.maximize();
    }
}
function hiddeWindow(){
    remote.getCurrentWindow().minimize();
}

// get disks
function getDiskList(){
    ulDisk.innerHTML = '';
    diskInfo.getDrives((err, drives)=>{
        // console.log(drives.length);
        for(var i = (!localStorage.getItem('DiskLoop') ? 0 : localStorage.getItem('DiskLoop')); i<drives.length; i++){
            var newDisk = document.createElement('li');
            var newLabel = document.createTextNode(drives[i].mounted + '\\');
            newDisk.appendChild(newLabel);
            ulDisk.appendChild(newDisk);
        }
        localStorage.setItem('DiskLoop', drives.length);
        pathTable = [];
        pathTable.push(drives[0].mounted + '\\');
        path = pathbuilder('current');
        // Get actualy dirs and files
        getDir(path);
    });
}

// Make path to dir or file
function pathbuilder(mode){
    var first = true;
    switch(mode){
        case 'current':
            var compleate = '';
            pathTable.forEach(element => {
                (!first)? compleate += element + '\\' : compleate += element;
                first=false;
            });
            return compleate;
            break;
        case 'back':
            if(pathTable.length>1)pathTable.pop();
            var compleate = '';
            pathTable.forEach(element => {
                (!first)?compleate += element + '\\' : compleate += element;
                first=false;
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

// View list of dirs and files
function getDir(path){
    files = fs.readdirSync(path);
    ulList.innerHTML = '';
    // console.log(files);
    files.forEach(element => {
        // console.log(element);
        newli = document.createElement('li'); // new li element
        newtxt = document.createTextNode(element); // add file or dir name
        newli.appendChild(newtxt);
        ulList.appendChild(newli); // add to ul
    });
    // console.log(newlist);
    document.querySelector('#current-path').innerHTML = path;
}

// Randomize files with prefix
function randomize(){
    // console.log(path);
    if(!confirm("Are you sure you want to randomize this directory: "+path+"?"))return 0;
    reRandomize(false);
    var wasRandom = false;
    var list = fs.readdirSync(path);
    var miss = 0;
    var prefix = 0;
    var ll = list.length;
    for(var i = 0; i<ll; i++){
        // console.log(list);
        var x = 0;
        x=Math.floor(Math.random() * (list.length -1));
        // console.log(x);
        prefix++;
        if (fs.lstatSync(path + list[x]).isDirectory()){
            //Do nothing
            miss++;
        }else{
            fs.renameSync(path + list[x], path + prefix + "_-_" + list[x]);
            wasRandom = true;
        }
        list.splice(x, 1);
    }
    getDir(path);
    if(wasRandom){
        addInfoSlide('Randomize Complete.');
        addInfoSlide('Miss directory: ' + miss);
    }else{
        addInfoSlide('Nothing to randomize.');
    }
}

// Back randomize prefix
function reRandomize(setInfo=true){
    if(setInfo)if(!confirm("Are you sure you want to re-randomize this directory: "+path+"?"))return 0;;
    // console.log(path);
    var list = fs.readdirSync(path);
    var prefix = 0;
    var wasRandom = false;
    list.forEach(item => {
        var ext = item.split('.');
            ext = ext[ext.length-1];
        var end = item.length - ext.length;
        
        for(var i = 0; i<end; i++){
            var old_prefix = item.slice(i,i+2);
            var prefix = item.slice(i,i+3);
            if(prefix=="_-_"){
                try {
                    wasRandom =true;
                    fs.renameSync(path + item, path + item.slice(i+3, item.length));
                    i = end;
                } catch (error) {
                    addInfoSlide('Error! File: \"' + item + '\" is used by another program.', 'error', 10000);                    
                }
            }else if(old_prefix == '. '){
                try {
                    wasRandom =true;
                    fs.renameSync(path + item, path + item.slice(i+2, item.length));
                    i = end;
                } catch (error) {
                    addInfoSlide('Error! File: \"' + item + '\" is used by another program.', 'error', 10000);                    
                }
            }
        }
    });
    getDir(path);
    if(setInfo)if(wasRandom){
        addInfoSlide('Re-Randomize Complete.');
    }else{
        addInfoSlide('Nothing to Re-Randomize.');
    };
}

// add button
function addButton(ico, txt, func=closeApp, style='slider-button'){
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

// info about file on slider
function infoFuncEvent(e){
    addInfoSlide(ev.target.textContent);
    // console.log(ev.target.textContent);
}

// Make left menu
function aminate_slider(btnList=[]){
    dur = 250;
    if(!clickedMenuBox && !doAnimation){
        clickedMenuBox = true;
        doAnimation = true
        var box = document.querySelector('#box');
        var slider_div = document.createElement("div");
        slider_div.classList.add("slider-box");
        slider_div.id = "slider-box";


        slider_div.appendChild(addButton('icon-shuffle','Randomize', randomize));
        slider_div.appendChild(addButton('icon-arrows-cw','Re-Randomize', reRandomize));
        //bonus buttons
        if(btnList.length>0){
            btnList.forEach(btn => {
                slider_div.appendChild(addButton(btn[0], btn[1], btn[2]));
            });
        }
        //
        slider_div.appendChild(addButton('icon-logout','Exit', closeApp));

        box.appendChild(slider_div);

        const animBox = popmotion.styler(slider_div);
        popmotion.tween({
            to:{
                marginLeft: 0
            },
            duration: dur
        }).start(animBox.set);
        setTimeout(function(){
            doAnimation = false;
        }, dur+150);

    }else if(clickedMenuBox && !doAnimation){
        clickedMenuBox = false;
        doAnimation = true;
        box = document.querySelector('#slider-box');
        animBox = popmotion.styler(box);
        popmotion.tween({
            to:{
                marginLeft: -250
            },
            duration: dur
        }).start(animBox.set);
        setTimeout(function(){
            box.remove();
            doAnimation = false;
        }, dur+150);
    }
};

function addInfoSlide(txt, clas='', wait=4000){
    if(clickedMenuBox)aminate_slider();
    var infoBox = document.querySelector('#info-slide');
    var infoItem = document.createElement('div');
    var infoTxt = document.createTextNode(txt);
    infoItem.appendChild(infoTxt);
    infoItem.classList.add('info-item-'+clas);
    infoBox.appendChild(infoItem);
    var animation = popmotion.styler(infoItem);
    popmotion.tween({
        to:{
            opacity: 1
        },
        duration: 300
    }).start(animation.set);
    
    setTimeout(()=>{
        popmotion.tween({
            from:{
                opacity: 1
            },
            to:{
                opacity: 0
            },
            duration: 300
        }).start(animation.set);
        setTimeout(()=>{
            infoItem.remove();
        }, 200);
    }, wait);
}