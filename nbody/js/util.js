(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.Util = factory();
	}
} (this, function () {

	function getRandomInRange(min, max) {
		return Math.random() * (max - min) + min;
	}

	function getRandomArray(number, min, max) {
		var array = [];
		for (var i = 0; i < number; i++) {
			array.push(getRandomInt(min, max));
		}
		array.sort(function(a, b) {
  			if (a > b) return 1;
  			if (a < b) return -1;
		});
		return array;
	}
	function getRandomInt(min, max)
	{
	  return Math.floor(getRandomInRange(min, max));
	}


	function getRandomVector(min, max) {
		var x = getRandomInRange(min, max);
		var y = getRandomInRange(min, max);
		var z = getRandomInRange(min, max);
		return [x, y, z];
	}

	function lerpRadiusByMass(minRadius, maxRadius, mass, minMass, maxMass) {
		var t = (mass - minMass)/(maxMass - minMass);
		return minRadius*(1 - t) + (maxRadius - minRadius)*t;
	}

	function addVectors(dest, source) {
		dest[0] += source[0];
		dest[1] += source[1];
		dest[2] += source[2];	
	}

	return {
		getRandomInRange: getRandomInRange,
		getRandomArray : getRandomArray,
		getRandomVector: getRandomVector,
		lerpRadiusByMass: lerpRadiusByMass,
		addVectors: addVectors
	}
}));


