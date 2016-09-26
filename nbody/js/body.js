(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['util'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('util'));
    } else {
        // Browser globals (root is window)
        root.Body = factory(root.Util);
    }
} (this, function (Util) {

	function Body(id) {
		this.id = id;
		this.coord = [0, 0, 0];
		this.velocity = [0, 0, 0];		
		this.acceleration = [0, 0, 0];
		this.mass = 0.0;	
	}

	Body.prototype.setCoord = function (coord) {
		this.coord = coord.slice();	
		return this;
	}

	Body.prototype.setRandomCoord = function (min, max) {	
		return this.setCoord(Util.getRandomVector(min, max));	
	}

	Body.prototype.setVelocity = function (velocity) {
		this.velocity = velocity.slice();
		return this;
	}

	Body.prototype.setRandomVelocity = function (min, max) {	
		return this.setVelocity(Util.getRandomVector(min, max));	
	}

	Body.prototype.setMass = function (mass) {
		this.mass = mass;
		return this;
	}

	Body.prototype.setRandomMass = function (min, max) {
		return this.setMass(Util.getRandomInRange(min, max));
	}

	Body.prototype.computeAcceleration = function (otherBody) {
		var G = 6.673e-11;
	    var dx = otherBody.coord[0] - this.coord[0];
	    var dy = otherBody.coord[1] - this.coord[1];
	    var dz = otherBody.coord[2]- this.coord[2];    
	    var dist = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-12; // avoid zero distance
	    var temp = G*otherBody.mass/(dist*dist*dist); 
		return [temp*dx, temp*dy, temp*dz];
	}

	Body.prototype.addAccountFrom = function (otherBody) {
		return this.addAcceleration(this.computeAcceleration(otherBody));
	}

	Body.prototype.addAcceleration = function (acceleration) {
		Util.addVectors(this.acceleration, acceleration);	
		return this;
	}

	Body.prototype.resetAcceleration = function () {
		this.acceleration = [0, 0, 0];
		return this;
	}

	Body.prototype.prepareForUpdate = function () {
		return this.resetAcceleration();
	}

	Body.prototype.update = function (delta) {
		// r = r0 + v0*t + a*t*t/2
		var coordUpd = [0, 0, 0];
		coordUpd[0] = this.velocity[0]*delta + this.acceleration[0]*delta*delta*0.5;
		coordUpd[1] = this.velocity[1]*delta + this.acceleration[1]*delta*delta*0.5;
		coordUpd[2] = this.velocity[2]*delta + this.acceleration[2]*delta*delta*0.5;
		Util.addVectors(this.coord, coordUpd);
		// v = v0 + a*t;
		var velUpd = [0, 0, 0];
		velUpd[0] = this.acceleration[0]*delta;
		velUpd[1] = this.acceleration[1]*delta;
		velUpd[2] = this.acceleration[2]*delta;	
		Util.addVectors(this.velocity, velUpd);
		return this;
	}

	function generateRandomBodies(numOfBodies, minMass, maxMass) {
		var bodies = [];		
		for (var i = 0; i < numOfBodies; i++) {
			var body = new Body(i);
			body.setRandomCoord(-10, 10);
			body.setRandomVelocity(-0.5, 0.5);
			body.setRandomMass(minMass, maxMass);						
			bodies.push(body);
		}			
		return bodies;
	}

	function updateBodies(bodies, delta) {		
		bodies.forEach( function (body) {
			body.prepareForUpdate();
			bodies.forEach( function (otherBody) {
				if (body !== otherBody) {
					body.addAccountFrom(otherBody);
				}
			});
		});
		bodies.forEach( function (body) {
			body.update(delta);			
		});				
	}

	return {
		Body: Body,
		generateRandomBodies: generateRandomBodies,
		updateBodies: updateBodies
	}
}));
