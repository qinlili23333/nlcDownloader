// ==UserScript==
// @name         国图下载器
// @namespace    https://qinlili.bid/
// @version      0.1
// @description  通过劫持中间数据下载原始PDF，虽然方法非常扭曲，但能跑起来
// @author       琴梨梨
// @match        *://read.nlc.cn/static/webpdf/indexnobj.html?*
// @icon         https://read.nlc.cn/static/style/images/gutu_logo.jpg
// @grant        none
// @run-at       document-body
// ==/UserScript==

(function() {
    'use strict';
    const dlFile = (link, name) => {
        let eleLink = document.createElement('a');
        eleLink.download = name;
        eleLink.style.display = 'none';
        eleLink.href = link;
        document.body.appendChild(eleLink);
        eleLink.click();
        document.body.removeChild(eleLink);
    }

    let injectWorker=`(function(open) {
        XMLHttpRequest.prototype.open = function(method, url, async, user, pass) {
            if(url.indexOf("OutOpenBook/getReader")>0){
                console.log(url)
                console.log("捉住下载请求了喵！正在监控喵！")
                this.addEventListener('load', event=>{
                    console.log("下载完成了喵！正在导出文件！");
                    const pdfFile=URL.createObjectURL(new Blob([this.response]));
                    console.log(pdfFile);
                    postMessage("pdfFile:"+pdfFile)
                });
            }
            open.call(this, method, url, async, user, pass);
        };
    })(XMLHttpRequest.prototype.open);
    const originImport=self.importScripts;
    self.importScripts=src=>(originImport("http://read.nlc.cn/static/webpdf/lib/"+src));`
    const originWorker=window.Worker
    window.Worker= function(aurl,options) {
        if(aurl.indexOf("WebPDFJRWorker.js")>0){
            console.log("捉住Worker请求了喵！")
            console.log(aurl)
            var oReq = new XMLHttpRequest();
            oReq.open("GET", aurl,false);
            oReq.send();
            const mergedWorker=URL.createObjectURL(new Blob([injectWorker+oReq.response]))
            console.log("给Worker加点料！寄汤来咯！")
            let hookWorker= new originWorker(mergedWorker,options);
            hookWorker.addEventListener('message', (event) => {
                if(!(typeof event.data=="object")&&event.data.startsWith("pdfFile")){
                    console.log("下载！冲冲冲！")
                    event.stopPropagation();
                    event.preventDefault();
                    dlFile(event.data.substr(8),"nlc.pdf")
                }
            },true);
            return hookWorker;
        }else{
            return new originWorker(aurl,options);
        }
    }
})();
