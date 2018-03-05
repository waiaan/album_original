'use strict';
const fs=require("fs");
const http=require("http");
const ejs=require("ejs");
const config=require("../config/config.js");
const path=require("path");
const formidable=require("formidable");

var dirs=fs.readdirSync(config.dataPath) //读取所存在的图片文件夹
		,picsFolders={};//定义文件夹：文件对象
for(let i=0;i<dirs.length;i++){
	let tmp=fs.readdirSync(path.join(config.dataPath,"/",dirs[i]));
	picsFolders[dirs[i]]=tmp;
}


const server=http.createServer(router)
			.listen(config.port,(err)=>{
				if(err) throw err;
				console.log("server is running on port "+config.port);
			});

//路由："/","/admin","/aaa","/aaa/xxx.jpg","/upload","0/1/2"
function router(req,res){
	if(req.url==="/favicon.ico") res.end();
	const reqUrlArr=req.url.split("/");
	let reqFolder=null,reqPic=null;
	//取出请求的目录 reqFolder
	if(reqUrlArr[1]){
		reqUrlArr[1]=decodeURI(reqUrlArr[1]);
		if(picsFolders[reqUrlArr[1]]){
			reqFolder=reqUrlArr[1];
		}
	}
	//取出请求的图片 reqPic
	if(reqUrlArr[1]&&picsFolders[reqUrlArr[1]]&&reqUrlArr[2]){
		reqPic=decodeURI(reqUrlArr[2]);
		// console.log("reqPic", reqPic);
	}
	if(reqUrlArr[1]&&reqUrlArr[1]==="admin"){
		///admin
		renderAdmin(reqFolder,res);
	}else if(reqFolder&&!reqPic){
		///aaa
		renderDirs(reqFolder,res);
	}else if(reqUrlArr[1]&&reqUrlArr[1]==="upload"){
		///upload
		handleUpload(req,res);
	}else if(reqPic){
		///aaa/xxx.jpg
		let hasPic=false;
		for(var i=picsFolders[reqUrlArr[1]].length-1;i>-1;i--){
			if(picsFolders[reqUrlArr[1]][i]===reqPic){
				hasPic=true;
			}
		}
		if(hasPic){
			renderPic(reqFolder,reqPic,res);
		}else{
			//index
			renderIndex(picsFolders,res);
		}
	}else{
		//index
		renderIndex(picsFolders,res);
	}
}

//render index
function renderIndex(picsFolders,res){
	let dirs=[],covers=[];
	for(var i in picsFolders){
		dirs.push("/"+i);
		covers.push("/"+i+"/"+picsFolders[i][0]);
	}
	fs.readFile(path.join(config.htmlPath+"\\"+"index.ejs"),(err,data)=>{
		if(err) throw err;
		const html=ejs.render(data.toString(),{dirs:dirs,covers:covers});
		res.writeHead(200,{"Content-Type":"text/html;charset=UTF-8"});
		res.end(html);
	});
}

//render pic /aaa/xxx.jpg
function renderPic(reqFolder,reqPic,res){
	const picPath=path.join(config.dataPath+"\\"+reqFolder+"\\"+reqPic);
	fs.readFile(picPath,(err,data)=>{
		if(err) throw err;
		res.writeHead(200,{"Content-Type":"image/jpeg;charset=UTF-8"});
		res.write(data);
		res.end();
	});
}

//render display /aaa
function renderDirs(reqFolder,res){
	let pics=[];
	for(var i=0;i<picsFolders[reqFolder].length;i++){
		pics.push("/"+reqFolder+"/"+picsFolders[reqFolder][i]);
	}
	fs.readFile(path.join(config.htmlPath+"\\"+"display.ejs"),(err,data)=>{
		if(err) throw err;
		const html=ejs.render(data.toString(),{pics:pics});
		res.writeHead(200,{"Content-Type":"text/html;charset=UTF-8"});
		res.end(html);
	});
}

// renderAdmin /admin
function renderAdmin(reqFolder,res){
	let dirs=[];
	for(var i in picsFolders){
		dirs.push(i);
	}
	fs.readFile(path.join(config.htmlPath+"\\"+"admin.ejs"),(err,data)=>{
		if(err) throw err;
		const html=ejs.render(data.toString(),{dirs:dirs});
		res.writeHead(200,{"Content-Type":"text/html;charset=UTF-8"});
		res.end(html);
	});
}

// handleUpload /upload
function handleUpload(req,res){
	const form=new formidable.IncomingForm();
	// 设置文件上传路径
	form.uploadDir=config.dataPath;
	form.parse(req,(err,fields,files)=>{
		if(err) throw err;
		// 文件名称不能为空
		if(!files.file.name){
			console.log("请选择文件");
			res.writeHead(301,{"Content-Type":"text/html;charset=UTF-8","Location":"/admin"});
			res.end();
			return;
		}
		// 取出表单提交的文件夹名
		let uploadFolder="";
			// 文件夹名称不能为空
		if(fields.uploadFolder){
			uploadFolder=fields.uploadFolder;
		}else if(fields.newFolder){
			uploadFolder=fields.newFolder;
		}else{
			console.log("文件夹名称为空");
			res.writeHead(301,{"Content-Type":"text/html;charset=UTF-8","Location":"/admin"});
			res.end();
			return;
		}
		// 定义新的上传文件路径(含文件名)
		const newFolder=path.join(config.dataPath+"\\"+uploadFolder+"\\"+files.file.name);
		// 取出旧的上传路径(含文件名)
		const oldFolder=files.file.path;
		form.keepExtensions = true;
		if(picsFolders[uploadFolder]){
			// 已存在文件夹
			fs.renameSync(oldFolder,newFolder);
		}else{
			// 新建文件夹
			fs.mkdirSync(config.dataPath+"\\"+uploadFolder);
			fs.renameSync(oldFolder,newFolder);
			picsFolders[uploadFolder]=[];
		}
		picsFolders[uploadFolder].unshift(files.file.name);
		res.writeHead(301,{"Content-Type":"text/html;charset=UTF-8","Location":"/"});
		res.end();
	});
}
