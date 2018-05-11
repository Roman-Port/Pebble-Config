var ChoosingUploader=true;
var workingProject = {};
var working=false;
var advanced = true;
var projectPlatformAndroid;
var workingUUID = null;
var workingToken = null;

var outputRequestJSON = [
    {"name":"Auth OAUTH","id":"oauth","relatedJSON":["authentication.sign_in","authentication.sign_up","authentication.refresh_token"]},
    {"name":"Timeline Sync","id":"tl_s","relatedJSON":["timeline.sync_endpoint"]},
    {"name":"Timeline SB Add","id":"tl_sb","relatedJSON":["timeline.sandbox_user_token"]},
    {"name":"Sign In Webview","id":"si_wv","relatedJSON":["webviews.authentication/sign_in"]},
    {"name":"Sign Up Webview","id":"su_wv","relatedJSON":["webviews.authentication/sign_up"]},
    {"name":"App Store Watchapps","id":"as_u_a","relatedJSON":["webviews.appstore/watchapps"]},
    {"name":"App Store Watchfaces","id":"as_u_f","relatedJSON":["webviews.appstore/watchfaces"]},
    {"name":"App Store App","id":"as_a","relatedJSON":["webviews.appstore/application"], "note":"Use $$id$$ in place of app ID"},
    {"name":"App Store App Log","id":"as_a_cl","relatedJSON":["webviews.appstore/application_changelog"], "note":"Use $$id$$ in place of app ID"},
    {"name":"App Store App Share","id":"as_a_sh","relatedJSON":["webviews.appstore/application_share"], "note":"Use $$id$$ in place of app ID"},
    {"name":"App Store Developer","id":"as_d","relatedJSON":["webviews.appstore/developer_apps"], "note":"Use $$id$$ in place of developer ID"},
    {"name":"App Store Search","id":"as_search","relatedJSON":["webviews.appstore/search"],},
    {"name":"Store Search Query","id":"as_a_q","relatedJSON":["webviews.appstore/search/query"], "note":"Use $$search_type$$ in place of type. Use $$query$$ as the query."}
]		
function ClosePopup(callback) {
    
    $('.frontMsgBG').addClass('frontMsgBG-disabled', callback);
    $('.frontMsg').removeClass('frontMsg-show');
}

function AutoPR_Apply() {
    HideMiniPopup();
    var url = document.getElementById('auto_url').value;
    //Remove anything after a ? in it.
    url=url.split('?')[0];
    url=url.trimRight('/')+"/";
    var i=0;
    var platform="%%platform%%";
    while(i<outputRequestJSON.length) {
        //Check if it matches
        var div = document.getElementById('item_'+outputRequestJSON[i].id+'_input');
        if(outputRequestJSON[i].id=="as_u_a") {
            div.value=url+"?nativeApp=true&searchQuery=&searchCategory=&searchWatch=-1&currentItem=0&platform="+platform+"&authorUUID=&useWatchfaces=false&hardware=&uid=$$user_id$$";
        }
        if(outputRequestJSON[i].id=="as_u_f") {
            div.value=url+"?nativeApp=true&searchQuery=&searchCategory=&searchWatch=-1&currentItem=0&platform="+platform+"&authorUUID=&useWatchfaces=true&hardware=&uid=$$user_id$$";
        }
        if(outputRequestJSON[i].id=="as_a") {
            div.value=url+"application/index.html?nativeApp=true&platform="+platform+"&app=$$id$$&uid=$$user_id$$";
        }
        if(outputRequestJSON[i].id=="as_a_q") { //FIX TYPE!
            div.value=url+"?nativeApp=true&searchQuery=$$query$$&searchCategory=&searchWatch=-1&searchSort=0&currentItem=0&platform="+platform+"&authorUUID=&useWatchfaces=false&hardware=&uid=$$user_id$$";
        }
        i+=1;
    }
}

function ShowAutoPR() {
    var html = '<div id="frontMsg_mini" class="frontMsg_mini frontMsg-show"> <div style="width:100%; height:60px; font-size:20px; text-align:center; line-height:60px;">PebbleRipper Setup</div> <div style="width:100%; height:25px; margin-bottom:10px; font-size:15px; text-align:center; line-height:25px;">Please copy the URL to your PebbleRipper front page.</div> <div style="width:100%; height:25px; margin-bottom:10px; font-size:15px; text-align:center; line-height:25px;"> <input type="text" id="auto_url" class="editor_item_value_input" style="font-size:13px; height:25px; width:100%; border-top:1px solid gray; border-bottom:1px solid gray; text-align:center;" placeholder="https://pebble-appstore.romanport.com/"> </div> <div class="pebble_classic_button main-button" style="float:right; min-width:100px;" onclick=" AutoPR_Apply();">Apply</div> <div class="pebble_classic_button main-button" style="float:right; min-width:100px;" onclick="HideMiniPopup();">Cancel</div> </div>';
    
    ShowMiniPopup(html); //Set
    //Trigger open
    ShowMiniPopup();
}

function HideLoader() {
    $(".loader").addClass("loader_hidden");
    $(".main-button").removeClass("button_disabled");
    working=false;
}

function ShowLoader() {
    $(".loader").removeClass("loader_hidden");
    $(".main-button").addClass("button_disabled");
    working=true;
}

function FindAllKeys(n) {
    var o = [];
    var k = [];
    jQuery.each(Object.keys(n), function(index, val) {
        k.push(val);
        var i = eval("n."+val);
        jQuery.each(Object.keys(i), function(index2, val2) {
            var ii = val+"."+val2;
            
            if(String(val).includes("href")==false && String(val).includes("id")==false && String(ii).includes("debug_access_token_cookie")==false && String(ii).includes("voice.languages")==false && String(ii).includes("enabled_providers")==false && String(ii).includes("force_3x_app_migration")==false) {
                o.push(ii);
            }
        });
    });
    return o;

}

function SendToPhoneBtn() {
    if(working)
        return; //Busy
    ShowLoader();
    GeneratePhoneLink(JSON.stringify(BuildJSON()));
}

function CopyToClipboard(idOfElement) {
    var form = document.getElementById(idOfElement);
    form.select();
    document.execCommand("Copy");
}

function DownloadJSONBtn() {
    if(working)
        return; //Busy
    ShowLoader();
    GetUrlToUse(function(data) {
        //Now, call everything else.
        //Construct the URL.
        var uid = data.uniqueId;
        //Start the download from here.
        //Create the URL
        var url = "https://pebble-config.romanport.com/custom_configs/"+uid+"/raw";
        //Start the download with this.
        document.getElementById('downloader').src=url;
        HideLoader();
        PushConfigToBrowser(uid,data.apiKey);
    },btoa(JSON.stringify(BuildJSON())) , function(error) {
        HandleUploadError(error);
    },workingToken,workingUUID);
}

function HandleUploadError(error) {
    console.log(error);
    var html = '<div style="width:100%; height:60px; font-size:20px; text-align:center; line-height:60px;">Upload Error</div> <div style="width:100%; height:25px; font-size:15px; text-align:center; line-height:25px;">There was a problem uploading. Contact me.</div> <div id="getLinkPaste" style="width:100%; margin-top:15px; margin-bottom:15px; font-size:15px; text-align:center; line-height:15px; background-color:#e4e4e4; font-family: \'Inconsolata\', monospace;">'+error.errorText+'</div> <div class="pebble_classic_button main-button" style="float:right;" onclick="HideMiniPopup(); HideLoader();"> Okay </div>';
    ShowMiniPopup(html);
}

var TmpNo;
var TmpYes;

function AskQuestion(title, subtext, yesCallback, noCallback, yesText, noText) {
    TmpNo = noCallback;
    TmpYes = yesCallback;
    if(yesText==null) {yesText="Yes"}
    if(noText==null) {noText="No"}
    //Show popup 
    var html = '<div style="width:100%; height:60px; font-size:20px; text-align:center; line-height:60px;">'+title+'</div> <div style="width:100%; height:25px; margin-bottom:10px; font-size:15px; text-align:center; line-height:25px;">'+subtext+'</div>  <div class="pebble_classic_button main-button" style="float:right; min-width:100px;" onclick="HideMiniPopup(); TmpYes();">'+yesText+'</div><div class="pebble_classic_button main-button" style="float:right; min-width:100px;" onclick="HideMiniPopup(); TmpNo();">'+noText+'</div>';
    ShowMiniPopup(html);
}

function RestoreBtn() {
    workingToken=null;
    workingUUID=null;
    if(restorePossible==false)
        return;
    AskQuestion("Restore","This will abandon your changes. Continue?",function() {ResetApp(); $('#restore_btn').addClass('button_disabled'); restorePossible=false; document.getElementById('confirm_btn').innerHTML="Push To Phone";},function() {/*Nothing*/});
}

var restorePossible=false;

function DevalidateRestoreInput() {
    //This is called every time the edit box is edited. It just shows the restore button
    restorePossible=true;
    $('#restore_btn').removeClass('button_disabled');
}

//Buttons in the tutorial

function AndroidPushConfigFinalBtn() {
    //In tutorial, this is triggered to push the even to Android.
    var id = activeID;
    var url = ConvertLocalToUrl("custom_configs/"+id+"/");
    SubmitAndroidRequest(url); //Some path goes here
}

function AndroidPushConfigFinalBtnIssues() {
    //Button the user can press if they're having issues.
    var innerHTML = '<div style="width:calc(100% - 20px); margin-left:10px; margin-right:10px; font-size:15px; text-align:left; line-height:25px;"> Having issues? Here are some common fixes.<br><br> <div style="border-left:3px solid gray; padding-left:5px; margin-bottom:5px; width:calc(100% - 10px);"><b>Make sure you chose the correct platform</b><br> When you generated your config, chosing the wrong platform will cause issues. Make sure the platform you selected was okay.</div> <div style="border-left:3px solid gray; padding-left:5px; margin-bottom:5px; width:calc(100% - 10px);"><b>Reboot your phone</b><br> I have this issue a lot. Rebooting your phone usually fixes everything.</div> <div style="border-left:3px solid gray; padding-left:5px; margin-bottom:5px; width:calc(100% - 10px);"><b>Clear the Pebble app\'s cache</b><br> This can usually be done by holding down on the app icon in the multitasking view. Go into the storage tab, and clear the cache. Then, exit the app.</div> <div style="border-left:3px solid gray; padding-left:5px; margin-bottom:5px; width:calc(100% - 10px);"><b>Reinstall the Pebble app</b><br> Only use this as a last resort.</div> </div>';
    var html = '<div style="width:100%; height:60px; font-size:20px; text-align:center; line-height:60px;">Help</div> <div style="width:calc(100% - 20px); margin-left:10px; margin-right:10px;  font-size:15px; text-align:left; line-height:25px;">'+innerHTML+'</div>  <div class="pebble_classic_button main-button" style="float:right;" onclick="HideMiniPopup(); ShowPopup();"> Okay </div>';
    ClosePopup();
    ShowMiniPopup(html);
}

var activeID="";

function ShowPopup(callback,id) {
    if(id!=null) {
        activeID=id[0];
        var url = ConvertLocalToUrl("custom_configs/"+id+"/");
    }
    $('.frontMsgBG').removeClass('frontMsgBG-disabled', callback);
    $('.frontMsg').addClass('frontMsg-show');
    return document.getElementById('frontMsg');
}

function ShowDoneUploadPopup(url,uid) {
    document.getElementById('frontMsg_mini').innerHTML='<div style="width:100%; height:60px; font-size:20px; text-align:center; line-height:60px;"> You\'re Almost There! </div> <div style="width:100%; height:25px; font-size:15px; text-align:center; line-height:25px;"> Copy and paste this link on your mobile device. </div> <div id="getLinkPaste" style="width:100%; margin-top:15px; margin-bottom:15px; height:35px; font-size:15px; text-align:center; line-height:35px; background-color:#e4e4e4; font-family: \'Inconsolata\', monospace;"> <insert link> </div> <div class="pebble_classic_button main-button" style="float:right;" onclick="HideMiniPopup(); HideLoader();"> Okay </div><div class="pebble_classic_button main-button" style="float:right;" onclick="DownloadFileOffline(\''+uid+'\'); HideLoader();"> Download File </div>';
    document.getElementById('getLinkPaste').innerHTML=url;
    ShowMiniPopup();
}

function DownloadFileOffline(uid) {
    var url = "https://pebble-config.romanport.com/custom_configs/"+uid+"/raw";
    document.getElementById('downloader').src=url;
}

function ShowMiniPopup(content) {
    if(content!=null) {
        document.getElementById('frontMsg_mini').innerHTML=content;
    }
    $('.frontMsgBG').removeClass('frontMsgBG-disabled');
    $('.frontMsg_mini').addClass('frontMsg-show');
}

function HideMiniPopup() {
    $('.frontMsgBG').addClass('frontMsgBG-disabled');
    $('.frontMsg_mini').removeClass('frontMsg-show');
}

function RequestPebbleDefaultJSON(android, callback) {
    var url = "https://boot.getpebble.com/api/config/android/v3/4?app_version=4.3";
    if(!android)
        url="https://boot.getpebble.com/api/config/ios/v3/1/1?app_version=4.3";
    url = "https://cors-anywhere.herokuapp.com/"+url;
    //Check if we *actually* want to grab one of our configs.
    if(workingUUID!=null) {
        url="https://pebble-config.romanport.com/custom_configs/"+workingUUID+"/raw";
    }
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var d = this.responseText;
            if(android) {
                d = d.replace("android", "%%platform%%");
            } else {
                d = d.replace("ios", "%%platform%%");
            }
            
            callback(JSON.parse(d).config);
        } 
    }
    
    xmlhttp.open("GET",url, true);
    xmlhttp.send();
}

function ResetApp() {
    ShowLoader();
    //Prompt user if working uuid is null
    if(workingUUID!=null) {
        GotResponseFromPlatform(true);
    } else {
        AskQuestion("Platform","Which platform is this config for?",function() {GotResponseFromPlatform(true);},function(){GotResponseFromPlatform(false);},"Android","iOS");
    }
    
}

function GotResponseFromPlatform(platformAndroid) {
    projectPlatformAndroid = platformAndroid;
    RequestPebbleDefaultJSON(platformAndroid,function(data) {
        AppReady(data);
        HideLoader();
    });
}



function OnLoad() {
    //Run on page load. Duh.
    //Backup request JSON
    backupAppRequestJSON = outputRequestJSON;
    advanced=false;
    
    
    var initialIndex = 1;
    
    //Parse URL
    //Check if we have a pending task.
    var urlPrams = parseURLParams(window.location.href);
    if(urlPrams!=null) {
        if(urlPrams.autogenId!=null) {
            //We have an autogen ID. Do not download configs.
            var id = urlPrams.autogenId;
            document.getElementById('iosCopyURL').value="https://pebble-config.romanport.com/custom_configs/"+id+"/"
            
            //Check for initialIndex
            if(urlPrams.initialIndex!=null) {
                initialIndex = parseInt(urlPrams.initialIndex);
            }
            
            //Init flickity
            $('.main-carousel').flickity({
                cellAlign: 'center',
                initialIndex: initialIndex,
                prevNextButtons: false,
                pageDots: false
            });
            
            
            var h = ShowPopup(null,id);
            //Check if it should fill the view
            if(urlPrams.fullscreen!=null) {
                if(urlPrams.fullscreen=="true") {
                    //Set it to fill the screen. May cause visual bugs.
                    h.style="top:0; left:0; width:100%; height:100%; transition:all 0ms;";
                    //Also hide the Android help button
                    document.getElementById('havingIssuesAndroidBtn').style="display:none;";
                }
            }
            
        } else {
            //No custom autogen ID. Download template.
            ResetApp();
        }
        
        
        //Check if custom stylesheet
        if(urlPrams.customCSS!=null) {
            document.getElementById('customStyle').innerHTML=urlPrams.customCSS; //This is INSECURE and could be used TO RUN JS!!!
        }
    } else {
        //No custom autogen ID. Download template.
        ResetApp();
    }
    
    
    
    //Check web storage.
    ReloadSavedStorage();
    
    
}

var BrowserSave = [];

function PushConfigToBrowser(uuid, token) {
    //Check to see if the uuid already exists.
    var ii = FindRecentItemById(uuid);
    if(ii!=-1) {
        //Already exists. Remove it.
        BrowserSave.splice(ii, 1);
        console.log(BrowserSave);
    }
    var a = {};
    a.uuid=uuid;
    a.token=token;
    a.name=document.getElementById('name_input').value;
    BrowserSave.push(a);
    //Save
    localStorage.setItem("saved", JSON.stringify(BrowserSave));
    //Reload
    ReloadSavedStorage();
}

function ReloadSavedStorage() {
    if(localStorage.getItem("saved")!=null) {
        BrowserSave = JSON.parse(localStorage.getItem("saved"));
        //Let's go ahead and place items in list.
        var i = 0;
        var list = document.getElementById('recents_list');
        var newHTML = "";
        if(BrowserSave.length>0) {
            newHTML='<div style="width:calc(100% - 20px); margin-left:10px; margin-right:10px; text-align:left; font-size:17px; height:30px; line-height:30px; border-bottom: 1px solid #d6d6d6;">Recent Sessions</div>';
            while(i<BrowserSave.length) {
                var item = BrowserSave[i];
                newHTML+='<div class="editor_item" id="item_oauth"> <div class="recents_name ">'+item.name+'</div> <div class="recents_btns"><div class="pebble_classic_button mini_button" style="float:left; min-width:100px;" onclick="RecentsEdit(\''+item.uuid+'\');"> Edit </div><div class="pebble_classic_button mini_button" style="float:right; min-width:100px;" onclick="RecentsRemove(\''+item.uuid+'\');"> Remove </div></div> </div>';
                i+=1;
            }
        } else {
            newHTML='';
        }
        list.innerHTML=newHTML;
        $('#recents_list').fadeIn(100);//addClass('show_recents');
    } else {
        //No web storage...
    }
}

function RecentsEdit(id) {
    var callback = function() {
        //Execute our code here.
        var i = FindRecentItemById(id);
        var item = BrowserSave[i];
        workingUUID = item.uuid;
        workingToken = item.token;
        document.getElementById('confirm_btn').innerHTML="Upload Changes";
        document.getElementById('name_input').value = item.name;
        //Now it's okay to reload and redownload.
        ShowLoader();
        //We want the user to see the loader. We wait 500ms to request
        setTimeout(function(){ResetApp(); DevalidateRestoreInput();},500);
    };
    if(restorePossible) {
        //Show question
        AskQuestion("Edit","This will abandon your changes. Continue?",callback,function() {});
    } else {
        //Just do it
        callback();
    }
}

function RecentsRemove(id) {
    AskQuestion("Remove","You won't be able to edit this item. Are you sure?", function() {
        //Find the item.
        var item = FindRecentItemById(id);
        BrowserSave.splice(item, 1);
        //Save and refresh
        localStorage.setItem("saved", JSON.stringify(BrowserSave));
        ReloadSavedStorage();
    }, function() {});
}

function FindRecentItemById(id) {
    var i=0;
    while(i<BrowserSave.length) {
        if(BrowserSave[i].uuid==id) {
            return i;
        }
        i+=1;
    }
    return -1;
}

function BuildJSON() {
    //Build project
    var i=0;
    
    while(i<outputRequestJSON.length) {
        var line = outputRequestJSON[i];
        var input = document.getElementById('item_'+line.id+'_input').value;
        var ii=0;
        while(ii<line.relatedJSON.length) {
            GetJsonWithStringRequest('workingProject',line.relatedJSON[ii],input);
            ii+=1;
        }
        i+=1;
    }
    //Done
    var r = {};
    r.config=workingProject;
    return r;
}

function ToggleAdvanced() {
    
    var ok = function() {
        advanced=!advanced;
        
        if(!advanced) {
            outputRequestJSON=backupAppRequestJSON;
        }
        
        AppReady(workingProject);
        
        //Change the button
        var btn = document.getElementById('toggle-advanced');
        if(advanced) {
            btn.innerHTML="Simple";
        } else {
            btn.innerHTML="Advanced";
        }
    };
    AskQuestion("Switch Mode","Changes since the last save will be lost.",ok,function(){});
}

var backupAppRequestJSON = null;

function AppReady(data) {
    workingProject=data;
    var editor = document.getElementById('editor');
    //Display all of the things in our config.
    var i=0;
    editor.innerHTML="";
    
    var nameStyle="";
    var valueStyle="";
    
    
    if(advanced) {
        
        //Replace outputRequestJSON with all keys.
        var a = FindAllKeys(workingProject);
        var ia = 0;
        outputRequestJSON=[];
        while(ia<a.length) {
            var iaa = {"name":a[ia],"id":a[ia],"relatedJSON":[a[ia]]}
            outputRequestJSON.push(iaa);
            ia+=1;
        }
        nameStyle="width:330px; overflow:hidden;";
        valueStyle="width:calc(100% - 361px);";
    }
    
    
    
    nameStyle
    
    while(i<outputRequestJSON.length) {
        var line = outputRequestJSON[i];
        editor.innerHTML+='<div class="editor_item" id="item_'+line.id+'"><div class="editor_item_name" style="'+nameStyle+'">'+line.name+'</div><div class="editor_item_value" style="'+valueStyle+'"><input type="text" onChange="DevalidateRestoreInput();" id="item_'+line.id+'_input" value="'+GetJsonWithStringRequest('workingProject',line.relatedJSON[0])+'"></input></div></div>';
        i+=1;
    }
    
}

function GetJsonWithStringRequest(inputName, key, value) {
    //This is REALLY jank.
    //Fix later.
    //If value is not null, then we want to set this.
    var keys = key.split(".");
    var o = ""+inputName;
    var i=0;
    while(i<keys.length) {
        o+="[\""+keys[i]+"\"]";
        i+=1;
    }
    if(value==null) {
        //Read
        return eval(o);
    } else {
        eval(o+"=\""+value+"\"");
    }
    
}



function GeneratePhoneLink(inputJsonDataString) {
    ShowLoader();
    //Get the url. Similar to above function, but we only get the URL.
    GetUrlToUse(function(data) {
        //Now, call everything else.
        //Construct the URL.
        var uid = data.uniqueId;
        var url = (ConvertLocalToUrl("?autogenId="+uid));
        //Convert that URL using (NOT goo.gl) bit.ly
        RequestShortlink(url, function (url_short) {
            //Cool, url_short contains the URL we'd like to use.
            HideLoader();
            //Show window
            ShowDoneUploadPopup(url_short,uid);
        }, function(old_url) {
            //Error.
            HideLoader();
            //Show window with long URL
            ShowDoneUploadPopup(old_url,uid);
        });
        
        PushConfigToBrowser(uid,data.apiKey);
        
    },btoa(inputJsonDataString), function(error) {
        //Error.
        HandleUploadError(error);
    },workingToken,workingUUID);
}

function RevealAndroidShare(msg) {
    var div = document.getElementById('AndroidShareUrl');
    div.innerHTML=msg;
    $("#AndroidShareUrl").addClass("share_reveal");
}

function ConvertLocalToUrl(url) {
    return window.location.protocol+"//"+window.location.hostname+"/"+url;
}

function parseURLParams(url) { 
    var queryStart = url.indexOf("?") + 1,
        queryEnd   = url.indexOf("#") + 1 || url.length + 1,
        query = url.slice(queryStart, queryEnd - 1),
        pairs = query.replace(/\+/g, " ").split("&"),
        parms = {}, i, n, v, nv;

    if (query === url || query === "") return;

    for (i = 0; i < pairs.length; i++) {
        nv = pairs[i].split("=", 2);
        n = decodeURIComponent(nv[0]);
        v = decodeURIComponent(nv[1]);

        if (!parms.hasOwnProperty(n)) parms[n] = [];
        parms[n].push(nv.length === 2 ? v : null);
    }
    return parms;
}

function SubmitAndroidRequest(url) {
    var iframe = document.createElement("iframe");
    iframe.style="display:none;";
    url = CreateDataURL(url);
    iframe.src=url;
    document.getElementById("main").appendChild(iframe);
    var alertText = "DEBUG: Opening iFrame with URL "+url;
    console.log(alertText);
}

function GetUrlToUse(main_callback, data, fail_callback, apiKey, uuidToEdit) {
    var base64 = data;
    var JSON_DATA = {};
    JSON_DATA.data = base64;
    //Set our API keys if that is what we're using.
    if(uuidToEdit!=null) {
        JSON_DATA.apiKey = apiKey;
        JSON_DATA.uuid = uuidToEdit;
    }
    
    SubmitServerRequest("upload.php", function(returnedData) {
        //Deal with the request here.
        if(returnedData.errorCode!=0) {
            //Error.
            console.log("ERROR! Response:");
            console.log(returnedData);
            fail_callback(returnedData);
        } else {
            //Good
            main_callback(returnedData, ConvertLocalToUrl(returnedData.outputLocation));
        }
    }, JSON.stringify(JSON_DATA),"");
}

function SetUploaderBtns(msg) {
    var btn = document.getElementById('AndroidConfirmBtn');
    if(msg.length>1) {
        btn.disabled = true;
        btn.innerHTML=msg;
    } else {
        //Ungrey it.
        btn.disabled = false;
        btn.innerHTML="Set Config";
    }
}

function SetAndroidBtn(msg) {
    //For now
    SetUploaderBtns(msg);
}


function CreateDataURL(url) {
    return "pebble://custom-boot-config-url/"+url;
}

function UseWebStorage(callback) {
    if (typeof(Storage) !== "undefined") {
        callback();
    } else {
        //No web storage support!
        console.log("No web storage support! Cannot save for later.");
    }
}


function ShakeElement(elementName) {
    $(elementName).addClass("shake");
    setTimeout(function(){ $(elementName).removeClass("shake"); }, 1000);
}

function getBase64(callback) {
    try {
        var file = document.getElementById('file').files[0];
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            callback(reader.result);
        };
        reader.onerror = function (error) {
            console.log('Error: ', error);
        };
    } catch (e) {
        //I bet there's no file attached. Shake the button.
        SetUploaderBtns("");
        ShakeElement("#file");
    }
}


function RequestShortlink(longurl, callback, errorCallback) {

    var url = "https://api-ssl.bitly.com/v3/shorten?access_token=137dcebca33e15347a4acd8866109c891391271b&longUrl="+encodeURIComponent(longurl);
    
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onreadystatechange = function() { 
        if(xhr.readyState == 4) { 
            if(xhr.status==200) {
                var data = JSON.parse(this.responseText);
                console.log(data);
                callback(data.data.url);   
            } else {
                console.log("Error", xhr);
            }
        } 
    }
    xhr.send();
    
}

function SubmitServerRequest(url, run_callback, args, type, errorCallback) {
    console.log(args);
    //alert("Opening request to server at url \""+url+"\".");
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        
        if (this.readyState == 4 && this.status == 200) {
            //This is most likely to be valid, but check for errors.
            console.log(this.responseText);
            var JSON_Data;
            try {
                JSON_Data = JSON.parse(this.responseText);
            } catch (e) {
                alert("A JSON error occurred and data could not be grabbed. Check to make sure the server is sending valid JSON. Error: "+e);
                console.log(this.responseText);
                errorCallback();
            }
            if(JSON_Data.error!=null) {
                //Server-side error!
                alert("A server error ("+JSON_Data.error+") occurred and data could not be grabbed. Error: "+JSON_Data.raw_error);
                errorCallback();
            } else {
                //Aye okay here. Call the callback.
                run_callback(JSON_Data);
                return;
            }
        } 
        if(this.readyState==4 && this.status!=200) {
            
            errorCallback();
        }
    }
    
    var type="POST";
    if(args==null) {
        type="GET";
    }
    
    xmlhttp.open(type, url, true);
    if(type.length>1) {
        xmlhttp.setRequestHeader("Content-Type",type);
    }
    xmlhttp.send(args);
}

function SwitchConfigType() {
    //Just toggles views
    $('.secondary_chooser_bar').toggleClass('secondary_chooser_bar_active');
    $('.secondary_chooser_config_item_container').toggleClass('secondary_chooser_config_item_container_active');
}