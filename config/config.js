'use strict';
const path=require("path");

const reldatapath="../data/";
const relhtmlpath="../html/";

const datapath=path.resolve(__dirname,reldatapath);
const htmlpath=path.resolve(__dirname,relhtmlpath);

module.exports={
	port:1111,
	dataPath:datapath,
	htmlPath:htmlpath,
	cover:"cover.jpg"
}