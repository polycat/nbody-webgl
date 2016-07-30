"use strict";

function BodyMesh(coord, radius, rotation_angle, resolution) {
	this.coord = coord;
	this.radius = radius;	
	this.resolution = resolution;
    this.rotation_angle = rotation_angle;
    this.mesh = this.generateSphere();
    this.generateCraters(2, 2, 10);
}


BodyMesh.prototype.generateSphere = function() {
    var getX = function(r, theta, phi) {
        return r * Math.sin(theta) * Math.cos(phi)
    };
    var getY = function(r, theta, phi) {
        return r * Math.sin(theta) * Math.sin(phi)
    };
    var getZ = function(r, theta) {
        return r * Math.cos(theta)
    };
    var getCartethian = function(r, theta, phi) {
        return [getX(radius, theta, phi), 
            getY(radius, theta, phi), 
            getZ(radius, theta)
        ];
    };
    var vertices = [];
    var indices = [];
    var normals = [];
    var textureCoords = [];

	var theta_resolution = this.resolution-2;
    var phi_resolution = this.resolution;
	var radius = this.radius;

    var phi_step = Math.PI / phi_resolution;
    var theta_step = 2 * Math.PI / (theta_resolution+2);
    var theta, phi, i, j;
    var node_count_i = theta_resolution + 1;
    var node_count_j = phi_resolution + 1;
    
    var k = 0;

    
    for (theta = Math.PI - theta_step, i = 0; i < node_count_i; theta -= theta_step, i++) {
        for (phi = 0, j = 0; j < node_count_j; phi += phi_step, j++) {
            var u = 1 - (j / node_count_j);
            var v = 1 - (i / node_count_i);
            textureCoords.push(u);
            textureCoords.push(v);

            var pointCoods = getCartethian(radius, theta, phi);
            vertices = vertices.concat(pointCoods);
        }
    }

    for (var i = 0; i < node_count_i - 1; i++) 
        for (var j = 0; j < node_count_j - 1; j++) {
            var index = i*node_count_j + j;
            indices = indices.concat([index, index + 1, index + node_count_j,
                index + 1, index + node_count_j, index + node_count_j + 1
            ]);
    }
    [0, node_count_i-1].forEach( function(i) {
        for (var j = 0; j < node_count_j - 1; j++) {
        var index = i*node_count_j + j;
           indices = indices.concat([index,index + 1,node_count_i*node_count_j - 1]);
        }
    });
    //for (var j = 0; j < node_count_j - 1; j++) 
        //indices = indices.concat([(node_count_i - 1)* node_count_j + j, (node_count_i - 1)*node_count_j + j + 1, Math.floor(vertices.length/3)]);
    vertices = vertices.concat(getCartethian(radius, Math.PI, 1));//, 0,0,radius]);

    normals = generateSmoothNormals(vertices,indices);
    this.mesh = {
        vertices: vertices,
        indices: indices,
        normals: normals,
        textureCoords: textureCoords
    };
    return this.mesh;
}


function generateSmoothNormals(vertices, indices) { 
    // Find which triangles belong to which vertices.
    var trianglesPerVertex = [];    
    for (var i = 0; i < indices.length; i++) {
        var triangleIndex = Math.floor(i/3);
        var index = indices[i]; 
        if (!(index in trianglesPerVertex)) {
            trianglesPerVertex[index] = [];
        }
        trianglesPerVertex[index].push(triangleIndex);
    }
    // Compute one face normal for each triangle.
    var faceNormals = [];   
    for (var i = 0; i < indices.length; i += 3) {   
        var normal = computeFaceNormal(vertices, indices[i], indices[i + 1], indices[i + 2]);
        var triangleIndex = Math.floor(i/3);
        faceNormals[triangleIndex] = normal;
    }
    // Compute one smooth normal for each vertex.
    var normals = [];
    var numOfVertices = Math.floor(vertices.length / 3);
    for (var vIndex = 0; vIndex < numOfVertices; vIndex++) {
        var triangles = trianglesPerVertex[vIndex];
        var normal = vec3.fromValues(0.0, 0.0, 0.0);
        if (triangles !== null && triangles !== undefined)  {
            triangles.forEach( function (tIndex) {
                vec3.add(normal, normal, faceNormals[tIndex]);
            });
        }
        normals.push(normal[0]);
        normals.push(normal[1]);
        normals.push(normal[2]);
    }   
    return normals;
}

/**
 * Compute face normal for a given triangle.
 * @param vertices - flat array of vertex coordinates x, y, z.
 * @param i1, i2, i3 - indices of the triangle's vertices in the vertices array.
 */
function computeFaceNormal(vertices, i1, i2, i3) {  
    var x1 = vertices[3*i1];
    var y1 = vertices[3*i1 + 1];
    var z1 = vertices[3*i1 + 2];
    var x2 = vertices[3*i2];
    var y2 = vertices[3*i2 + 1];
    var z2 = vertices[3*i2 + 2];
    var x3 = vertices[3*i3];
    var y3 = vertices[3*i3 + 1];
    var z3 = vertices[3*i3 + 2];
    var v1 = vec3.fromValues(x2 - x1, y2 - y1, z2 - z1);
    var v2 = vec3.fromValues(x3 - x1, y3 - y1, z3 - z1);    
    var cross = vec3.create();
    vec3.cross(cross, v1, v2);
    return cross;
}


// BodyMesh.prototype.generateCraters = function(count, radius, percent) {
//     var vertices = this.mesh.vertices;
//     var diam = 2*radius + 1;
//     var coeff = (percent / 100)*(-1);
//     var n = Math.floor(vertices.length/3);
//     var point_count = this.resolution + 1;
//     var cratersIndices = Util.getRandomArray(count,0,n - 1);
//     for (var k = 0; k < cratersIndices.length; k++) {
//        var craterIndex = cratersIndices[k];
//        var center = vec3.fromValues(this.mesh.vertices[craterIndex*3],this.mesh.vertices[craterIndex*3+1],this.mesh.vertices[craterIndex*3+2]);
//        var y = Math.floor(craterIndex /point_count);
//        var x = craterIndex % point_count;
//        //for (var i = -radius; i < radius; i++) {
//        //   for (var j = -radius; j < radius ; j++) {
//         var begin,end;
//         var counter;
//         begin = [-(diam-1)/2,-(diam-1)/2],end = [(diam-1)/2,(diam-1)/2];
//         var angle;
//         for (var i = 0; i < diam;i++){
//             for (counter = -(diam-1)/2; counter < (diam-1)/2;angle+=Math.PI*((1-1/diam)/diam), counter++) {
//                 var cosin = Math.cos(angle);
//                 this.ffa(begin[1] + x,begin[0] + y,cosin);
//            }
//            begin[0]++;
//        }
//     }
// }

// BodyMesh.prototype.ffa = function(x,y, coeff){
//     var point_count = this.resolution + 1;
//     var current_coords = correct_coords([x,y,point_count);
//     var vertexIndex = current_coords[1]* point_count + current_coords[0];
//     var vector = vec3.create();
//     var v1 = vec3.fromValues(this.mesh.vertices[vertexIndex*3],this.mesh.vertices[vertexIndex*3+1],this.mesh.vertices[vertexIndex*3+2]);
//     var v2 = this.mesh.normals[vertexIndex];
//     vec3.scaleAndAdd(vector, v1,v2,coeff);
//     this.mesh.vertices[vertexIndex*3] = vector[0];
//     this.mesh.vertices[vertexIndex*3 + 1] = vector[1];
//     this.mesh.vertices[vertexIndex*3 + 2] = vector[2];   
// }



BodyMesh.prototype.generateCraters = function(count, radius, percent) {
    var vertices = this.mesh.vertices;
    var coeff = (percent / 100)*(-1);
    var n = Math.floor(vertices.length/3);
    var point_count = this.resolution + 1;
    var cratersIndices = Util.getRandomArray(count,0,n - 1);
    for (var k = 0; k < cratersIndices.length; k++) {
       var craterIndex = cratersIndices[k];
       var center = vec3.fromValues(this.mesh.vertices[craterIndex*3],this.mesh.vertices[craterIndex*3+1],this.mesh.vertices[craterIndex*3+2]);
       var y = Math.floor(craterIndex /point_count);
       var x = craterIndex % point_count;
       for (var i = -radius; i < radius; i++) {
            for (var j = -radius; j < radius ; j++) {
                var current_coords = correct_coords([(x + j),(y + i)],point_count);
                var vertexIndex = current_coords[1]* point_count + current_coords[0];
                var vector = vec3.create();
                var v1 = vec3.fromValues(this.mesh.vertices[vertexIndex*3],this.mesh.vertices[vertexIndex*3+1],this.mesh.vertices[vertexIndex*3+2]);
                var v2 = vec3.fromValues(this.mesh.normals[vertexIndex*3],this.mesh.normals[vertexIndex*3+1],this.mesh.normals[vertexIndex*3+2]);
                vec3.scaleAndAdd(vector, v1,v2,coeff);
                this.mesh.vertices[vertexIndex*3] = vector[0];
                this.mesh.vertices[vertexIndex*3 + 1] = vector[1];
                this.mesh.vertices[vertexIndex*3 + 2] = vector[2];                
            }
       }
    }
}


function correct_coords(coords, point_count){
    for (var i = 0; i < coords.length; i++) {
        if (coords[i] < 0) coords[i] += point_count;
        if (coords[i] >= point_count) coords[i] -= point_count;
    }
    return coords;
}