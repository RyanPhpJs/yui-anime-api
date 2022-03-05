const express = require("express");
require("dotenv").config();

const app = express();

const method = {
    crunchyroll: require("./methods/crunchyroll"),
    animeyabu: require("./methods/animeyabu")
}

app.use("/v1", (req, res, next) => {
    if(req.get('authorization') === process.env.AUTHORIZATION_TOKEN){
        next();
    }else{
        res.status(401).send({
            status: 401,
            success: false,
            data: {
                message: "Token de autenticação invalido"
            }
        })
    }
});

app.get("/v1/:method/:action", async (req, res) => {

    try {
        if(method[req.params.method]){

            let data = await method[req.params.method].run(req.params.action, req.query);

            if(data.success){
                res.send({
                    status: 200,
                    success: true,
                    data: data.data
                });
            }else{
                res.send({
                    status: data.status,
                    success: false,
                    data: {
                        message: data.message ?? data.data.message
                    }
                });
            }

        }else{
            res.status(404).send({
                status: 404,
                success: false,
                data: {
                    message: "Method "+req.params.method+" not found"
                }
            })
        }
    } catch(err){
        res.send(500).send({
            status: 500,
            success: false,
            data: {
                message: err.message
            }
        })
    }

});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server Running");
})
