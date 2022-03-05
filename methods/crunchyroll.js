const axios = require("cloudscraper");
const cheerio = require('cheerio');
module.exports = new class Crunchyroll {

    async listAnimes(params, callback){

        let data = await axios("https://www.crunchyroll.com/pt-br/videos/anime/popular/ajax_page?pg="+(params.page ?? 1));

        let $ = cheerio.load(data);
        let send = [];
        $("li").each((index, element) => {
            let d = {}
            d.group_id = $(element).attr("group_id");
            d.name = $(element).find(".series-title").text().trim();
            d.thumb = $(element).find(".portrait").attr("src");
            d.url = $(element).find(".block-link").attr("href");
            if(d.url.startsWith("/") && !d.url.startsWith("//")){
                d.url = "https://www.crunchyroll.com"+d.url;
            }
            send.push(d);
        });

        callback(true, send);

    }

    async listAnimesUpdated(params, callback){

        let data = await axios("https://www.crunchyroll.com/pt-br/videos/anime/updated");

        let $ = cheerio.load(data);
        let send = [];
        $("#main_content li").each((index, element) => {
            let d = {}
            d.group_id = $(element).attr("group_id");
            d.name = $(element).find(".series-title").text().trim();
            d.thumb = $(element).find(".portrait").attr("src");
            d.url = $(element).find(".block-link").attr("href");
            d.data = $(element).find(".series-data").text().trim();
            d.ep = d.data.split(" – ")[0];
            d.data = d.data.split(" – ")[1];
            if(d.url.startsWith("/") && !d.url.startsWith("//")){
                d.url = "https://www.crunchyroll.com"+d.url;
            }
            send.push(d);
        });

        callback(true, send);

    }

    async getAnimeByUrl(params, callback){
        if(!params.name){
            return callback(false, 400, "Envie todos os parametros");
        }
        let data = await axios("https://www.crunchyroll.com/pt-br/"+params.name);
        let $ = cheerio.load(data);
        if($('meta[property="og:type"]').attr("content") !== "tv_show"){
            return callback(false, 400, "Isso não é um anime");
        }
        callback(true, {
            type: $('meta[property="og:type"]').attr("content"),
            title: $('meta[property="og:title"]').attr("content"),
            description: $('meta[property="og:description"]').attr("content"),
            image: $('meta[property="og:image"]').attr("content"),
            url:  $('meta[property="og:url"]').attr("content"),
        })
    }

    run(action, query){
        return new Promise((resolve) => {

            if(action == "list"){
            
                this.listAnimes(query, (success, status, data) => {
                    if(success){
                        resolve({
                            success: true, 
                            status: 200,
                            data: data ?? status
                        });
                    }else{
                        resolve({
                            success: false,
                            status: status,
                            data: {
                                message: data
                            }
                        })
                    }
                }).catch((err) => {
                    resolve({
                        status: 500,
                        success: false,
                        data: {
                            message: err.name + " - " + (this.errorMsg[err.errorType])
                        }
                    })
                });

            }else if(action == "updated"){
                this.listAnimesUpdated(query, (success, status, data) => {
                    if(success){
                        resolve({
                            success: true, 
                            status: 200,
                            data: data ?? status
                        });
                    }else{
                        resolve({
                            success: false,
                            status: status,
                            data: {
                                message: data
                            }
                        })
                    }
                }).catch((err) => {
                    resolve({
                        status: 500,
                        success: false,
                        data: {
                            message: err.name + " - " + (this.errorMsg[err.errorType])
                        }
                    })
                });
            }else if(action == "anime"){
                this.getAnimeByUrl(query, (success, status, data) => {
                    if(success){
                        resolve({
                            success: true, 
                            status: 200,
                            data: data ?? status
                        });
                    }else{
                        resolve({
                            success: false,
                            status: status,
                            data: {
                                message: data
                            }
                        })
                    }
                }).catch((err) => {
                    resolve({
                        status: 500,
                        success: false,
                        data: {
                            message: err.name + " - " + (this.errorMsg[err.errorType])
                        }
                    })
                });
            }else{
                resolve({
                    status: 404,
                    success: false,
                    message: "action "+action+" not found"
                });
            }

        });
    }

}