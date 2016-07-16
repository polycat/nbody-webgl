"use strict";

function Render(bodies) {
	this.gl;
	this.program;
	this.projectionLocation;
	this.modelviewLocation;
	this.asteroidTexture;
	this.normalMatrixLocation;

	this.viewMatrix = mat4.create();
	this.projectionMatrix = mat4.create();
	this.lightPosLocation;
	this.initGL();
	this.initTextures();
}
Render.prototype.handleLoadedTexture = function (gl,texture) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

Render.prototype.initTextures = function() {
    this.asteroidTexture = this.gl.createTexture();
    this.asteroidTexture.image = new Image();
    var obj = this;
    this.asteroidTexture.image.onload = function () {
        obj.handleLoadedTexture(obj.gl, obj.asteroidTexture)
    }
    this.asteroidTexture.image.src = "resources\\images\\moon.png";
}

Render.prototype.initGL = function () {
	try {
		this.gl = WGL.getGLContextFromCanvas("canvas");
		if (!this.gl) {
			alert("No WebGL!");
		}
		this.program = WGL.createProgramFromScripts(this.gl, "vert-shader", "frag-shader");
	} 
	catch (err) {		
		alert(err.toString());
	}
	this.gl.clearColor(0.03, 0.45, 0.63, 1.0);	
	this.gl.enable(this.gl.DEPTH_TEST);
	//this.gl.enable(this.gl.BLEND);
	//this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
	WGL.fitViewportToCanvas(this.gl);

	this.initMVP();
	return this;
}

Render.prototype.updateCanvasSize = function () {
	WGL.fitViewportToCanvas(this.gl);
	this.initMVP();
}

Render.prototype.createBodyRenders = function (bodies){
	var bodyRenders = [];
	if (bodies === undefined) return bodyRenders;
	for (var i = 0; i < bodies.length; i++) {
		var br = new BodyRender(bodies[i].id,bodies[i].mesh,this.gl, this);
		bodyRenders.push(br);
	}
	this.bodyRenders = bodyRenders;
	return bodyRenders;
}

Render.prototype.clear = function (bodies) {
	this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);	
}

Render.prototype.drawGL = function () {
	this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);	
	this.gl.useProgram(this.program);
	this.modelviewLocation = this.gl.getUniformLocation(this.program, "u_modelview");
	this.projectionLocation = this.gl.getUniformLocation(this.program, "u_projection");
    this.samplerUniform = this.gl.getUniformLocation(this.program, "uSampler");
    this.normalLocation = this.gl.getAttribLocation(this.program, "a_normal");
    this.normalMatrixLocation = this.gl.getUniformLocation(this.program, "u_normalMatrix");

    this.lightPosLocation = this.gl.getUniformLocation(this.program, "u_light_pos");
	return this;
}



Render.prototype.initMVP = function() {
	mat4.lookAt(this.viewMatrix, [10.0, 10.0, 10.0], [0.0, 0.0, 0.0], [1.0, 0.0, 0.0]);
	mat4.perspective(this.projectionMatrix, Math.PI/5, this.gl.canvas.clientWidth/this.gl.canvas.clientHeight, 0.01, 1000.0);	

	return this;
}

Render.prototype.moveCamera = function(firstCoord,secondCoord,speed) {
	for (var i = 0; i < 3; i++) {
		if (firstCoord[i] == secondCoord[i]) continue;
		var value = speed;
		if (firstCoord[i] < secondCoord[i]) {
			speed *= -1;
		}
		var direction = [0,0,0];
		direction[i] = 1;
		mat4.rotate(this.viewMatrix, this.viewMatrix, speed*Math.PI/180.0, direction);
	}
}
	// if(isScale) {
	// 	mat4.scale(this.viewMatrix,this.viewMatrix,[scale,scale,scale]);
	// 	isScale=false;
	// }



Render.prototype.render = function (bodies, rotation_is_on) {	
	this.drawGL();
	if (this.bodyRenders === undefined) return;
	for (var i = 0; i < this.bodyRenders.length; i++) {
		var br = this.bodyRenders[i];
	 	br.update(bodies[i].coord,bodies[i].mesh.rotation_angle, rotation_is_on);
	 	br.draw();
	}
}


function BodyRender(id, mesh,gl, generalRender) {
	this.id = id;
	this.gl = gl;
	this.body = mesh;
	this.rotation_angle;
	this.rotation_angle_shift = mesh.rotation_angle;
	this.generalRender = generalRender;
	this.buffers = {};
	this.modelviewMatrix = mat4.create();
	this.modelMatrix = mat4.create();
	this.frameCounter = 0;
	this.init();
}


BodyRender.prototype.initBody = function() {
	var body = this.body;
	var buffers = this.buffers;
	var gl = this.gl;
	this.rotation_angle = 1;
	this.buffers.vertexBuffer = this.gl.createBuffer();
	gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.vertexBuffer);
	this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(body.mesh.vertices), this.gl.STATIC_DRAW);

	this.buffers.normalBuffer = this.gl.createBuffer();
	this.gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.normalBuffer);
	this.gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(body.mesh.normals), this.gl.STATIC_DRAW);	


    this.buffers.moonVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.moonVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(body.mesh.textureCoords), gl.STATIC_DRAW);


    this.gl.uniform1i(this.samplerUniform, 0);

	this.buffers.indexBuffer = this.gl.createBuffer();
	this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indexBuffer);
	this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(body.mesh.indices), this.gl.STATIC_DRAW);

	this.buffers.numOfIndices = body.mesh.indices.length;	
	return this;
}

BodyRender.prototype.draw = function(){
	var gl = this.gl;
	var generalRender = this.generalRender;

	var viewMatrix = generalRender.viewMatrix;
	var projectionMatrix = generalRender.projectionMatrix;

	mat4.multiply(this.modelviewMatrix,viewMatrix,this.modelMatrix);

	var normalMatrix = getNormalMatrix(this.modelviewMatrix);


	gl.uniformMatrix4fv(generalRender.modelviewLocation, false, this.modelviewMatrix);	
	gl.uniformMatrix4fv(generalRender.projectionLocation, false, projectionMatrix);	

	gl.uniformMatrix3fv(generalRender.normalMatrixLocation, false, normalMatrix);
		

	var light_pos = vec4.create();
	vec4.set(light_pos, 0.0, 100.0, 0.0, 1.0);
	vec4.transformMat4(light_pos, light_pos, viewMatrix);
	gl.uniform4fv(generalRender.lightPosLocation, light_pos);	


	this.positionLocation = gl.getAttribLocation(generalRender.program, "a_position");

	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.vertexBuffer);
	gl.enableVertexAttribArray(this.positionLocation);
	gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 0, 0);


	this.textureCoordsAttr = gl.getAttribLocation(generalRender.program, "a_texture_coord");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.moonVertexTextureCoordBuffer);
	gl.enableVertexAttribArray(this.textureCoordsAttr);
    gl.vertexAttribPointer(this.textureCoordsAttr, 2, gl.FLOAT, false, 0, 0);


	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.normalBuffer);
	gl.enableVertexAttribArray(generalRender.normalLocation);
	gl.vertexAttribPointer(generalRender.normalLocation, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indexBuffer);	

	gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, generalRender.asteroidTexture);
    gl.uniform1i(this.samplerUniform, 0);
	gl.drawElements(gl.TRIANGLES, this.buffers.numOfIndices, gl.UNSIGNED_SHORT, 0);			
	return this;
}


BodyRender.prototype.update = function(coord, rotation_angle_shift, rotation_is_on) {
	mat4.identity(this.modelMatrix);
	mat4.translate(this.modelMatrix, this.modelMatrix, coord);
	mat4.rotate(this.modelMatrix, this.modelMatrix, -this.rotation_angle*Math.PI/180.0, [0, 1, 0]);
	if (rotation_is_on) {
		this.rotation_angle += rotation_angle_shift;
		if (this.rotation_angle >= 360)
			this.rotation_angle -= 360;
	}



	return this;
}

BodyRender.prototype.init = function() {
	this.initBody();	
	return this;
}

function getNormalMatrix(modelviewMatrix) {
	var normalMatrix = mat3.create();
	mat3.fromMat4(normalMatrix, modelviewMatrix);
	mat3.invert(normalMatrix, normalMatrix);
	mat3.transpose(normalMatrix, normalMatrix);
	return normalMatrix;
}