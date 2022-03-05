const axios = require("cloudscraper");
const cheerio = require('cheerio');

module.exports = new class AnimeYabu {


    async listAnimes(query, callback){

        let animes = await axios("https://animeyabu.com/api/show.php");

        let data = JSON.parse(animes);

        if(!query.limit){
            query.limit = 40;
        }

        if(!query.page){
            query.page = 1;
        }

        if(isNaN(query.page)){
            query.page = 1;
        }

        if(Math.floor(query.page) < 1){
            query.page = 1;
        }

        if(isNaN(query.limit)){
            query.limit = 40;
        }

        let send = [];

        if(!query.nolimit && query.nolimit !== "true")
            data = data.slice((Math.floor(query.page)*Math.floor(query.limit))-Math.floor(query.limit), (Math.floor(query.page)*Math.floor(query.limit))-Math.floor(query.limit)+Math.floor(query.limit))
        for(let item of data){
            let d = {};
            d.id = item.hash;
            d.name = item.title;
            d.genero = item.genre;
            d.url = "https://animeyabu.com/anime/"+item.slug+"/";
            d.slug = item.slug;
            d.thumb = "https://animeyabu.com/"+item.cover;
            send.push(d);
        }

        callback(true, send);

    }

    async listAnimesUpdated(query, callback){

        let data = await axios("https://animeyabu.com/");
        let { data: list } = JSON.parse(await axios(process.env.URLSITE+"/v1/animeyabu/list?nolimit=true", { headers: { 'Authorization': process.env.AUTHORIZATION_TOKEN } }));

        let $ = cheerio.load(data);
        let send = [];
        $(".phpvibe-video-list .video").each((index, element) => {
            let d = {}
            d.thumb = $(element).find("img").attr("src") ?? $(element).find("img").attr("data-cfsrc");
            if(d.thumb){
                if(d.thumb.startsWith("capas")){
                d.thumb = "https://animeyabu.com/"+d.thumb;
            }
            let r = list.find(e => e.thumb == d.thumb);
            if(r){
                d.id = r.id;
                d.name = r.name;
                d.genero = r.genero;
                d.url = r.url;
                d.thumb = r.thumb;
                d.slug = r.slug;
                d.time = $(element).find(".timer").text();
                d.titleep = $(element).find(".video-title a").text();
                send.push(d);
            }
            }
        });

        callback(true, send);

    }

    async getAnimeByUrl(query, callback){

        if(!query.name){
            return callback(false, 400, "Envie todos os parametros");
        }
        
        let { data: list } = JSON.parse(await axios(process.env.URLSITE+"/v1/animeyabu/list?nolimit=true", { headers: { 'Authorization': process.env.AUTHORIZATION_TOKEN } }));

        let d = {};
        let r = list.find(e => e.slug == query.name);
        if(r){
            d.id = r.id;
            d.name = r.name;
            d.genero = r.genero;
            d.url = r.url;
            d.thumb = r.thumb;
            d.slug = r.slug;
        }else{
            return callback(false, 404, "Não encontrado o anime");
        }

        callback(true, d);

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
                            message: err.name
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
                    if(err.name == "TypeError"){
                        err.name = err.name + " - " + err.message
                    }
                    resolve({
                        status: 500,
                        success: false,
                        data: {
                            message: err.name
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
                            message: err.name
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
